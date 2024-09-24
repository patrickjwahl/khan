import { Prisma, Question } from '@prisma/client';
import styles from '../../Admin.module.scss';
import { AiFillSound } from 'react-icons/ai';
import { typeToIcon } from '../../lesson/[id]/LessonDashboard';
import cn from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import { HiExclamationCircle } from 'react-icons/hi';
import variables from '../../../_variables.module.scss';
import { ModuleWithLessonsAndCourse } from './ModuleDashboard';
import { FaCheckCircle, FaStop } from 'react-icons/fa';
import { GiNotebook, GiTargetArrows } from 'react-icons/gi';
import { TiDelete } from 'react-icons/ti';
import { ImEmbed2 } from 'react-icons/im';
import Link from 'next/link';
import { ToastContext } from '../../Toast';
import { getMainVariant, stripInnerDelimiter } from '@/lib/string_processing';
import QuestionEditor from './QuestionEditor';
import { playTableRecording } from '@/lib/audio';

type QuestionWithFeedbackAndLesson = Prisma.QuestionGetPayload<{include: {feedbackRules: true, lesson: true, wordHintsBackward: { include: {wordEntity: true}}, wordHintsForward: { include: {wordEntity: true}}}}>;
export type QuestionWithFeedback = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsForward: { include: {wordEntity: true}}, wordHintsBackward: { include: {wordEntity: true}}}}>;

export default function ScreenDisplay({ module, questions, forceSelectedQuestion, ackSelectedQuestion, notesClicked, fetchData }: {module: ModuleWithLessonsAndCourse, questions: QuestionWithFeedbackAndLesson[], forceSelectedQuestion: Question | null, ackSelectedQuestion: () => void, notesClicked: (question: QuestionWithFeedback, e: React.MouseEvent<HTMLButtonElement>) => void, fetchData: () => Promise<void>} ) {

    const [ selectedQuestionIndex, setSelectedQuestionIndex ] = useState<number | null>(null)
    const selectedQuestion = selectedQuestionIndex !== null ? questions[selectedQuestionIndex] : null

    const addToast = useContext(ToastContext);

    useEffect(() => {
        if (forceSelectedQuestion) {
            const index = questions.findIndex(q => forceSelectedQuestion.id === q.id)
            setSelectedQuestionIndex(index);
            const el = document.getElementById(`question-${questions[index].id}`);
            el?.scrollIntoView({block: 'center'});
            ackSelectedQuestion();
        } 
    }, [forceSelectedQuestion]);


    const editRow = async (index: number) => {
        setSelectedQuestionIndex(index);
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

    const copyEmbedCode = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, q: Question) => {
        e.stopPropagation(); 
        navigator.clipboard.writeText(`// -------------------------\n// EMBEDDED SENTENCE (DO NOT MODIFY)\n// ${getMainVariant(q.target)}\n#[${q.id}]\n// -------------------------`); 
        addToast('Copied to clipboard');
    };

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
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {questions.map((q, index) => {
                                    return (
                                        <tr id={`question-${q.id}`} onClick={() => editRow(index)} key={q.id} className={cn({[styles.info]: selectedQuestion?.id === q.id})}>
                                            <td>{typeToIcon(q.type)}</td>
                                            <td>{q.type !== 'QUESTION' ? (null) : !q.recording ? <HiExclamationCircle style={{color: variables.themeRed, fontSize: '1.2rem'}} /> : <button onClick={e => {e.stopPropagation(); playTableRecording(q)}} className={styles.iconButton}><FaCheckCircle style={{color: variables.themeGreen}} /></button>}</td>
                                            <td style={{fontWeight: q.type === 'INFO' ? 'bold' : 'normal'}}>{stripInnerDelimiter(getMainVariant(q.target)) || q.infoTitle}</td>
                                            <td>{stripInnerDelimiter(getMainVariant(q.native))}</td>
                                            <td>{!q.notes ? (null) : <button onClick={e => notesClicked(q, e)} className={styles.iconButton}><GiNotebook /></button>}</td>
                                            <td>{q.lesson && q.lesson.index + 1}</td>
                                            <td><button title='Copy embed code' onClick={(e) => copyEmbedCode(e, q)} className={styles.iconButton}><ImEmbed2 style={{fontSize: '1.2rem'}} /></button></td>
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
                <QuestionEditor module={module} question={selectedQuestion} language={module.course.language} fetchData={fetchData} />
            </div>
    </>);
}