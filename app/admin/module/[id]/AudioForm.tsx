'use client'
import { MouseEventHandler, useState } from 'react';
import styles from '../../Admin.module.scss';
import audioRecorder from '@/lib/audio';
import { BsFillPlayCircleFill, BsRecordCircleFill } from 'react-icons/bs';
import { FaStop } from 'react-icons/fa';

export default function AudioForm({ audioBlob, setAudioBlob }: { audioBlob: null | Blob, setAudioBlob: (blob: null | Blob) => void}) {

    const [ isAudioRecording, setIsAudioRecording ] = useState<boolean>(false);

    const startRecording: MouseEventHandler = async e => {
        e.preventDefault();

        await audioRecorder.start();
        setIsAudioRecording(true);
    }

    const stopRecording: MouseEventHandler = async e => {

        e.preventDefault();

        const audioAsBlob = await audioRecorder.stop();

        setIsAudioRecording(false);
        setAudioBlob(audioAsBlob);
    }

    const playAudio: MouseEventHandler = e => {

        e.preventDefault();
        if (!audioBlob) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    };

    return (
        <div className={styles.audioButtonsContainer}>
            {isAudioRecording ? <button onClick={stopRecording} className={styles.stopButton}><FaStop /></button> 
            : <button onClick={startRecording} className={styles.recordButton}><BsRecordCircleFill /></button>}
            {!isAudioRecording && audioBlob != null ? <button onClick={playAudio} className={styles.stopButton}><BsFillPlayCircleFill /></button> : (null)}
        </div>
    )
}