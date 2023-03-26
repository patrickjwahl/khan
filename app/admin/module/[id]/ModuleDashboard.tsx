'use client'

import { Course, Prisma, Question, Word } from "@prisma/client";
import styles from '../../Admin.module.scss';
import { FormEventHandler, MouseEventHandler, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { TiDelete } from "react-icons/ti";
import cn from 'classnames';
import variables from '../../../_variables.module.scss';
import Breadcrumbs, { Breadcrumb } from "../../Breadcrumbs";
import { AiFillSound } from "react-icons/ai";
import { FaArrowCircleDown, FaArrowCircleUp, FaSkullCrossbones } from "react-icons/fa";
import { BsCheckCircle } from 'react-icons/bs';
import Link from "next/link";
import { useS3Upload } from "next-s3-upload";
import Image from "next/image";
import { BsBroadcastPin } from "react-icons/bs";
import ScreenDisplay from "./ScreenDisplay";
import WordDisplay from "./WordDisplay";
import { QuestionWithFeedback as ScreenDisplayQuestionWithFeedback } from "./ScreenDisplay";

export type ModuleWithLessonsAndCourse = Prisma.ModuleGetPayload<{include: { lessons: { include: { questions: true }}, course: true }}>;
export type QuestionWithFeedback = Prisma.QuestionGetPayload<{include: {feedbackRules: true, lesson: true, wordHints: { include: { wordEntity: true }}}}>;

export default function ModuleDashboard({ initModule, nextId, prevId, initModuleQuestions, words, wordsToQuestions }: { initModule: ModuleWithLessonsAndCourse, nextId?: number, prevId?: number, initModuleQuestions: QuestionWithFeedback[], words: Word[], wordsToQuestions: {[id: number]: Question[]} }) {

    const [ module, setModule ] = useState(initModule);
    const [ moduleQuestions, setModuleQuestions ] = useState(initModuleQuestions);

    const [ modalVisible, setModalVisible ] = useState(false);
    const [ title, setTitle ] = useState('');

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const [ forceSelectedQuestion, setForceSelectedQuestion ] = useState<null | Question>(null);

    const [ newTitle, setNewTitle ] = useState('');

    const [ notesDisplay, setNotesDisplay ] = useState('');
    
    const defaultOrder = Array.from({length: module.lessons.length}, (x, i) => i);
    const [ order, setOrder ] = useState(defaultOrder);

    const [ unsavedChanges, setUnsavedChanges ] = useState(false);
    const [ upIndex, setUpIndex ] = useState(-1);
    const [ downIndex, setDownIndex ] = useState(-1);

    const [ activeTab, setActiveTab ] = useState(0);

    const router = useRouter();
    const { FileInput, openFileDialog, uploadToS3 } = useS3Upload();

    const notesRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: Breadcrumb[] = [
        {
            name: 'My Dashboard',
            link: '/admin'
        },
        {
            name: module.course.language,
            link: `/admin/course/${module.courseId}`
        },
        {
            name: module.title,
            link: `/admin/module/${module.id}`
        },
    ];


    const fetchData = async () => {
        const res = await fetch(`/api/module/${module.id}`);
        const data = await res.json();
        setModule(data.module);
        setModuleQuestions(data.moduleQuestions);
        setOrder(defaultOrder);
    };

    const setSelectedQuestionFromWords = (question: Question) => {
        setForceSelectedQuestion(question);
        setActiveTab(0);
    };

    const ackSelectedQuestion = () => {
        setForceSelectedQuestion(null);
    };

    const notesClicked = (question: ScreenDisplayQuestionWithFeedback, e: React.MouseEvent<HTMLButtonElement>) => {

        e.stopPropagation();

        if (!question.notes || !notesRef.current) return;

        setNotesDisplay(question.notes);
        notesRef.current.style.display = 'block';
        notesRef.current.style.top = `${e.pageY}px`;
        notesRef.current.style.left = `${e.pageX}px`;

        console.log('hello');
    }

    const hideNotes = () => {
        if (!notesRef.current) return;
        notesRef.current.style.display = 'none';
    }

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
        setModalVisible(!modalVisible);
    };

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
            order
        };

        const res = await fetch(`/api/module/${module.id}/order`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        fetchData();
        setUnsavedChanges(false);
    };

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        if (!title) return;

        setIsSubmitting(true);

        const index = module.lessons.length > 0 ? Math.max(...module.lessons.map(q => q.index)) + 1 : 0;

        const res = await fetch('/api/lesson', {
            method: 'POST',
            body: JSON.stringify({ 
                moduleId: module.id, 
                title,
                index: index
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        setModalVisible(false);

        if (data.code === 'OK') {
            router.push(`/admin/lesson/${data.redirectId}`);
        } else {
            console.log(data);
        }
    };

    const updateTitle: FormEventHandler = async e => {
        e.preventDefault();
        if (!newTitle) return;

        const payload = {
            title: newTitle,
        }

        const res = await fetch(`/api/module/${module.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        fetchData();
    };

    const deleteModule: MouseEventHandler = async e => {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to delete this module and all its lessons?")) return;

        const res = await fetch(`/api/module/${module.id}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        window.location.replace(`/admin/course/${module.courseId}`);
    };

    const uploadImage = async (file: File) => {
        const { url } = await uploadToS3(file);
        const payload = {
            image: file.name
        };

        const res = await fetch(`/api/module/${module.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        fetchData();
    };

    const publishCourse = async (e: React.MouseEvent<HTMLButtonElement>, should: boolean) => {
        e.preventDefault();

        if (!window.confirm(should ? "Are you sure you want to publish this? The whole world is watching..." : "Are you should you want to unpublish this? No one will be able to see your masterpiece!")) return;

        const payload = {
            published: should
        };

        const res = await fetch(`/api/module/${module.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        fetchData();
    };

    return (
        <main className={styles.container}>
            <Breadcrumbs trail={breadcrumbs} />
            <h6>MODULE</h6>
            <h2>{module.title.toUpperCase()}</h2>
            <div style={{display: 'flex', gap: '200px', height: '80px'}}>
                {prevId ? <Link style={{width: '150px'}}  href={`/admin/module/${prevId}`}>{'<< '} Previous Module</Link> : <div style={{width: '150px'}}></div>}
                {module.image ? (
                <div style={{marginTop: '-1.2rem', marginBottom: '1.2rem'}} className={styles.imageContainer}>
                    <Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${module.image}`} alt="Module image" />
                </div>
                ) : <div style={{width: '80px'}}></div>}
                {nextId ? <Link style={{width: '150px'}} href={`/admin/module/${nextId}`}>Next Module {' >>'}</Link> : <div style={{width: '150px'}}></div>}
            </div>
            <div style={{backgroundColor: module.published ? variables.themeBlue : variables.themeRed, padding: '0.4rem', color: variables.backgroundColor, borderRadius: '8px', fontSize: '0.8rem', marginBottom: '0.8rem', fontWeight: module.published ? 'bold' : 'normal'}}>{module.published ? <><BsCheckCircle /> PUBLISHED</> : 'UNDER CONSTRUCTION'}</div>
            <form onSubmit={updateTitle} style={{fontSize: '12px', display: 'flex', flexDirection: 'row', gap: '0.8rem', marginBottom: '2.4rem'}}>
                <input type='text' placeholder="New title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <input type='submit' value="CHANGE TITLE" />
                <FileInput onChange={uploadImage} accept="image/jpg, image/jpeg, image/png" />
                <button onClick={e => {e.preventDefault(); openFileDialog();}}>CHANGE IMAGE</button>
                <button className={styles.deleteButton} onClick={deleteModule}><FaSkullCrossbones /> DELETE MODULE</button>
                {!module.published ? <button className="important" onClick={e => publishCourse(e, true)}><BsBroadcastPin /> PUBLISH MODULE</button> : <button onClick={e => publishCourse(e, false)}>UNPUBLISH MODULE</button>}
            </form>
            <div className={styles.contentContainer}>
                <h5>LESSONS</h5>
                {module.lessons.length > 0 ? (
                    <table className={styles.lessonTable}>
                        <colgroup>
                            <col />
                            <col />
                            <col />
                            <col style={{width: '5%'}} />
                            <col style={{width: '5%'}} />
                            <col style={{width: '5%'}} />
                        </colgroup>
                        <thead>
                        <tr>
                            <th>Title</th>
                            <th>Screens</th>
                            <th><AiFillSound /> !</th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.map(index => module.lessons[index]).map((lesson, index) => {
                            const badQuestions = lesson.questions.filter(q => q.type === 'QUESTION' && !q.recording).length;

                            return (
                                <tr key={lesson.id} className={cn({[styles.up]: upIndex === index, [styles.down]: downIndex === index})}>
                                    <td style={{fontWeight: 'bold'}}>{lesson.title}</td>
                                    <td>{lesson.questions.length}</td>
                                    <td style={{color: badQuestions > 0 ? variables.themeRed : 'inherit'}}>{badQuestions}</td>
                                    <td><Link href={`/admin/lesson/${lesson.id}`}><button>Edit</button></Link></td>
                                    <td><button onClick={() => decreaseIndex(index)} className={styles.iconButton}><FaArrowCircleUp /></button></td>
                                    <td><button onClick={() => increaseIndex(index)} className={styles.iconButton}><FaArrowCircleDown /></button></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (<div className={styles.noScreens}>No lessons yet!</div>)}
                <div style={{display: 'flex', width: '100%', justifyContent: 'center', gap: '20px'}}>
                    <button onClick={toggleModal}>ADD A LESSON</button>
                    {unsavedChanges ? <button onClick={updateOrder} className='important' style={{backgroundColor: variables.themeGreen}}>SAVE ORDER</button> : (null)}
                </div>
            </div>
            <div className={styles.tabsContainer}>
                <div className={styles.tabButtonsContainer}>
                    <button onClick={() => setActiveTab(0)} className={cn(styles.tabButton, {[styles.active]: activeTab === 0})}>SCREENS</button>
                    <button onClick={() => setActiveTab(1)} className={cn(styles.tabButton, {[styles.active]: activeTab === 1})}>WORDS</button>
                </div>
                <div style={{display: activeTab === 0 ? 'block' : 'none'}}>
                    <ScreenDisplay fetchData={fetchData} questions={moduleQuestions} module={module} notesClicked={notesClicked} forceSelectedQuestion={forceSelectedQuestion} ackSelectedQuestion={ackSelectedQuestion} />
                </div>
                <div style={{display: activeTab === 1 ? 'block' : 'none'}}>
                    <WordDisplay initWords={words} module={module} initWordsToQuestions={wordsToQuestions} setQuestion={setSelectedQuestionFromWords} />
                </div>
            </div>
            <div className={cn(styles.modal, {[styles.visible]: modalVisible})}>
                <div>
                    <form onSubmit={submitClicked}>
                        <h4>CREATE A LESSON</h4>
                        <input type='text' placeholder='Lesson Title' value={title} onChange={e => setTitle(e.target.value)} />
                        {!isSubmitting ? <input type="submit" value="CREATE!" /> : 
                        <ClipLoader color={variables.themeRed} loading={true} />}
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