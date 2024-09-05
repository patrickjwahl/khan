'use client'

import { Question, Word } from "@prisma/client";
import styles from '../../Mobile.module.scss';
import { ChangeEventHandler, MouseEventHandler, useState } from "react";
import { FaStop } from "react-icons/fa";
import { BsFillPlayCircleFill, BsRecordCircleFill } from "react-icons/bs";
import audioRecorder from "@/lib/audio";
import { ClipLoader } from "react-spinners";
import variables from '../../../../_variables.module.scss'
import { convertBlobToURL } from "@/app/admin/module/[id]/ScreenDisplay";
import { post } from "@/lib/api";
import { getMainVariant, stripInnerDelimiter } from "@/lib/string_processing";

export default function ModuleMobileDashboard({ initQuestions, initWords, moduleTitle }: { initQuestions: Question[], initWords: Word[], moduleTitle: string }) {

    const [ isFiltered, setIsFiltered ] = useState(true);
    const [ questions, setQuestions ] = useState(initQuestions.filter(q => q.recording == null));
    const [ words, setWords ] = useState(initWords.filter(w => w.recording == null));
    const [ selected, setSelected ] = useState(-1);
    const [ audioRecording, setAudioRecording ] = useState(false);
    const [ audioBlob, setAudioBlob ] = useState<null | Blob>(null);
    const [ isSubmitting, setIsSubmitting ] = useState(false);

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

    const selectTask = (index: number) => {

        if (index == selected) return;

        setSelected(index);
        const selectedRecording = index < questions.length ? questions[index].recording : words[index - questions.length].recording

        if (selectedRecording) {
            fetch(selectedRecording).then(res => res.blob()).then(blob => {
                setAudioBlob(blob);
            });
        } else {
            setAudioBlob(null);
        }
    }

    const toggleIsFiltered: ChangeEventHandler<HTMLInputElement> = () => {
        if (!isFiltered) {
            setQuestions(initQuestions.filter(q => q.recording == null))
            setWords(initWords.filter(w => w.recording == null))
        } else {
            setQuestions(initQuestions)
            setWords(initWords)
        }
        setIsFiltered(!isFiltered)
        setSelected(-1)
    }

    const update: MouseEventHandler = async () => {
        setIsSubmitting(true);
        const audioURL = await convertBlobToURL(audioBlob)
        let payload = {
            recording: audioURL
        }

        let id, url;
        if (selected < questions.length) {
            id = questions[selected].id;
            url = `/api/question/${id}/audio`
        } else {
            id = words[selected - questions.length].id
            url = `/api/word/${id}/audio`
        }

        const res = await post(url, payload)
        await res.json()

        window.location.reload()
    }

    const audioForm = (
        <div className={styles.audioForm}>
            <div className={styles.formSectionHeader}>RECORD AUDIO</div>
            <div className={styles.audioButtonsContainer}>
                {audioRecording ? <button onClick={stopRecording} className={styles.stopButton}><FaStop /></button> 
                : <button onClick={startRecording} className={styles.recordButton}><BsRecordCircleFill /></button>}
                {!audioRecording && audioBlob != null ? <button onClick={playAudio} className={styles.stopButton}><BsFillPlayCircleFill /></button> : (null)}
            </div>
            {!isSubmitting ? <button onClick={update}>Update</button> : <ClipLoader color={variables.themeRed} loading={true} />}
        </div>
    );
    
    return (
        <div className={styles.container}>
            <h1>{moduleTitle}</h1>
            <p>Course editing functionality is limited to recording audio on mobile devices. For full functionality, use a desktop.</p>
            <div className={styles.filterButtonRow}>
                <label>
                    <input checked={isFiltered} onChange={toggleIsFiltered} type="checkbox" />
                    Only show words without recordings
                </label>
            </div>
            <ul className={styles.taskList}>
                {questions.filter(question => !isFiltered || question.recording == null).map((question, index) => (
                    <li key={index} onClick={() => selectTask(index)}>
                        <div>{stripInnerDelimiter(getMainVariant(question.target))}</div>
                        {selected == index ? audioForm : (null)}
                    </li>
                ))}
                {words.filter(word => !isFiltered || word.recording == null).map((word, index) => (
                    <li key={questions.length + index} onClick={() => selectTask(questions.length + index)}>
                        <div>{word.target}</div>
                        {selected == questions.length + index ? audioForm : (null)}
                    </li>
                ))}
            </ul>
        </div>
    )
}