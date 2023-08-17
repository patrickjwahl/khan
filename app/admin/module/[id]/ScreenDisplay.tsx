import { FeedbackRule, Module, Prisma, Question, QuestionType } from '@prisma/client';
import styles from '../../Admin.module.scss';
import { AiFillSound } from 'react-icons/ai';
import { WordHint, playTableRecording, typeToIcon } from '../../lesson/[id]/LessonDashboard';
import cn from 'classnames';
import React, { FormEventHandler, MouseEventHandler, useEffect, useRef, useState } from 'react';
import { HiExclamationCircle } from 'react-icons/hi';
import variables from '../../../_variables.module.scss';
import { useRouter } from 'next/navigation';
import { ModuleWithLessonsAndCourse } from './ModuleDashboard';
import audioRecorder from '@/lib/audio';
import InfoEditor from '../../lesson/[id]/InfoEditor';
import { BsFillPlayCircleFill, BsRecordCircleFill } from 'react-icons/bs';
import { FaCheckCircle, FaStop } from 'react-icons/fa';
import { GiNotebook, GiTargetArrows } from 'react-icons/gi';
import { TiDelete } from 'react-icons/ti';
import { ClipLoader } from 'react-spinners';
import WordHintEditor from '../../lesson/[id]/WordHintEditor';
import Link from 'next/link';

type QuestionWithFeedbackAndLesson = Prisma.QuestionGetPayload<{include: {feedbackRules: true, lesson: true, wordHintsBackward: { include: {wordEntity: true}}, wordHintsForward: { include: {wordEntity: true}}}}>;
export type QuestionWithFeedback = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsForward: { include: {wordEntity: true}}, wordHintsBackward: { include: {wordEntity: true}}}}>;

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

