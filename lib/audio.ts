'use client'

import { Question } from "@prisma/client";

interface AudioRecorder {
    audioBlobs: Blob[];
    mediaRecorder: MediaRecorder | null;
    streamBeingCaptured: MediaStream | null;

    start: () => Promise<void>;
    stop: () => Promise<Blob>;
    stopStream: () => void;
    resetRecordingProperties: () => void;
    cancel: () => void;
}

const audioRecorder: AudioRecorder = {

    audioBlobs: [],
    mediaRecorder: null,
    streamBeingCaptured: null,


    start: async () => {

        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            throw new Error("No recording capability");
        }

        return navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            audioRecorder.streamBeingCaptured = stream;
            audioRecorder.mediaRecorder = new MediaRecorder(stream);
            audioRecorder.audioBlobs = [];

            audioRecorder.mediaRecorder.addEventListener('dataavailable', e => {
                audioRecorder.audioBlobs.push(e.data);
            });

            audioRecorder.mediaRecorder.start();
        })
        
    },

    stop: () => {

        return new Promise(resolve => {
            if (!audioRecorder.mediaRecorder || !audioRecorder.streamBeingCaptured) return;

            let mimeType = audioRecorder.mediaRecorder.mimeType;
            audioRecorder.mediaRecorder.addEventListener('stop', () => {
                const blob = new Blob(audioRecorder.audioBlobs, {type: mimeType});
                resolve(blob);
            });

            audioRecorder.mediaRecorder.stop();
            audioRecorder.stopStream();
            audioRecorder.resetRecordingProperties();
        });
    },

    stopStream: () => {

        if (!audioRecorder.streamBeingCaptured) return null;

        audioRecorder.streamBeingCaptured.getTracks().forEach(track => {
            track.stop();
        });
    },

    resetRecordingProperties: () => {
        audioRecorder.mediaRecorder = null;
        audioRecorder.streamBeingCaptured = null;
    },

    cancel: () => {

        if (!audioRecorder.mediaRecorder) return;

        audioRecorder.mediaRecorder.stop();
        audioRecorder.stopStream();
        audioRecorder.resetRecordingProperties();
    }
};

export default audioRecorder;

export const convertBlobToURL = (blob: Blob | null): Promise<string | null> | null => {

    if (!blob) return null;

    return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
            resolve(reader.result as string);
        }
    });
};

export const playTableRecording = (q: Question) => {

    const recordingURL = q.recording;

    if (!recordingURL) return;
    fetch(recordingURL).then(async res => {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
    });
};