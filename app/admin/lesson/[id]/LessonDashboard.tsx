'use client'

import { Course, FeedbackRule, Prisma, Question, QuestionType } from "@prisma/client";
import styles from '../../Admin.module.scss';
import React, { FormEventHandler, MouseEventHandler, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { TiDelete } from "react-icons/ti";
import { FaSkullCrossbones, FaStop } from 'react-icons/fa';
import { BsPencilFill, BsRecordCircleFill } from "react-icons/bs";
import { BsFillPlayCircleFill } from 'react-icons/bs';
import { AiFillSound } from 'react-icons/ai';
import { GiNotebook } from 'react-icons/gi';
import { HiExclamationCircle } from 'react-icons/hi';
import { FaArrowCircleUp } from 'react-icons/fa';
import { FaArrowCircleDown } from 'react-icons/fa';
import { FaCheckCircle } from 'react-icons/fa';
import { GoLightBulb } from 'react-icons/go';
import cn from 'classnames';
import variables from '../../../_variables.module.scss';
import audioRecorder from "@/lib/audio";
import InfoEditor from "./InfoEditor";
import Breadcrumbs, { Breadcrumb } from "../../Breadcrumbs";
import WordHintEditor from "./WordHintEditor";
import Link from "next/link";
import { getMainVariant } from "@/lib/string_processing";

type LessonWithEverything = Prisma.LessonGetPayload<{include: { module: { include: { course: true, questions: true }}, questions: {include: { feedbackRules: true, wordHintsBackward: {include: {wordEntity: true}}, wordHintsForward: {include: {wordEntity: true}} }}}}>;
type QuestionWithFeedback = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsBackward: {include: {wordEntity: true}}, wordHintsForward: {include: {wordEntity: true}}}}>;
export type WordHint = Prisma.WordHintGetPayload<{include: {wordEntity: true}}>;