export default function ScreenDisplay({ module, questions, forceSelectedQuestion, ackSelectedQuestion, notesClicked, fetchData }: {module: ModuleWithLessonsAndCourse, questions: QuestionWithFeedbackAndLesson[], forceSelectedQuestion: Question | null, ackSelectedQuestion: () => void, notesClicked: (question: QuestionWithFeedback, e: React.MouseEvent<HTMLButtonElement>) => void, fetchData: () => void} ) {

    const [ modalVisible, setModalVisible ] = useState(false);
    const [ type, setType ] = useState<QuestionType>('QUESTION');
    const [ questionId, setQuestionId ] = useState<number | null>(null);
    const [ target, setTarget ] = useState('');
    const [ native, setNative ] = useState('');
    const [ wordHintsForward, setWordHintsForward ] = useState<WordHint[]>([]);
    const [ wordHintsBackward, setWordHintsBackward ] = useState<WordHint[]>([]);
    const [ notes, setNotes ] = useState('');
    const [ feedbackRules, setFeedbackRules ] = useState<FeedbackRule[]>([]);
    const [ index, setIndex ] = useState(-1);
    const [ lessonId, setLessonId ] = useState<number | null>(null);
    const [ firstPass, setFirstPass ] = useState(true);
    const [ info, setInfo ] = useState('');
    const [ infoTitle, setInfoTitle ] = useState('');
    const [ audioBlob, setAudioBlob ] = useState<null | Blob>(null);
    const [ forwardEnabled, setForwardEnabled ] = useState(true);
    const [ backwardEnabled, setBackwardEnabled] = useState(true);
    const [ recordingEnabled, setRecordingEnabled ] = useState(true);

    const [ selectedQuestion, setSelectedQuestion ] = useState(-1);

    const [ isSubmitting, setIsSubmitting ] = useState(false);
    
    const [ unsavedChanges, setUnsavedChanges ] = useState(false);

    const [ audioRecording, setAudioRecording ] = useState(false);

    const topRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (forceSelectedQuestion) {
            const q = questions.filter(qu => qu.id === forceSelectedQuestion.id)[0];
            editRow(q);
            const el = document.getElementById(`question-${q.id}`);
            el?.scrollIntoView({block: 'center'});
            ackSelectedQuestion();
        } 
    }, [forceSelectedQuestion]);

    const newQuestion = () => {
        setTarget('');
        setNative('');
        setFeedbackRules([]);
        setQuestionId(null);
        setIndex(-1);
        setNotes('');
        setInfo('');
        setWordHintsForward([]);
        setWordHintsBackward([]);
        setLessonId(null);
        setFirstPass(true);
        setInfoTitle('');
        setAudioBlob(null);
        setForwardEnabled(true);
        setBackwardEnabled(true);
        setRecordingEnabled(true);
        setSelectedQuestion(-1);
        topRef.current && topRef.current.focus();
    }

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        if (!native && !infoTitle) return;

        setIsSubmitting(true);

        let payload = {};

        const audioURL = await convertBlobToURL(audioBlob);

        const maxIndex = -1;

        if (type === 'QUESTION') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'QUESTION',
                target: target,
                native: native,
                info: null,
                infoTitle: null,
                moduleId: module.id,
                lessonId: lessonId,
                recording: audioURL,
                notes: notes,
                difficulty: null,
                firstPass: firstPass,
                index: index < 0 ? maxIndex : index,
                feedbackRules: feedbackRules,
                wordHintsBackward: wordHintsBackward,
                wordHintsForward: wordHintsForward,
                forwardEnabled,
                backwardEnabled,
                recordingEnabled
            }

            payload = newQuestion
        } else if (type === 'INFO') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'INFO',
                target: null,
                native: null,
                info: info,
                infoTitle: infoTitle,
                moduleId: module.id,
                lessonId: lessonId,
                recording: null,
                notes: notes,
                difficulty: null,
                firstPass: true,
                index: index < 0 ? maxIndex : index,
                feedbackRules: [],
                wordHintsForward: [],
                wordHintsBackward: [],
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
        setNative(question.native || '');
        setFeedbackRules(question.feedbackRules);
        setNotes(question.notes || '');
        setLessonId(question.lessonId);
        setWordHintsForward(question.wordHintsForward);
        setWordHintsBackward(question.wordHintsBackward);
        setIndex(question.index);
        setFirstPass(question.firstPass);
        setInfo(question.info || '');
        setInfoTitle(question.infoTitle || '');
        setSelectedQuestion(question.id);
        setForwardEnabled(question.forwardEnabled);
        setBackwardEnabled(question.backwardEnabled);
        setRecordingEnabled(question.recordingEnabled);
    };

    const deleteRow = async (question: QuestionWithFeedback) => {
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
        fetchData();
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

    const handleWordHintForwardChange = (index: number) => {
        return (wordId: number) => {
            const newHints = [...wordHintsForward];
            newHints[index].wordEntityId = wordId;
            setWordHintsForward(newHints);
        }
    };

    const handleWordHintBackwardChange = (index: number) => {
        return (wordId: number) => {
            const newHints = [...wordHintsBackward];
            newHints[index].wordEntityId = wordId;
            setWordHintsBackward(newHints);
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
                <div key={index}>
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
            <div style={{fontSize: '0.7rem'}}>Place each variation on a new line, primary variation on the first line</div>
            <textarea ref={topRef} wrap="off" placeholder={`${module.course.language} variations`} value={target} onChange={e => setTarget(e.target.value)} />
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
                return <WordHintEditor isForward={false} hint={hint} setId={handleWordHintBackwardChange(index)} courseId={module.courseId} />
            })}
            {wordHintsBackward.length > 0 && <div style={{fontStyle: 'italic', fontSize: '0.8rem'}}>Press the UPDATE button above to submit changes to word hints!</div>}

            <div className={styles.formSectionHeader}>WORD HINTS (FORWARD)</div>
            {wordHintsForward.map((hint, index) => {
                return <WordHintEditor isForward hint={hint} setId={handleWordHintForwardChange(index)} courseId={module.courseId} />
            })}
            {wordHintsForward.length > 0 && <div style={{fontStyle: 'italic', fontSize: '0.8rem'}}>Press the UPDATE button above to submit changes to word hints!</div>}

            {feedbackRulesForm}
            {notesForm}
        </>
    );
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
            <div>Enter {"{vocab} {words}"} between brackets so they'll play a pronunciation when users hover over them!</div>
            <InfoEditor data={info} setData={setInfo} />
            {notesForm}
        </>
    );

    let formContent = type === 'INFO' ? infoForm : newQuestionForm;

    const uploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !window.confirm("WARNING! This will overwrite all current screens, including info screens! Continue?")) return;
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        const res = await fetch(`/api/module/${module.id}/csv`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        location.reload();
    }

    return (<>
        <div className={styles.lessonContentContainer}>
                <div className={styles.lessonViewContainer}>
                    <h5>MODULE SCREENS</h5>
                    {questions.length > 0 ? (
                        <div className={styles.tableContainer}>
                        <table className={styles.lessonTable}>
                            <colgroup>
                                <col />
                                <col style={{width: '5%'}}/>
                                <col />
                                <col />
                                <col style={{width: '10%'}}/>
                                <col style={{width: '8%'}} />
                                <col style={{width: '5%'}} />
                            </colgroup>
                            <thead>
                            <tr style={{borderBottom: '2px solid ' + variables.themeBlue}}>
                                <th>Type</th>
                                <th><AiFillSound /></th>
                                <th>{module.course.language}/Title</th>
                                <th>Native</th>
                                <th>Notes</th>
                                <th>Lesson</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {questions.map((q, index) => {
                                return (
                                    <tr id={`question-${q.id}`} onClick={() => editRow(q)} key={q.id} className={cn({[styles.info]: selectedQuestion === q.id})}>
                                        <td>{typeToIcon(q.type)}</td>
                                        <td>{q.type !== 'QUESTION' ? (null) : !q.recording ? <HiExclamationCircle style={{color: variables.themeRed, fontSize: '1.2rem'}} /> : <button onClick={e => {e.stopPropagation(); playTableRecording(q)}} className={styles.iconButton}><FaCheckCircle style={{color: variables.themeGreen}} /></button>}</td>
                                        <td style={{fontWeight: q.type === 'INFO' ? 'bold' : 'normal'}}>{q.target?.split('\n')[0] || q.infoTitle}</td>
                                        <td>{q.native?.split('\n')[0]}</td>
                                        <td>{!q.notes ? (null) : <button onClick={e => notesClicked(q, e)} className={styles.iconButton}><GiNotebook /></button>}</td>
                                        <td>{q.lesson && q.lesson.index + 1}</td>
                                        <td><button onClick={(e) => {e.stopPropagation(); deleteRow(q);}} className={styles.iconButton}><TiDelete style={{color: variables.themeRed, fontSize: '1.6rem'}} /></button></td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        </div>
                    ) : (<div className={styles.noScreens}>No screens yet! Create them with the screen editor.</div>)}
                    {!module.published && (<div className={styles.csvLoader}>
                        <label>
                            LOAD FROM CSV
                            <input onChange={uploadCSV} type='file' accept='.csv' />
                        </label>
                        <Link target='_blank' href='/admin/csv'><div>Learn more</div></Link>
                    </div>)}
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
                            {questionId && <div style={{fontStyle: 'italic', fontSize: '0.9rem'}}>Editing "{infoTitle || target.split('\n')[0]}"</div>}
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
    </>);
}