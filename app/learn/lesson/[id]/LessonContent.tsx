'use client'

import { Lesson, Prisma, UserCourse } from "@prisma/client";
import styles from './Lesson.module.scss';
import { KeyboardEventHandler, useEffect, useState } from "react";
import LessonScreen from "./LessonScreen";
import { LessonQuestion } from "./page";
import { useSound } from 'use-sound';
import ProgressBar from "@ramonak/react-progress-bar";
import variables from '../../../v.module.scss';
import { useRouter } from "next/navigation";
import { COMPLETIONS_FOR_LESSON_PASS, EXP_FOR_ALREADY_FINISHED_LESSON, EXP_FOR_LESSON_COMPLETE } from "@/lib/settings";
import { post } from "@/lib/api";
import { normalizeAnswer } from "@/lib/string_processing";

export type ScreenState = 'hiding' | 'visible' | 'appearing' | 'invisible';
export type LessonWithCourse = Prisma.LessonGetPayload<{include: {module: {include: {course: true}}}}>;

export default function LessonContent({ lesson, questions, userCourse, numLessons }: { lesson: LessonWithCourse, questions: LessonQuestion[], userCourse: UserCourse | null, numLessons: number }) {

    const numQuestions = questions.filter(q => q.type === 'QUESTION').length;

    const [ screens, setScreens ] = useState(questions);
    const [ currentQuestion, setCurrentQuestion ] = useState(0);
    const [ numCorrect, setNumCorrect ] = useState(0);

    const [ correct, setCorrect ] = useState(false);
    const [ incorrect, setIncorrect ] = useState(false);

    const [ userInput, setUserInput ] = useState('');
    const [ feedback, setFeedback ] = useState('');

    const [ transitioning, setTransitioning ] = useState(false);

    const [playDing] = useSound('/audio/ding.mp3');
    const [playWomp] = useSound('/audio/womp.mp3');

    const router = useRouter();

    /** 
     * TODO: include sound attribution
     */

    const focusInput = () => {
        const text = document.getElementById('main-input') as HTMLInputElement;
        text && text.focus();
    };

    const exp = userCourse ? ` (+${userCourse.lessonId === lesson.id && userCourse.moduleId === lesson.module.id ? EXP_FOR_LESSON_COMPLETE : EXP_FOR_ALREADY_FINISHED_LESSON} EXP)` : '';

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
        setIncorrect(true);
    };

    const handleNext = async () => {

        if (currentQuestion === screens.length - 1) {
            if (!userCourse) {
                let fullGuestSession = JSON.parse(localStorage.getItem('guestSession') || `{${lesson.module.courseId}: { moduleIndex: 0, lessonIndex: 0, lessonCompletions: 0 }}`);
                const guestSession = fullGuestSession[lesson.module.courseId];
                if (guestSession.moduleIndex === lesson.module.index && guestSession.lessonIndex === lesson.index) {
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
                    fullGuestSession[lesson.module.courseId] = guestSession;
                    localStorage.setItem('guestSession', fullGuestSession);
                }
            } else {
                const payload = {
                    date: new Date().toDateString(),
                    lessonId: lesson.id,
                }

                const res = await post(`/api/userCourse/${userCourse.id}/completeLesson`, payload);
                const data = await res.json();
            }
            playDing();
            setTransitioning(true);
            router.push(`/learn/course/${lesson.module.courseId}`);
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
        <div className={styles.container}>
            <div className={styles.lessonTopBar}>
                <div>
                    <button onClick={() => router.push(`/learn/course/${lesson.module.courseId}`)}>EXIT</button>
                    <button onClick={() => location.reload()}>RESTART</button>
                </div>
                
                <ProgressBar customLabel={`${numCorrect}/${numQuestions}`} completed={Math.floor(numCorrect * 100 / numQuestions)} baseBgColor={variables.darkbackground} bgColor={variables.orange} labelClassName={styles.progressBarLabel} />
            </div>
            <div className={styles.lessonMain}>
                <LessonScreen language={lesson.module.course.language} question={screens[currentQuestion]} userInput={userInput} state={transitioning ? 'hiding' : 'visible'} onUserInput={setUserInput} correct={correct} incorrect={incorrect} feedback={feedback} />
                {screens[currentQuestion + 1] && <LessonScreen language={lesson.module.course.language} question={screens[currentQuestion + 1]} userInput={userInput} onUserInput={setUserInput} state={transitioning ? 'appearing' : 'invisible'} />}
            </div>
            <div className={styles.lessonBottomBar}>
                <button onClick={handleIncorrect} style={{visibility: incorrect || correct || screens[currentQuestion].type === 'INFO' ? 'hidden' : 'visible'}} className="orange">SKIP</button>
                <button className="blue" onClick={handleButtonClick}>{correct || incorrect ? (currentQuestion === screens.length - 1 ? `FINISH LESSON${exp}` : 'NEXT QUESTION') : screens[currentQuestion].type === 'INFO' ? (currentQuestion === screens.length - 1 ? `FINISH LESSON${exp}` : 'CONTINUE') : 'SUBMIT'}</button>
            </div>
        </div>
    );
}