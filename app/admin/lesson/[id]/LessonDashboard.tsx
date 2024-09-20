'use client'

import { Prisma, Question, QuestionType } from "@prisma/client";
import styles from '../../Admin.module.scss';
import React, { FormEventHandler, MouseEventHandler, useContext, useEffect, useRef, useState } from "react";
import { TiDelete } from "react-icons/ti";
import { FaSkullCrossbones, FaStop } from 'react-icons/fa';
import { BsPencilFill, BsRecordCircleFill } from "react-icons/bs";
import { AiFillSound } from 'react-icons/ai';
import { GiNotebook } from 'react-icons/gi';
import { HiExclamationCircle } from 'react-icons/hi';
import { FaArrowCircleUp } from 'react-icons/fa';
import { FaArrowCircleDown } from 'react-icons/fa';
import { FaCheckCircle } from 'react-icons/fa';
import { GoLightBulb } from 'react-icons/go';
import cn from 'classnames';
import variables from '../../../_variables.module.scss';
import Breadcrumbs, { Breadcrumb } from "../../Breadcrumbs";
import Link from "next/link";
import { getMainVariant, stripInnerDelimiter } from "@/lib/string_processing";
import QuestionEditor from "../../module/[id]/QuestionEditor";
import { ToastContext } from "../../Toast";
import { post } from "@/lib/api";
import { playTableRecording } from "@/lib/audio";

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

export default function LessonDashboard({ initLesson, prevId, nextId }: { initLesson: LessonWithEverything, prevId?: number, nextId?: number }) {

    const [ lesson, setLesson ] = useState(initLesson);

    const [ selectedQuestion, setSelectedQuestion ] = useState<QuestionWithFeedback | null>(null);

    const defaultOrder = Array.from({length: lesson.questions.length}, (x, i) => i);
    const [ order, setOrder ] = useState(defaultOrder);

    const [ newTitle, setNewTitle ] = useState('');
    
    const [ unsavedChanges, setUnsavedChanges ] = useState(false);

    const [ upIndex, setUpIndex ] = useState(-1);
    const [ downIndex, setDownIndex ] = useState(-1);

    const [ notesDisplay, setNotesDisplay ] = useState('');

    const notesRef = useRef<HTMLDivElement>(null);

    const addToast = useContext(ToastContext)

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

    const editRow = async (question: QuestionWithFeedback) => {
        setSelectedQuestion(question)
    };

    const decreaseIndex = (index: number) => {

        if (index === 0) return;

        const newOrder = [...order];
        const placeholder = newOrder[index - 1];
        newOrder[index - 1] = newOrder[index];
        newOrder[index] = placeholder;

        setUpIndex(index);
        setDownIndex(index - 1);

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

        setUpIndex(index + 1);
        setDownIndex(index);

        setTimeout(() => {
            setOrder(newOrder);
            setUpIndex(-1);
            setDownIndex(-1);
        }, 280);

        setUnsavedChanges(true);
    }

    const updateOrder = async () => {
        const payload = {
            order,
            moduleId: lesson.moduleId
        }

        const res = await post(`/api/lesson/${lesson.id}/order`, payload)

        const data = await res.json();
        fetchData();
        setUnsavedChanges(false);
        addToast('Order saved!')
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
        addToast('Title updated!')
    }

    const deleteLesson: MouseEventHandler<HTMLButtonElement> = async e => {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to delete this lesson and all its screens?")) return;

        const res = await fetch(`/api/lesson/${lesson.id}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        addToast('Lesson deleted!')
        window.location.replace(`/admin/module/${lesson.moduleId}`);
    };

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
                                    <tr onClick={() => editRow(q)} key={q.id} className={cn({[styles.up]: upIndex === index, [styles.down]: downIndex === index, [styles.info]: selectedQuestion?.id === q.id})}>
                                        <td>{typeToIcon(q.type)}</td>
                                        <td>{q.firstPass ? '1' : '2'}</td>
                                        <td>{q.type !== 'QUESTION' ? (null) : !q.recording ? <HiExclamationCircle style={{color: variables.themeRed, fontSize: '1.2rem'}} /> : <button onClick={e => {e.stopPropagation(); playTableRecording(q)}} className={styles.iconButton}><FaCheckCircle style={{color: variables.themeGreen}} /></button>}</td>
                                        <td style={{fontWeight: q.type === 'INFO' ? 'bold' : 'normal'}}>{stripInnerDelimiter(getMainVariant(q.target)) || q.infoTitle}</td>
                                        <td>{stripInnerDelimiter(getMainVariant(q.native))}</td>
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
                <QuestionEditor module={lesson.module} question={selectedQuestion} language={lesson.module.course.language} fetchData={fetchData} />
            </div>
            <div ref={notesRef} className={styles.notesDisplay}>
                {notesDisplay}
                <button onClick={hideNotes} className={styles.cancel}><TiDelete /></button>
            </div>
        </main>
    );
}