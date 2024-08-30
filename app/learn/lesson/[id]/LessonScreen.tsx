import { Prisma } from '@prisma/client';
import styles from './Lesson.module.scss';
import { ScreenState } from './LessonContent';
import cn from 'classnames';
import { LessonQuestion } from './page';
import { AiFillAudio, AiFillSound } from 'react-icons/ai';
import { useEffect, useState } from 'react';
import { getMainVariant, getQuestionTokens, getSynonyms, stripInnerDelimiter } from '@/lib/string_processing';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import keyboardLayoutLib from '@/lib/keyboards/mongolian'

export const playRecording = (recording: string | null) => {

    if (!recording) return;
    fetch(recording).then(async res => {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
    });
};


export default function LessonScreen({ question, userInput, onUserInput, onUserSubmit, state, language, correct, incorrect, feedback}: { question: LessonQuestion, userInput: string, onUserInput: (value: string) => void, onUserSubmit: () => void, state: ScreenState, language: string, correct?: boolean, incorrect?: boolean, feedback?: string}) {

    const questionWords = getQuestionTokens(question.question);
    const [ hintIndex, setHintIndex ] = useState(-1);
    const [ audioPlayed, setAudioPlayed ] = useState(false);
    const [ keyboardLayout, setKeyboardLayout ] = useState<'default' | 'shift'>('default');
    const [ isKeyboardLocked, setKeyboardLocked ] = useState<boolean>(false);

    useEffect(() => {
        if (state === 'visible' && question.recording && question.questionType !== 'forward' && !audioPlayed) {
            playRecording(question.recording);
            setAudioPlayed(true);
        }
        if (state === 'hiding') {
            setAudioPlayed(false);
        }
    }, [state]);

    // Show hint and play sound for vocab words
    useEffect(() => {
        const showVocabHint = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement) {
                const word = e.target.dataset.word?.toLowerCase();
                let wordEntity;
                if (word && (wordEntity = question.vocabWords[word])) {
                    const htmlText = ` 
                        <div class="${styles.hintContainer} ${styles.visible}"> 
                            <div>${wordEntity.target}</div>
                            <div>${wordEntity.native}</div>
                            ${(getSynonyms(wordEntity.nativeAlt).map(syn => `<div>${syn}</div>`) || []).join('\n')}
                        </div>
                        `
                    e.target.insertAdjacentHTML('beforeend', htmlText);
                    playRecording(wordEntity.recording);
                }
            }
        };

        const hideVocabHint = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement) {
                const word = e.target.dataset.word;
                if (word) {
                    e.target.innerHTML = word;
                }
            }
        };

        const vocabWordElts = document.getElementsByClassName('lesson-vocab-word');
        for (let i = 0; i < vocabWordElts.length; i++) {
            const elt = vocabWordElts[i];
            if (elt instanceof HTMLSpanElement) {
                elt.addEventListener('mouseenter', showVocabHint);
                elt.addEventListener('mouseleave', hideVocabHint);
            }
        }

        return () => {
            const vocabWordElts = document.getElementsByClassName('lesson-vocab-word');
            for (let i = 0; i < vocabWordElts.length; i++) {
                const elt = vocabWordElts[i];
                if (elt instanceof HTMLSpanElement) {
                    elt.removeEventListener('mouseenter', showVocabHint);
                    elt.removeEventListener('mouseleave', hideVocabHint);
                }
            }
        }
    }, [question]);

    // Show hint and play sound for sentences
    useEffect(() => {
        const showSentenceHint = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement) {
                const sentenceId = parseInt(e.target.dataset.id || '');
                let sentenceEntity;
                if (sentenceId && (sentenceEntity = question.vocabSentences[sentenceId])) {
                    const htmlText = `
                        <div class="${styles.hintContainer} ${styles.visible}">
                            <div>${getMainVariant(sentenceEntity.native)}</div>
                        </div>
                    `
                    e.target.insertAdjacentHTML('beforeend', htmlText);
                    playRecording(sentenceEntity.recording);
                }
            }
        };

        const hideSentenceHint = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement) {
                const id = parseInt(e.target.dataset.id || '');
                if (id && question.vocabSentences[id]) {
                    e.target.innerHTML = getMainVariant(question.vocabSentences[id].target);
                }
            }
        };

        const vocabSentenceElts = document.getElementsByClassName('lesson-sentence');
        for (let i = 0; i < vocabSentenceElts.length; i++) {
            const elt = vocabSentenceElts[i];
            if (elt instanceof HTMLSpanElement) {
                elt.addEventListener('mouseenter', showSentenceHint);
                elt.addEventListener('mouseleave', hideSentenceHint);
            }
        }

        return () => {
            const vocabSentenceElts = document.getElementsByClassName('lesson-sentence');
            for (let i = 0; i < vocabSentenceElts.length; i++) {
                const elt = vocabSentenceElts[i];
                if (elt instanceof HTMLSpanElement) {
                    elt.removeEventListener('mouseenter', showSentenceHint);
                    elt.removeEventListener('mouseleave', hideSentenceHint);
                }
            }
        }
    }, [question]);

    const keyboardPressed = (input: string) => {
        if (correct || incorrect) return;

        if (input == '{bksp}') {
            userInput.length > 0 && onUserInput(userInput.substring(0, userInput.length - 1));
        } else if (input == '{shift}') {
            if (!isKeyboardLocked) {
                setKeyboardLayout(keyboardLayout == 'shift' ? 'default' : 'shift');
            }
        } else if (input == '{space}') {
            onUserInput(userInput + ' ');
        } else if (input == '{lock}') {
            if (isKeyboardLocked) {
                setKeyboardLayout('default');
                setKeyboardLocked(false);
            } else {
                setKeyboardLayout('shift');
                setKeyboardLocked(true);
            }
        } else if (input == '{enter}') {
            onUserSubmit();
        } else {
            onUserInput(userInput + input);
            if (!isKeyboardLocked && keyboardLayout == 'shift') {
                setKeyboardLayout('default');
            }
        }
    }

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
                        {question.questionType === 'audio' && <div className={styles.question}>{<i>Translate what you hear!</i>}</div>}
                        {question.questionType === 'forward' && 
                        <div className={styles.questionWords}>
                            {question.wordHintsForward.map((hint, index) => {
                                return (
                                    <div key={index}>
                                        <div className={cn(styles.questionToken, {[styles.noSpace]: hint.noSpace})} onMouseEnter={() => setHintIndex(index)} onMouseLeave={() => setHintIndex(-1)}>
                                            {questionWords && questionWords[index]}
                                            {hint.wordEntity &&
                                            <div className={cn(styles.hintContainer, {[styles.visible]: index === hintIndex})}>
                                                <div>{hint.wordEntity.native}</div>
                                                <div>{hint.wordEntity.target}</div>
                                                {getSynonyms(hint.wordEntity.targetAlt).map(syn => <div>{syn}</div>)}
                                            </div>
                                            }
                                        </div>
                                    </div>
                                )
                            })}
                        </div>}
                        {question.questionType === 'backward' && 
                        <div className={styles.questionWords}>
                            {question.wordHintsBackward.map((hint, index) => {
                                return (
                                    <div key={index}>
                                        <div className={cn(styles.questionToken, {[styles.noSpace]: hint.noSpace})} onMouseEnter={() => setHintIndex(index)} onMouseLeave={() => setHintIndex(-1)}>
                                            {questionWords && questionWords[index]}
                                            {hint.wordEntity &&
                                            <div className={cn(styles.hintContainer, {[styles.visible]: index === hintIndex})}>
                                                <div>{hint.wordEntity.target}</div>
                                                <div>{hint.wordEntity.native}</div>
                                                {getSynonyms(hint.wordEntity.nativeAlt).map(syn => <div>{syn}</div>)}
                                            </div>
                                            }
                                        </div>
                                    </div>
                                )
                            })}
                        </div>}
                    </div>
                    <input autoComplete='off' disabled={correct || incorrect} id={state === 'visible' || state === 'hiding' ? 'main-input' : 'hidden-input'} type="text" placeholder='Type your answer' value={userInput} onChange={e => onUserInput(e.target.value)} />
                    <div className={styles.border} style={{visibility: correct || incorrect ? 'visible': 'hidden'}}></div>
                    <div className={cn(styles.answerContainer, {[styles.visible]: correct || incorrect})}>
                        <div className={cn(styles.result, {[styles.wrong]: incorrect})}>{correct ? 'GREAT JOB!' : 'OOPS...'}</div>
                        <div className={styles.answer}>"{question.question}" {question.questionType === 'forward' ? 'translates to' : 'means'} "{stripInnerDelimiter(question.answers[0])}"</div>
                        {feedback && <div className={styles.answer}><b>{feedback}</b></div>}
                    </div>
                    <Keyboard onKeyPress={keyboardPressed} layout={keyboardLayoutLib.layout} layoutName={keyboardLayout} />
                </div>
            )}
            </div>
        </div>
    );
}