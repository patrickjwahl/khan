import { Question, Word } from "@prisma/client";
import styles from '../../Admin.module.scss';
import React, { FormEventHandler, MouseEventHandler, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import variables from '../../../_variables.module.scss';
import { ModuleWithLessonsAndCourse } from "./ModuleDashboard";
import audioRecorder from "@/lib/audio";
import { FaStop } from "react-icons/fa";
import { BsFillPlayCircleFill, BsRecordCircleFill } from "react-icons/bs";
import { convertBlobToURL } from "./ScreenDisplay";
import cn from 'classnames';
import { AiFillSound } from 'react-icons/ai';
import { TiDelete } from "react-icons/ti";
import Link from "next/link";

export default function WordDisplay({initWords, module, initWordsToQuestions, setQuestion}: {initWords: Word[], module: ModuleWithLessonsAndCourse, initWordsToQuestions: {[id: number]: Question[]}, setQuestion: (id: Question) => void}) {

    const [ words, setWords ] = useState(initWords);
    const [ wordsToQuestions, setWordsToQuestions ] = useState(initWordsToQuestions);

    const [selectedWord, setSelectedWord] = useState(-1);
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const [ wordId, setWordId ] = useState<null | number>(null);
    const [ target, setTarget ] = useState('');
    const [ native, setNative ] = useState('');
    const [ audioBlob, setAudioBlob ] = useState<null | Blob>(null);

    const [ audioRecording, setAudioRecording ] = useState(false);

    const topRef = useRef<HTMLInputElement | null>(null);

    const startRecording: MouseEventHandler = async e => {
        e.preventDefault();

        await audioRecorder.start();
        setAudioRecording(true);
    }

    const stopRecording: MouseEventHandler = async e => {

        e.preventDefault();

        const audioAsBlob = await audioRecorder.stop();

        setAudioRecording(false);
        setAudioBlob(audioAsBlob);
    }

    const playAudio: MouseEventHandler = e => {

        e.preventDefault();
        if (!audioBlob) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    };

    const fetchWords = async () => {
        const res = await fetch(`/api/module/${module.id}/words`);
        const data = await res.json();
        setWordsToQuestions(data.wordsToQuestions);
        setWords(data.words);
    };

    const deleteWord = async (e: React.MouseEvent, word: Word) => {
        e.stopPropagation();

        const res = await fetch(`/api/word/${word.id}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        fetchWords();
    };

    const editWord = (word: Word) => {
        if (word.recording) {
            fetch(word.recording).then(res => res.blob()).then(blob => {
                setAudioBlob(blob);
            });
        } else {
            setAudioBlob(null);
        }
        setWordId(word.id);
        setTarget(word.target);
        setNative(word.native);

        setSelectedWord(word.id);
    }

    const newWord = () => {

        setWordId(null);
        setTarget('');
        setNative('');
        setAudioBlob(null);
        
        setSelectedWord(-1);
        topRef.current && topRef.current.focus();
    }

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        if (!target || !native) return;

        setIsSubmitting(true);

        const audioURL = await convertBlobToURL(audioBlob);

        let payload: Word = {
            id: wordId || -1,
            target: target,
            native: native,
            moduleId: module.id,
            recording: audioURL
        };

        const url = wordId ? `/api/word/${wordId}` : '/api/word';

        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        newWord();
        fetchWords();

        setIsSubmitting(false);
    }

    const audioForm = (
        <>
            <div className={styles.formSectionHeader}>RECORD AUDIO</div>
            <div className={styles.audioButtonsContainer}>
                {audioRecording ? <button onClick={stopRecording} className={styles.stopButton}><FaStop /></button> 
                : <button onClick={startRecording} className={styles.recordButton}><BsRecordCircleFill /></button>}
                {!audioRecording && audioBlob != null ? <button onClick={playAudio} className={styles.stopButton}><BsFillPlayCircleFill /></button> : (null)}
            </div>
        </>
    );

    const uploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !window.confirm("WARNING! This will overwrite all current words! Continue?")) return;
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        const res = await fetch(`/api/module/${module.id}/csv/words`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        location.reload();
    }

    return (
        <div className={styles.lessonContentContainer}>
            <div className={styles.lessonViewContainer}>
                <h5>MODULE WORDS</h5>
                <div className={styles.wordsListContainer}>
                    {words.length > 0 && words.map(word => {
                        return(
                            <div key={word.id} onClick={() => editWord(word)} className={cn(styles.wordContainer, {[styles.active]: selectedWord === word.id})}>
                                {word.target}
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}>
                                {word.recording && <AiFillSound />}
                                <button onClick={e => deleteWord(e, word)} className={styles.iconButton}><TiDelete style={{color: variables.themeRed, fontSize: '1.6rem'}} /></button>
                                </div>
                            </div>
                        );
                    })}
                    {words.length === 0 && <div style={{fontStyle: 'italic', marginTop: '1rem'}}>No words yet! Create them with the word editor!</div>}
                </div>
                {!module.published && (<div className={styles.csvLoader}>
                    <label>
                        LOAD FROM CSV
                        <input onChange={uploadCSV} type='file' accept='.csv' />
                    </label>
                    <Link target="_blank" href='/admin/csv'><div>Learn more</div></Link>
                </div>)}
            </div>
            <div className={styles.lessonViewContainer}>
                <h5>QUESTIONS</h5>
                {selectedWord >= 0 && wordsToQuestions[selectedWord].map(question => {
                    return (<div key={question.id} onClick={() => setQuestion(question)} className={styles.wordContainer}>
                        {question.target?.split('\n')[0]}
                    </div>);
                })}
                {selectedWord >= 0 && wordsToQuestions[selectedWord].length === 0 && <div style={{fontStyle: 'italic', marginTop: '1rem'}}>This word isn't used in any questions... it's up to you to change that!</div>}
                {selectedWord < 0 && <div style={{fontStyle: 'italic', marginTop: '1rem'}}>Select a word to see what questions it's used in.</div>}
            </div>
            <div className={styles.editor}>
                <div>
                    <form onSubmit={submitClicked}>
                        <div className={styles.formTopRow}>
                            <h5>WORD EDITOR</h5>
                            <div>
                                {wordId ? <button onClick={e => {e.preventDefault(); newWord()}}>CREATE NEW</button> : (null)}
                                {!isSubmitting ? <input type="submit" value={!wordId ? "CREATE" : "UPDATE"} /> : 
                                <ClipLoader color={variables.themeRed} loading={true} />}
                            </div>
                        </div>
                        <input ref={topRef} type="text" placeholder={`Word in ${module.course.language}`} value={target} onChange={e => setTarget(e.target.value.toLowerCase())} />
                        <input type="text" placeholder={`Meaning(s) in English`} value={native} onChange={e => setNative(e.target.value)} />
                        {audioForm}
                    </form>
                </div>
            </div>
        </div>
    );
}