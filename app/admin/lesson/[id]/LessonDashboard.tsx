'use client'

import { Course, FeedbackRule, Prisma, Question, QuestionType } from "@prisma/client";
import styles from '../../Admin.module.scss';
import { FormEventHandler, MouseEventHandler, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { TiDelete } from "react-icons/ti";
import { FaSkullCrossbones, FaStop } from 'react-icons/fa';
import { BsRecordCircleFill } from "react-icons/bs";
import { BsFillPlayCircleFill } from 'react-icons/bs';
import { AiFillSound } from 'react-icons/ai';
import { GiNotebook } from 'react-icons/gi';
import { HiExclamationCircle } from 'react-icons/hi';
import { FaArrowCircleUp } from 'react-icons/fa';
import { BsArrowRight } from 'react-icons/bs';
import { BsArrowLeft } from 'react-icons/bs';
import { FaArrowCircleDown } from 'react-icons/fa';
import { FaCheckCircle } from 'react-icons/fa';
import { GoLightBulb } from 'react-icons/go';
import cn from 'classnames';
import variables from '../../../_variables.module.scss';
import audioRecorder from "@/lib/audio";
import InfoEditor from "./InfoEditor";
import Breadcrumbs, { Breadcrumb } from "../../Breadcrumbs";

type LessonWithEverything = Prisma.LessonGetPayload<{include: { module: { include: { course: true }}, questions: {include: { feedbackRules: true }} }}>;
type QuestionWithFeedback = Prisma.QuestionGetPayload<{include: {feedbackRules: true}}>;

const typeToIcon = (type: QuestionType) => {
    switch (type) {
        case 'INFO':
            return <GoLightBulb />;
        case 'LISTENING':
            return <AiFillSound />;
        case 'NATIVE_TO_TARGET':
            return <BsArrowRight />;
        case 'TARGET_TO_NATIVE':
            return <BsArrowLeft />;
    }
};

export default function CourseDashboard({ lesson }: { lesson: LessonWithEverything }) {

    const [ modalVisible, setModalVisible ] = useState(false);
    const [ type, setType ] = useState<QuestionType>('NATIVE_TO_TARGET');
    const [ questionId, setQuestionId ] = useState<number | null>(null);
    const [ question, setQuestion ] = useState('');
    const [ answers, setAnswers ] = useState('');
    const [ notes, setNotes ] = useState('');
    const [ feedbackRules, setFeedbackRules ] = useState<FeedbackRule[]>([]);
    const [ index, setIndex ] = useState(-1);
    const [ info, setInfo ] = useState('');
    const [ infoTitle, setInfoTitle ] = useState('');
    const [ audioBlob, setAudioBlob ] = useState<null | Blob>(null);

    const defaultOrder = Array.from({length: lesson.questions.length}, (x, i) => i);
    const [ order, setOrder ] = useState(defaultOrder);

    const [ newTitle, setNewTitle ] = useState('');
    
    const [ unsavedChanges, setUnsavedChanges ] = useState(false);

    const [ audioRecording, setAudioRecording ] = useState(false);

    const [ upIndex, setUpIndex ] = useState(-1);
    const [ downIndex, setDownIndex ] = useState(-1);

    const [ notesDisplay, setNotesDisplay ] = useState('');

    const router = useRouter();
    const notesRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (modalVisible) {
            document.body.style.top = `-${window.scrollY}px`;
            document.body.style.position = 'fixed';
            document.body.style.left = '0px';
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.overflow = 'auto';
            document.body.style.position = '';
            document.body.style.height = 'auto';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }, [modalVisible]);

    const toggleModal = () => {
        if (modalVisible) {
            setQuestion('');
            setAnswers('');
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

    const notesClicked = (question: QuestionWithFeedback, e: MouseEvent) => {
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

        let payload = {};

        const audioURL = await convertBlobToURL(audioBlob);

        const maxIndex = Math.max(...lesson.questions.map(q => q.index));

        if (type === 'TARGET_TO_NATIVE' || type === 'NATIVE_TO_TARGET') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: type,
                question: question,
                answers: answers.split('\n'),
                info: null,
                infoTitle: null,
                lessonId: lesson.id,
                recording: null,
                notes: notes,
                difficulty: null,
                pass: null,
                index: index < 0 ? maxIndex : index,
                feedbackRules: feedbackRules
            }

            payload = newQuestion;
        } else if (type === 'LISTENING') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'LISTENING',
                question: null,
                answers: answers.split('\n'),
                info: null,
                infoTitle: null,
                lessonId: lesson.id,
                recording: audioURL,
                notes: notes,
                difficulty: null,
                pass: null,
                index: index < 0 ? maxIndex : index,
                feedbackRules: feedbackRules
            }

            payload = newQuestion
        } else if (type === 'INFO') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'INFO',
                question: null,
                answers: [],
                info: info,
                infoTitle: infoTitle,
                lessonId: lesson.id,
                recording: null,
                notes: notes,
                difficulty: null,
                pass: null,
                index: index < 0 ? maxIndex : index,
                feedbackRules: []
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

        location.reload();

        // toggleModal();
    };

    const editRow = async (question: QuestionWithFeedback) => {
        if (question.recording) {
            fetch(question.recording).then(res => res.blob()).then(blob => {
                setAudioBlob(blob);
            });
        }
        setType(question.type);
        setQuestionId(question.id);
        setQuestion(question.question || '');
        setAnswers(question.answers?.join('\n'));
        setFeedbackRules(question.feedbackRules);
        setNotes(question.notes || '');
        setIndex(question.index);
        setInfo(question.info || '');
        setInfoTitle(question.infoTitle || '');
        toggleModal();
    };

    const deleteRow = async (question: QuestionWithFeedback) => {
        if (unsavedChanges) {
            await updateOrder();
        }

        const payload = {
            id: question.id
        }

        const res = await fetch('/api/question', {
            method: 'DELETE',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        await res.json();
        location.reload();
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

    const addFeedbackRule = e => {
        e.preventDefault();
        const newRules: FeedbackRule[] = [...feedbackRules, {trigger: '', feedback: '', id: -1} as FeedbackRule]
        setFeedbackRules(newRules);
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

    const newQuestionForm = (
        <>
            <div className={styles.formSectionHeader}>QUESTION INFO</div>
            <input type="text" placeholder={`Prompt (in ${type === 'TARGET_TO_NATIVE' ? lesson.module.course.language : 'English'})`} value={question} onChange={e => setQuestion(e.target.value)} />
            <textarea placeholder="Answers (place each answer on a new line)" value={answers} onChange={e => setAnswers(e.target.value)} />
            {feedbackRulesForm}
            {notesForm}
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
        location.reload();
    }

    const updateTitle = async (e) => {
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
        location.reload();
    }

    const startRecording = async e => {
        e.preventDefault();

        await audioRecorder.start();
        setAudioRecording(true);
    }

    const stopRecording = async e => {

        e.preventDefault();

        const audioAsBlob = await audioRecorder.stop();

        setAudioRecording(false);
        setAudioBlob(audioAsBlob);
    }

    const playAudio = e => {

        e.preventDefault();
        if (!audioBlob) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    }

    const playTableRecording = (q: Question) => {

        const recordingURL = q.recording;

        if (!recordingURL) return;
        fetch(recordingURL).then(async res => {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
        });
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
            <textarea placeholder="Answers (place each answer on a new line)" value={answers} onChange={e => setAnswers(e.target.value)} />
            {feedbackRulesForm}
            {notesForm}
        </>
    );

    const infoForm = (
        <>
            <div className={styles.formSectionHeader}>LESSON INFORMATION</div>
            <input type="text" placeholder="Title" value={infoTitle} onChange={e => setInfoTitle(e.target.value)} />
            <InfoEditor data={info} setData={setInfo} />
            {notesForm}
        </>
    );

    let formContent = type === 'LISTENING' ? audioForm : type === 'INFO' ? infoForm : newQuestionForm;

    return (
        <main className={styles.container}>
            <Breadcrumbs trail={breadcrumbs} />
            <h6>LESSON</h6>
            <h2>{lesson.title.toUpperCase()}</h2>
            <form onSubmit={updateTitle} style={{fontSize: '12px', display: 'flex', flexDirection: 'row', gap: '0.8rem', marginBottom: '2.4rem'}}>
                <input type='text' placeholder="New title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <input type='submit' value="CHANGE TITLE" />
                <button className={styles.deleteButton} onClick={deleteLesson}><FaSkullCrossbones /> DELETE LESSON</button>
            </form>
            <div className={cn(styles.contentContainer, styles.wide)}>
                <h5>LESSON CONTENT</h5>
                {lesson.questions.length > 0 ? (
                    <table className={styles.lessonTable}>
                        <colgroup>
                            <col />
                            <col />
                            <col />
                            <col style={{width: '10%'}}/>
                            <col style={{width: '5%'}}/>
                            <col style={{width: '8%'}} />
                            <col style={{width: '5%'}} />
                            <col style={{width: '5%'}} />
                            <col style={{width: '5%'}} />
                        </colgroup>
                        <thead>
                        <tr>
                            <th>Type</th>
                            <th>Question/Title</th>
                            <th>Answers</th>
                            <th>Notes</th>
                            <th><AiFillSound /></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.map(index => lesson.questions[index]).map((q, index) => {
                            return (
                                <tr key={q.id} className={cn({[styles.up]: upIndex === index, [styles.down]: downIndex === index, [styles.info]: q.type === 'INFO'})}>
                                    <td>{typeToIcon(q.type)}</td>
                                    <td>{q.question || q.infoTitle}</td>
                                    <td>{q.answers.join('; ')}</td>
                                    <td>{!q.notes ? (null) : <button onClick={e => notesClicked(q, e)} className={styles.iconButton}><GiNotebook /></button>}</td>
                                    <td>{q.type !== 'LISTENING' ? (null) : !q.recording ? <HiExclamationCircle style={{color: variables.themeRed, fontSize: '1.2rem'}} /> : <button onClick={() => playTableRecording(q)} className={styles.iconButton}><FaCheckCircle style={{color: variables.themeGreen}} /></button>}</td>
                                    <td><button onClick={() => editRow(q)}>Edit</button></td>
                                    <td><button onClick={() => decreaseIndex(index)} className={styles.iconButton}><FaArrowCircleUp /></button></td>
                                    <td><button onClick={() => increaseIndex(index)} className={styles.iconButton}><FaArrowCircleDown /></button></td>
                                    <td><button onClick={() => deleteRow(q)} className={styles.iconButton}><TiDelete style={{color: variables.themeRed, fontSize: '1.6rem'}} /></button></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (<div className={styles.noScreens}>No screens yet!</div>)}
                <div style={{display: 'flex', width: '100%', justifyContent: 'center', gap: '20px'}}>
                    <button onClick={toggleModal}>ADD A SCREEN</button>
                    {unsavedChanges ? <button onClick={updateOrder} className='important' style={{backgroundColor: variables.themeGreen}}>SAVE ORDER</button> : (null)}
                </div>
            </div>
            <div className={cn(styles.modal, {[styles.visible]: modalVisible})}>
                <div>
                    <form onSubmit={submitClicked}>
                        <h4>{!questionId ? 'NEW SCREEN' : 'EDITING SCREEN'}</h4>
                        <div className={styles.radioContainer}>
                            <div className={styles.radio}>
                                <input type='radio' id="native-button" name="native" value="NATIVE_TO_TARGET" checked={type === 'NATIVE_TO_TARGET'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                                <label htmlFor='native-button'>Forward Translation</label>
                            </div>
                            <div className={styles.radio}>
                                <input type='radio' id="target-button" name="target" value="TARGET_TO_NATIVE" checked={type === 'TARGET_TO_NATIVE'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                                <label htmlFor='target-button'>Backward Translation</label>
                            </div>
                            <div className={styles.radio}>
                                <input type='radio' id="listening-button" name="listening" value="LISTENING" checked={type === 'LISTENING'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                                <label htmlFor='listening-button'>Listening</label>
                            </div>
                            <div className={styles.radio}>
                                <input type='radio' id="info-button" name="info" value="INFO" checked={type === 'INFO'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                                <label htmlFor='info-button'>Info</label>
                            </div>
                        </div>
                        { formContent }
                        <input type="submit" value={!questionId ? "CREATE!" : "SUBMIT EDITS"} />
                    </form>
                    <button className={styles.cancel} onClick={toggleModal}><TiDelete /></button>
                </div>
            </div>
            <div ref={notesRef} className={styles.notesDisplay}>
                {notesDisplay}
                <button onClick={hideNotes} className={styles.cancel}><TiDelete /></button>
            </div>
        </main>
    );
}