'use client'

import { Lesson, Prisma, UserCourse } from "@prisma/client";
import styles from './Lesson.module.scss';
import { useEffect, useState } from "react";
import LessonScreen from "./LessonScreen";
import { LessonQuestion } from "./page";
import { useSound } from 'use-sound';
import ProgressBar from "@ramonak/react-progress-bar";
import variables from '../../../v.module.scss';
import { useRouter } from "next/navigation";
import { COMPLETIONS_FOR_LESSON_PASS, EXP_FOR_ALREADY_FINISHED_LESSON, EXP_FOR_LESSON_COMPLETE, TEST_LIVES } from "@/lib/settings";
import { post } from "@/lib/api";
import { normalizeAnswer } from "@/lib/string_processing";
import ErrorScreen from "../../ErrorScreen";
import cn from 'classnames'
import { GoHeartFill } from "react-icons/go";
import { Theme } from "@/app/GlobalState"

export type ScreenState = 'hiding' | 'visible' | 'appearing' | 'invisible'
export type LessonMode = 'lesson' | 'practice' | 'test'
export type ModuleWithCourse = Prisma.ModuleGetPayload<{include: {course: true}}>

export default function LessonContent({ lesson = null, module, mode, questions, userCourse, numLessons, theme = 'light' }: { lesson?: Lesson | null, module: ModuleWithCourse, mode: LessonMode, questions: LessonQuestion[], userCourse: UserCourse | null, numLessons: number, theme?: Theme }) {

    const numQuestions = questions.filter(q => q.type === 'QUESTION').length;

    const [ screens, setScreens ] = useState(questions);
    const [ currentQuestion, setCurrentQuestion ] = useState(0);
    const [ numCorrect, setNumCorrect ] = useState(0);
    const [ lives, setLives ] = useState(TEST_LIVES)

    const [ correct, setCorrect ] = useState(false);
    const [ incorrect, setIncorrect ] = useState(false);
    const [ failed, setFailed ] = useState(false);

    const [ userInput, setUserInput ] = useState('');
    const [ feedback, setFeedback ] = useState('');

    const [ transitioning, setTransitioning ] = useState(false);

    const [playDing] = useSound('/audio/ding.mp3');
    const [playWomp] = useSound('/audio/womp.mp3');
    const [playHorn] = useSound('/audio/party.mp3');

    const router = useRouter();

    /** 
     * TODO: include sound attribution
     */

    const focusInput = () => {
        const text = document.getElementById('main-input') as HTMLInputElement;
        text && text.focus();
    };

    if (mode === 'lesson' && !lesson) {
        return <ErrorScreen error="An error occurred. Sorry." />
    }

    let exp
    if (mode === 'lesson' && lesson) {
        exp = userCourse ? ` (+${userCourse.lessonId === lesson.id && userCourse.moduleId === module.id ? EXP_FOR_LESSON_COMPLETE : EXP_FOR_ALREADY_FINISHED_LESSON} EXP)` : '';
    } else {
        exp = EXP_FOR_ALREADY_FINISHED_LESSON
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Enter') {
            handleButtonClick();
        }
    };

    useEffect(() => {
        focusInput();

        window.addEventListener('keydown', handleKeyDown);
        return () => {window.removeEventListener('keydown', handleKeyDown)}
    }, [currentQuestion, correct, incorrect, userInput, screens, numCorrect]);

    const handleCorrect = () => {
        setNumCorrect(numCorrect + 1);
        setCorrect(true);
        playDing();
    };

    const handleIncorrect = () => {
        playWomp();
        setScreens([...screens, screens[currentQuestion]]);
        if (mode === 'test' && lives == 1) {
            setLives(0)
            setIncorrect(true)
            setFailed(true);
        } else {
            setIncorrect(true)
            if (mode === 'test') setLives(lives - 1)
        }
    };

    const handleNext = async () => {

        if (failed) {
            window.location.href = `/learn/course/${module.course.id}`
            return;
        }

        if (currentQuestion === screens.length - 1) {
            if (mode === 'lesson' && lesson) {
                if (!userCourse) {
                    let fullGuestSession = JSON.parse(localStorage.getItem('guestSession') || `{${module.courseId}: { moduleIndex: 0, lessonIndex: 0, lessonCompletions: 0 }}`);
                    const guestSession = fullGuestSession[module.courseId];
                    if (guestSession.moduleIndex === module.index && guestSession.lessonIndex === lesson.index) {
                        guestSession.lessonCompletions = guestSession.lessonCompletions + 1;
                        if (guestSession.lessonCompletions === COMPLETIONS_FOR_LESSON_PASS) {
                            guestSession.lessonIndex = lesson.index + 1;
                            guestSession.lessonCompletions = 0;

                            if (guestSession.lessonIndex === numLessons) {
                                guestSession.moduleIndex = guestSession.moduleIndex + 1;
                                guestSession.lessonCompletions = 0;
                                guestSession.lessonIndex = 0;
                            }
                        }
                        fullGuestSession[module.courseId] = guestSession;
                        localStorage.setItem('guestSession', fullGuestSession);
                    }
                } else {
                    const payload = {
                        date: new Date().toDateString(),
                        lessonId: lesson.id,
                        moduleId: null,
                        isTest: false
                    }

                    await post(`/api/userCourse/${userCourse.id}/completeLesson`, payload);
                }
            } else if (mode === 'practice' && userCourse) {
                const payload = {
                    date: new Date().toDateString(),
                    lessonId: null,
                    moduleId: module.id,
                    isTest: false
                }
                await post(`/api/userCourse/${userCourse.id}/completeLesson`, payload)
            } else if (mode === 'test' && userCourse) {
                const payload = {
                    date: new Date().toDateString(),
                    lessonId: null,
                    moduleId: module.id,
                    isTest: true
                }
                await post(`/api/userCourse/${userCourse.id}/completeLesson`, payload)
            }
            playHorn();
            setTransitioning(true);
            router.push(`/learn/course/${module.courseId}`);
            return;
        }

        setTransitioning(true);
        setUserInput('');

        setTimeout(() => {
            setCurrentQuestion(curr => {
                return curr + 1;
            });
            setTransitioning(false);
            setCorrect(false);
            setIncorrect(false);
            setFeedback('');
            focusInput();
        }, 250);
    };

    const checkAnswer = () => {
        const q = screens[currentQuestion];
        const possibleAnswers = q.answers.map(normalizeAnswer);

        const userAnswer = normalizeAnswer(userInput);

        q.feedbackRules.forEach(rule => {
            if (userAnswer === normalizeAnswer(rule.trigger)) {
                setFeedback(rule.feedback);
            }
        });

        if (possibleAnswers.includes(userAnswer)) {
            handleCorrect();
        } else {
            handleIncorrect();
        }
    };

    const handleButtonClick = () => {

        if (correct || incorrect || screens[currentQuestion].type === 'INFO' ) {
            handleNext();
        } else {
            if (!userInput) return;
            checkAnswer();
        }
    }

    return (
        <div className={cn(styles.container, {[styles.test]: mode === 'test'})}>
            <div className={styles.lessonTopBar}>
                <div>
                    <button onClick={() => router.push(`/learn/course/${module.courseId}`)}>EXIT</button>
                    <button onClick={() => location.reload()}>RESTART</button>
                </div>
                
                <ProgressBar customLabel={`${numCorrect}/${numQuestions}`} completed={Math.floor(numCorrect * 100 / numQuestions)} baseBgColor={theme === 'light' ? variables.darkbackground : variables.lightforeground} bgColor={variables.orange} labelClassName={styles.progressBarLabel} />
            </div>
            {mode === 'test' && (
                <div className={styles.livesDisplay}>
                    {Array(lives).fill(null).map(_ => <span><GoHeartFill /></span>)}
                </div>
            )}
            <div className={styles.lessonMain}>
                <LessonScreen language={module.course.language} question={screens[currentQuestion]} userInput={userInput} state={transitioning ? 'hiding' : 'visible'} onUserInput={setUserInput} onUserSubmit={handleButtonClick} correct={correct} incorrect={incorrect} failed={failed} feedback={feedback} isTest={mode === 'test'} />
                {screens[currentQuestion + 1] && <LessonScreen language={module.course.language} question={screens[currentQuestion + 1]} userInput={userInput} onUserInput={setUserInput} onUserSubmit={handleButtonClick} state={transitioning ? 'appearing' : 'invisible'} isTest={mode === 'test'} />}
            </div>
            <div className={styles.lessonBottomBar}>
                {!(mode === 'test') && <button onClick={handleIncorrect} style={{visibility: incorrect || correct || screens[currentQuestion].type === 'INFO' ? 'hidden' : 'visible'}} className="orange">SKIP</button>}
                <button className="blue" onClick={handleButtonClick}>{failed ? 'KEEP PRACTICING' : (correct || incorrect ? (currentQuestion === screens.length - 1 ? `FINISH LESSON${exp}` : 'NEXT QUESTION') : screens[currentQuestion].type === 'INFO' ? (currentQuestion === screens.length - 1 ? `FINISH LESSON${exp}` : 'CONTINUE') : 'SUBMIT')}</button>
            </div>
        </div>
    );
}