export const typeToIcon = (type: QuestionType) => {
    switch (type) {
        case 'INFO':
            return <GoLightBulb />;
        case 'QUESTION':
            return <BsPencilFill />;
    }
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

export default function LessonDashboard({ initLesson, prevId, nextId }: { initLesson: LessonWithEverything, prevId?: number, nextId?: number }) {

    const [ lesson, setLesson ] = useState(initLesson);

    const [ modalVisible, setModalVisible ] = useState(false);
    const [ type, setType ] = useState<QuestionType>('QUESTION');
    const [ questionId, setQuestionId ] = useState<number | null>(null);
    const [ target, setTarget ] = useState('');
    const [ native, setNative ] = useState('');
    const [ notes, setNotes ] = useState('');
    const [ feedbackRules, setFeedbackRules ] = useState<FeedbackRule[]>([]);
    const [ wordHintsBackward, setWordHintsBackward ] = useState<WordHint[]>([]);
    const [ wordHintsForward, setWordHintsForward ] = useState<WordHint[]>([]);
    const [ forwardEnabled, setForwardEnabled ] = useState(true);
    const [ backwardEnabled, setBackwardEnabled] = useState(true);
    const [ recordingEnabled, setRecordingEnabled ] = useState(true);
    const [ index, setIndex ] = useState(-1);
    const [ firstPass, setFirstPass] = useState(true);
    const [ info, setInfo ] = useState('');
    const [ infoTitle, setInfoTitle ] = useState('');
    const [ audioBlob, setAudioBlob ] = useState<null | Blob>(null);

    const [ selectedQuestion, setSelectedQuestion ] = useState(-1);

    const defaultOrder = Array.from({length: lesson.questions.length}, (x, i) => i);
    const [ order, setOrder ] = useState(defaultOrder);

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const [ newTitle, setNewTitle ] = useState('');
    
    const [ unsavedChanges, setUnsavedChanges ] = useState(false);

    const [ audioRecording, setAudioRecording ] = useState(false);

    const [ upIndex, setUpIndex ] = useState(-1);
    const [ downIndex, setDownIndex ] = useState(-1);

    const [ notesDisplay, setNotesDisplay ] = useState('');

    const router = useRouter();
    const notesRef = useRef<HTMLDivElement>(null);

    const topRef = useRef<HTMLTextAreaElement | null>(null);

    const breadcrumbs: Breadcrumb[] = [
        {
            name: 'My Dashboard',
            link: '/admin'
        },
        {
            name: lesson.module.course.language,
            link: `/admin/course/${lesson.module.courseId}`
        },
        {
            name: lesson.module.title,
            link: `/admin/module/${lesson.moduleId}`
        },
        {
            name: lesson.title,
            link: `/admin/lesson/${lesson.id}`
        }
    ];

    const fetchData = async () => {
        const res = await fetch(`/api/lesson/${lesson.id}`);
        const data = await res.json();

        const newDefaultOrder = Array.from({length: data.lesson.questions.length}, (x, i) => i);
        setOrder(newDefaultOrder);
        setLesson(data.lesson);
    };

    const toggleModal = () => {
        if (modalVisible) {
            setTarget('');
            setNative('');
            setFeedbackRules([]);
            setQuestionId(null);
            setIndex(-1);
            setNotes('');
            setInfo('');
            setInfoTitle('');
            setAudioBlob(null);
        }
        setModalVisible(!modalVisible);
    };

    const newQuestion = () => {
        setTarget('');
        setNative('');
        setFeedbackRules([]);
        setQuestionId(null);
        setIndex(-1);
        setNotes('');
        setWordHintsBackward([]);
        setWordHintsForward([]);
        setFirstPass(true);
        setInfo('');
        setInfoTitle('');
        setAudioBlob(null);
        setForwardEnabled(true);
        setBackwardEnabled(true);
        setRecordingEnabled(true);
        setSelectedQuestion(-1);
        topRef.current && topRef.current.focus();
    }

    const convertBlobToURL = (blob: Blob | null): Promise<string | null> | null => {

        if (!blob) return null;

        return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                resolve(reader.result as string);
            }
        });
    }

    const notesClicked = (question: Question, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (!question.notes || !notesRef.current) return;

        setNotesDisplay(question.notes);
        notesRef.current.style.display = 'block';
        notesRef.current.style.top = `${e.pageY}px`;
        notesRef.current.style.left = `${e.pageX}px`;
    }

    const hideNotes = () => {
        if (!notesRef.current) return;
        notesRef.current.style.display = 'none';
    }

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        if (type === 'QUESTION' && (!native || !target)) return;
        if (type === 'INFO' && !infoTitle) return;

        setIsSubmitting(true);

        let payload = {};

        const audioURL = await convertBlobToURL(audioBlob);

        const maxIndex = lesson.questions.length > 0 ? Math.max(...lesson.questions.map(q => q.index)) + 1 : 0;

        if (type === 'QUESTION') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: type,
                target: target,
                native: native,
                info: null,
                infoTitle: null,
                moduleId: lesson.moduleId,
                lessonId: lesson.id,
                wordHintsBackward: wordHintsBackward,
                wordHintsForward: wordHintsForward,
                recording: audioURL,
                notes: notes,
                difficulty: null,
                firstPass: firstPass,
                index: index < 0 ? maxIndex : index,
                feedbackRules: feedbackRules,
                forwardEnabled: forwardEnabled,
                backwardEnabled: backwardEnabled,
                recordingEnabled: recordingEnabled
            }

            payload = newQuestion;
        } else if (type === 'INFO') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'INFO',
                target: null,
                native: null,
                info: info,
                infoTitle: infoTitle,
                lessonId: lesson.id,
                moduleId: lesson.moduleId,
                recording: null,
                wordHintsBackward: [],
                wordHintsForward: [],
                notes: notes,
                difficulty: null,
                firstPass: true,
                index: index < 0 ? maxIndex : index,
                feedbackRules: [],
                forwardEnabled: false,
                backwardEnabled: false,
                recordingEnabled: false
            }
            payload = newQuestion;
        }

        const res = await fetch('/api/question', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        fetchData();
        setIsSubmitting(false);
        newQuestion();

        // toggleModal();
    };

    const editRow = async (question: QuestionWithFeedback) => {
        if (question.recording) {
            fetch(question.recording).then(res => res.blob()).then(blob => {
                setAudioBlob(blob);
            });
        } else {
            setAudioBlob(null);
        }
        setType(question.type);
        setQuestionId(question.id);
        setTarget(question.target || '');
        setForwardEnabled(question.forwardEnabled);
        setBackwardEnabled(question.backwardEnabled);
        setRecordingEnabled(question.recordingEnabled);
        setNative(question.native || '');
        setFeedbackRules(question.feedbackRules);
        setWordHintsBackward(question.wordHintsBackward);
        setWordHintsForward(question.wordHintsForward);
        setNotes(question.notes || '');
        setIndex(question.index);
        setFirstPass(question.firstPass);
        setInfo(question.info || '');
        setInfoTitle(question.infoTitle || '');
        setSelectedQuestion(question.id);
    };

    const handleFeedbackTriggerChange = (value: string, index: number) => {
        const newRules = [...feedbackRules];
        newRules[index].trigger = value;
        setFeedbackRules(newRules);
    };

    const handleFeedbackChange = (value: string, index: number) => {
        const newRules = [...feedbackRules];
        newRules[index].feedback = value;
        setFeedbackRules(newRules);
    };

    const addFeedbackRule: MouseEventHandler = e => {
        e.preventDefault();
        const newRules: FeedbackRule[] = [...feedbackRules, {trigger: '', feedback: '', id: -1} as FeedbackRule]
        setFeedbackRules(newRules);
    };

    const handleWordHintBackwardChange = (index: number) => {
        return (wordId: number | null) => {
            const newHints = [...wordHintsBackward];
            newHints[index].wordEntityId = wordId;
            setWordHintsBackward(newHints);
        }
    };

    const handleWordHintForwardChange = (index: number) => {
        return (wordId: number | null) => {
            const newHints = [...wordHintsForward];
            newHints[index].wordEntityId = wordId;
            setWordHintsForward(newHints);
        }
    };

    const notesForm = (
        <>
            <div className={styles.formSectionHeader}>NOTES & MISCELLANEA</div>
            <textarea placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} />
        </>
    ); 

    const feedbackRulesForm = (
        <>
        <div className={styles.formSectionHeader}>FEEDBACK RULES</div>
        <div className={styles.feedbackRulesContainer}>
            {feedbackRules.length > 0 ? feedbackRules.map((rule, index) => (
                <div>
                    <input type="text" placeholder="Trigger" value={rule.trigger} onChange={e => handleFeedbackTriggerChange(e.target.value, index)} />
                    <input type="text" placeholder="Feedback" value={rule.feedback} onChange={e => handleFeedbackChange(e.target.value, index)} />
                </div>
            )) : <div style={{fontStyle: 'italic', fontSize: '0.8rem'}}>No feedback rules yet</div>}
        </div>
        <button onClick={addFeedbackRule}>Add Feedback Rule</button>
        </>
    );

    const decreaseIndex = (index: number) => {

        if (index === 0) return;

        const newOrder = [...order];
        const placeholder = newOrder[index - 1];
        newOrder[index - 1] = newOrder[index];
        newOrder[index] = placeholder;

        setUpIndex(index);
        setDownIndex(index - 1);

        console.log(newOrder);

        setTimeout(() => {
            setOrder(newOrder);
            setUpIndex(-1);
            setDownIndex(-1);
        }, 280);

        setUnsavedChanges(true);
    }

    const increaseIndex = (index: number) => {

        if (index === order.length - 1) return;

        const newOrder = [...order];
        const placeholder = newOrder[index + 1];
        newOrder[index + 1] = newOrder[index];
        newOrder[index] = placeholder;

        console.log(newOrder);

        setUpIndex(index + 1);
        setDownIndex(index);

        setTimeout(() => {
            setOrder(newOrder);
            setUpIndex(-1);
            setDownIndex(-1);
        }, 300);

        setUnsavedChanges(true);
    }

    const updateOrder = async () => {
        const payload = {
            order,
            moduleId: lesson.moduleId
        }

        const res = await fetch(`/api/lesson/${lesson.id}/order`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        fetchData();
        setUnsavedChanges(false);
    }

    const updateTitle: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!newTitle) return;
        
        const payload = {
            title: newTitle,
            moduleId: lesson.moduleId
        }

        const res = await fetch(`/api/lesson/${lesson.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        fetchData();
    }

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

    const deleteLesson: MouseEventHandler<HTMLButtonElement> = async e => {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to delete this lesson and all its screens?")) return;

        const res = await fetch(`/api/lesson/${lesson.id}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        window.location.replace(`/admin/module/${lesson.moduleId}`);
    };

    const audioForm = (
        <>
            <div className={styles.formSectionHeader}>RECORD AUDIO</div>
            <div className={styles.audioButtonsContainer}>
                {audioRecording ? <button onClick={stopRecording} className={styles.stopButton}><FaStop /></button> 
                : <button onClick={startRecording} className={styles.recordButton}><BsRecordCircleFill /></button>}
                {!audioRecording && audioBlob != null ? <button onClick={playAudio} className={styles.stopButton}><BsFillPlayCircleFill /></button> : (null)}
            </div>
            <div className={styles.formSectionHeader}>POSSIBLE ANSWERS</div>
            <textarea placeholder="Answers (place each answer on a new line)" value={native} onChange={e => setNative(e.target.value)} />
            <label>
                Second pass only?
                <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={!firstPass} onChange={e => setFirstPass(!e.target.checked)} />
            </label>
            {feedbackRulesForm}
            {notesForm}
        </>
    );

    const infoForm = (
        <>
            <div className={styles.formSectionHeader}>LESSON INFORMATION</div>
            <input type="text" placeholder="Title" value={infoTitle} onChange={e => setInfoTitle(e.target.value)} />
            <div style={{fontSize: '12px', textAlign: 'center'}}>Enter vocab words between {"{brackets}"} so they'll play a pronunciation when users hover over them!</div>
            <InfoEditor data={info} setData={setInfo} />
            {notesForm}
        </>
    );

    const newQuestionForm = (
        <>
            <div className={styles.formSectionHeader}>QUESTION INFO</div>
            <div style={{fontSize: '0.8rem'}}>Place each variation on a new line, primary variation on the first line</div>
            <textarea ref={topRef} wrap="off" placeholder={`${lesson.module.course.language} variations`} value={target} onChange={e => setTarget(e.target.value)} />
            <textarea wrap="off" placeholder="Native variations" value={native} onChange={e => setNative(e.target.value)} />
            <div className={styles.formSectionHeader}>RECORD AUDIO</div>
            <div className={styles.audioButtonsContainer}>
                {audioRecording ? <button onClick={stopRecording} className={styles.stopButton}><FaStop /></button> 
                : <button onClick={startRecording} className={styles.recordButton}><BsRecordCircleFill /></button>}
                {!audioRecording && audioBlob != null ? <button onClick={playAudio} className={styles.stopButton}><BsFillPlayCircleFill /></button> : (null)}
            </div>
            <div className={styles.formSectionHeader}>OPTIONS</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem', rowGap: '0.2rem', justifyContent:'center'}}>
                <label>
                    Forward translation
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={forwardEnabled} onChange={e => setForwardEnabled(e.target.checked)} />
                </label>
                <label>
                    Backward translation
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={backwardEnabled} onChange={e => setBackwardEnabled(e.target.checked)} />
                </label>
                <label>
                    Audio translation
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={recordingEnabled} onChange={e => setRecordingEnabled(e.target.checked)} />
                </label>
                <label>
                    Second pass only?
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={!firstPass} onChange={e => setFirstPass(!e.target.checked)} />
                </label>
            </div>
            
            <div className={styles.formSectionHeader}>WORD HINTS (BACKWARD)</div>
            {wordHintsBackward.map((hint, index) => {
                return <WordHintEditor isForward={false} hint={hint} setId={handleWordHintBackwardChange(index)} courseId={lesson.module.courseId} />
            })}
            {wordHintsBackward.length > 0 && <div style={{fontStyle: 'italic', fontSize: '0.8rem'}}>Press the UPDATE button above to submit changes to word hints!</div>}

            <div className={styles.formSectionHeader}>WORD HINTS (FORWARD)</div>
            {wordHintsForward.map((hint, index) => {
                return <WordHintEditor isForward hint={hint} setId={handleWordHintForwardChange(index)} courseId={lesson.module.courseId} />
            })}
            {wordHintsForward.length > 0 && <div style={{fontStyle: 'italic', fontSize: '0.8rem'}}>Press the UPDATE button above to submit changes to word hints!</div>}

            {feedbackRulesForm}
            {notesForm}
        </>
    );

    const addToLesson = async (q: Question) => {
        const payload = {
            lessonId: lesson.id
        };

        const res = await fetch(`/api/question/${q.id}/lesson`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        fetchData();

    };

    const removeFromLesson = async (q: Question) => {
        const payload = {
            lessonId: null
        };

        const res = await fetch(`/api/question/${q.id}/lesson`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        fetchData();
    }

    let formContent = type === 'INFO' ? infoForm : newQuestionForm;

    return (
        <main className={styles.container}>
            <Breadcrumbs trail={breadcrumbs} />
            <h6>LESSON</h6>
            <h2>{lesson.title.toUpperCase()}</h2>
            <div style={{display: 'flex', gap: '200px', height: '40px'}}>
                {prevId ? <Link style={{width: '150px'}}  href={`/admin/lesson/${prevId}`}>{'<< '} Previous Lesson</Link> : <div style={{width: '150px'}}></div>}
                {nextId ? <Link style={{width: '150px'}} href={`/admin/lesson/${nextId}`}>Next Lesson {' >>'}</Link> : <div style={{width: '150px'}}></div>}
            </div>
            <form onSubmit={updateTitle} style={{fontSize: '12px', display: 'flex', flexDirection: 'row', gap: '0.8rem', marginBottom: '2.4rem'}}>
                <input type='text' placeholder="New title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <input type='submit' value="CHANGE TITLE" />
                <button className={styles.deleteButton} onClick={deleteLesson}><FaSkullCrossbones /> DELETE LESSON</button>
            </form>
            <div className={styles.lessonContentContainer}>
                <div className={styles.lessonViewContainer}>
                    <h5>LESSON CONTENT</h5>
                    {lesson.questions.length > 0 ? (
                        <table className={styles.lessonTable}>
                            <colgroup>
                                <col />
                                <col />
                                <col style={{width: '5%'}}/>
                                <col />
                                <col />
                                <col style={{width: '10%'}}/>
                                <col style={{width: '5%'}} />
                                <col style={{width: '5%'}} />
                                <col style={{width: '5%'}} />
                            </colgroup>
                            <thead>
                            <tr>
                                <th>Type</th>
                                <th>Pass</th>
                                <th><AiFillSound /></th>
                                <th>{lesson.module.course.language}/Title</th>
                                <th>Native</th>
                                <th>Notes</th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {order.length === lesson.questions.length && order.map(index => lesson.questions[index]).map((q, index) => {
                                return (
                                    <tr onClick={() => editRow(q)} key={q.id} className={cn({[styles.up]: upIndex === index, [styles.down]: downIndex === index, [styles.info]: selectedQuestion === q.id})}>
                                        <td>{typeToIcon(q.type)}</td>
                                        <td>{q.firstPass ? '1' : '2'}</td>
                                        <td>{q.type !== 'QUESTION' ? (null) : !q.recording ? <HiExclamationCircle style={{color: variables.themeRed, fontSize: '1.2rem'}} /> : <button onClick={e => {e.stopPropagation(); playTableRecording(q)}} className={styles.iconButton}><FaCheckCircle style={{color: variables.themeGreen}} /></button>}</td>
                                        <td style={{fontWeight: q.type === 'INFO' ? 'bold' : 'normal'}}>{getMainVariant(q.target) || q.infoTitle}</td>
                                        <td>{getMainVariant(q.native)}</td>
                                        <td>{!q.notes ? (null) : <button onClick={e => notesClicked(q, e)} className={styles.iconButton}><GiNotebook /></button>}</td>
                                        <td><button onClick={e => {e.stopPropagation(); decreaseIndex(index)}} className={styles.iconButton}><FaArrowCircleUp /></button></td>
                                        <td><button onClick={e => {e.stopPropagation(); increaseIndex(index)}} className={styles.iconButton}><FaArrowCircleDown /></button></td>
                                        <td><button onClick={e => {e.stopPropagation(); removeFromLesson(q)}} className={styles.iconButton}><TiDelete style={{color: variables.themeRed, fontSize: '1.6rem'}} /></button></td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    ) : (<div className={styles.noScreens}>No screens yet! Select them from the list below, or create new ones with the screen editor!</div>)}
                    {unsavedChanges ? <div style={{display: 'flex', justifyContent:'flex-end', marginBottom: '2rem'}}><button onClick={updateOrder} className='important' style={{backgroundColor: variables.themeGreen}}>SAVE ORDER</button></div>  : (null)}
                    <h5>MORE SCREENS FROM THIS MODULE</h5>
                    {lesson.module.questions.length > 0 ? (
                        <table className={styles.lessonTable}>
                            <colgroup>
                                <col />
                                <col style={{width: '5%'}}/>
                                <col />
                                <col />
                                <col style={{width: '10%'}}/>
                                <col style={{width: '5%'}} />
                            </colgroup>
                            <thead>
                            <tr>
                                <th>Type</th>
                                <th><AiFillSound /></th>
                                <th>{lesson.module.course.language}/Title</th>
                                <th>Native</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {lesson.module.questions.map((q) => {
                                return (
                                    <tr key={q.id}>
                                        <td>{typeToIcon(q.type)}</td>
                                        <td>{q.type !== 'QUESTION' ? (null) : !q.recording ? <HiExclamationCircle style={{color: variables.themeRed, fontSize: '1.2rem'}} /> : <button onClick={e => {e.stopPropagation(); playTableRecording(q)}} className={styles.iconButton}><FaCheckCircle style={{color: variables.themeGreen}} /></button>}</td>
                                        <td style={{fontWeight: q.type === 'INFO' ? 'bold' : 'normal'}}>{getMainVariant(q.target) || q.infoTitle}</td>
                                        <td>{getMainVariant(q.native)}</td>
                                        <td>{!q.notes ? (null) : <button onClick={e => notesClicked(q, e)} className={styles.iconButton}><GiNotebook /></button>}</td>
                                        <td><button onClick={() => addToLesson(q)}>ADD TO LESSON</button></td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    ) : (<div className={styles.noScreens}>No more screens! Use the screen editor to create more!</div>)}
                </div>
                <div className={styles.editor}>
                    <div>
                        <form onSubmit={submitClicked}>
                            <div className={styles.formTopRow}>
                                <h5>SCREEN EDITOR</h5>
                                <div>
                                    {questionId ? <button onClick={newQuestion}>CREATE NEW</button> : (null)}
                                    {!isSubmitting ? <input type="submit" value={!questionId ? "CREATE" : "UPDATE"} /> : 
                                    <ClipLoader color={variables.themeRed} loading={true} />}
                                </div>
                            </div>
                            <div className={styles.formSectionHeader}>SCREEN TYPE</div>
                            <div className={styles.radioContainer}>
                                <div className={styles.radio}>
                                    <input type='radio' id="question-button" name="question" value="QUESTION" checked={type === 'QUESTION'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                                    <label htmlFor='question-button'>Question</label>
                                </div>
                                <div className={styles.radio}>
                                    <input type='radio' id="info-button" name="info" value="INFO" checked={type === 'INFO'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                                    <label htmlFor='info-button'>Info</label>
                                </div>
                            </div>
                            { formContent }
                        </form>
                    </div>
                </div>
            </div>
            <div ref={notesRef} className={styles.notesDisplay}>
                {notesDisplay}
                <button onClick={hideNotes} className={styles.cancel}><TiDelete /></button>
            </div>
        </main>
    );
}