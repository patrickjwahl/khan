import { Prisma } from '@prisma/client';
import styles from './Lesson.module.scss';
import { ScreenState } from './LessonContent';
import cn from 'classnames';
import { LessonQuestion } from './page';
import { AiFillAudio, AiFillSound } from 'react-icons/ai';
import { useEffect, useState } from 'react';

export const playRecording = (recording: string | null) => {

    if (!recording) return;
    fetch(recording).then(async res => {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
    });
};


export default function LessonScreen({ question, userInput, onUserInput, state, language, correct, incorrect, feedback}: { question: LessonQuestion, userInput: string, onUserInput: (value: string) => void, state: ScreenState, language: string, correct?: boolean, incorrect?: boolean, feedback?: string}) {

    const questionWords = question.question?.split(' ');
    const [ hintIndex, setHintIndex ] = useState(-1);
    const [ audioPlayed, setAudioPlayed ] = useState(false);

    useEffect(() => {
        if (state === 'visible' && question.recording && question.questionType !== 'forward' && !audioPlayed) {
            playRecording(question.recording);
            setAudioPlayed(true);
        }
        if (state === 'hiding') {
            setAudioPlayed(false);
        }
    }, [state]);

    return (
        <div className={cn(styles.screenContainer, {[styles.invisible]: state === 'invisible', [styles.hiding]: state === 'hiding', [styles.visible]: state === 'visible', [styles.appearing]: state === 'appearing'})}>
            <div className={styles.screenContent}>
            {question.type === 'INFO' ? (
                <div className={styles.infoContent}>
                    <h5>Lesson: {question.infoTitle}</h5>
                    {question.info && <div dangerouslySetInnerHTML={{__html: question.info}} />}
                </div>
            ) : (
                <div className={styles.questionContent}>
                    <div className={styles.prompt}>Translate this sentence into {question.questionType === 'forward' ? language : 'English'}:</div>
                    <div className={styles.questionTextContainer}>
                        {question.questionType !== 'forward' && question.recording && <button onClick={() => playRecording(question.recording)}><AiFillSound /></button>}
                        {(question.questionType === 'forward' || question.questionType === 'audio') && <div className={styles.question}>{question.questionType === 'forward' ? <span>{question.question}</span> : <i>Translate what you hear!</i>}</div>}
                        {question.questionType === 'backward' && 
                        <div className={styles.questionWords}>
                            {question.wordHints.map((hint, index) => {
                                return (
                                    <div key={index}>
                                        <div onMouseEnter={() => setHintIndex(index)} onMouseLeave={() => setHintIndex(-1)}>{questionWords && questionWords[index]}</div>
                                        {hint.wordEntity &&
                                        <div className={cn(styles.hintContainer, {[styles.visible]: index === hintIndex})}>
                                            <div>{hint.wordEntity.target}</div>
                                            <div>{hint.wordEntity?.native}</div>
                                        </div>
                                        }
                                    </div>
                                )
                            })}
                        </div>}
                    </div>
                    <input id={state === 'visible' || state === 'hiding' ? 'main-input' : 'hidden-input'} type="text" placeholder='Type your answer' value={userInput} onChange={e => onUserInput(e.target.value)} />
                    <div className={styles.border} style={{visibility: correct || incorrect ? 'visible': 'hidden'}}></div>
                    <div className={cn(styles.answerContainer, {[styles.visible]: correct || incorrect})}>
                        <div className={cn(styles.result, {[styles.wrong]: incorrect})}>{correct ? 'GREAT JOB!' : 'OOPS...'}</div>
                        <div className={styles.answer}>"{question.question}" {question.questionType === 'forward' ? 'translates to' : 'means'} "{question.answers[0]}"</div>
                        {feedback && <div className={styles.answer}><b>{feedback}</b></div>}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}