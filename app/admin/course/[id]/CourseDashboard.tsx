'use client'

import { Course, Module, Prisma, PrismaClient } from "@prisma/client";
import styles from '../../Admin.module.scss';
import React, { ChangeEvent, ChangeEventHandler, FormEventHandler, MouseEventHandler, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { TiDelete } from "react-icons/ti";
import cn from 'classnames';
import variables from '../../../_variables.module.scss';
import Breadcrumbs, { Breadcrumb } from "../../Breadcrumbs";
import { AiFillSound } from "react-icons/ai";
import Link from "next/link";
import { FaArrowCircleDown, FaArrowCircleUp, FaSkullCrossbones } from "react-icons/fa";
import { useS3Upload } from 'next-s3-upload';
import Image from "next/image";
import { BsBroadcastPin } from "react-icons/bs";
import { User } from "@/lib/user";
import { User as PrismaUser } from '@prisma/client';

type CourseWithModules = Prisma.CourseGetPayload<{include: { owner: true, editors: true, modules: { include: {lessons: true }}}}>;

export default function CourseDashboard({ course, badQuestionsPerModule, user }: { course: CourseWithModules, badQuestionsPerModule: {[id: number]: number}, user: User}) {

    console.log('UF');
    console.log(user);

    const [ modalVisible, setModalVisible ] = useState(false);
    const [ title, setTitle ] = useState('');

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const defaultOrder = Array.from({length: course.modules.length}, (x, i) => i);
    const [ order, setOrder ] = useState(defaultOrder);

    const [ unsavedChanges, setUnsavedChanges ] = useState(false);
    const [ upIndex, setUpIndex ] = useState(-1);
    const [ downIndex, setDownIndex ] = useState(-1);

    const [ newUser, setNewUser ] = useState('');
    const [ newUserError, setNewUserError ] = useState(false);

    const [ newTitle, setNewTitle ] = useState('');

    const { FileInput, openFileDialog, uploadToS3 } = useS3Upload();


    const router = useRouter();

    const breadcrumbs: Breadcrumb[] = [
        {
            name: 'My Dashboard',
            link: '/admin'
        },
        {
            name: course.language,
            link: `/admin/course/${course.id}`
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
        setModalVisible(!modalVisible);
    }

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

        const res = await fetch(`/api/course/${course.id}/order`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        location.reload();
    };

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        if (!title) return;

        setIsSubmitting(true);

        const index = course.modules.length > 0 ? Math.max(...course.modules.map(q => q.index)) + 1 : 0;
        console.log('poop');
        console.log(index);

        const res = await fetch('/api/module', {
            method: 'POST',
            body: JSON.stringify({ 
                title, 
                courseId: course.id,
                index: index}),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (data.code === 'OK') {
            router.push(`/admin/module/${data.redirectId}`);
        } else {
            console.log(data);
        }
    };

    const updateLanguage: FormEventHandler = async e => {

        e.preventDefault();
        if (!newTitle) return;

        const payload = {
            language: newTitle,
        }

        const res = await fetch(`/api/course/${course.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        location.reload();
    };

    const toggleCheckpoint = async (e: ChangeEvent<HTMLInputElement>, module: Module) => {
        const payload = {
            isCheckpoint: e.target.checked
        };

        const res = await fetch(`/api/module/${module.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        location.reload();
    }

    const deleteCourse: MouseEventHandler = async e => {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to delete this course and all its modules?")) return;

        const res = await fetch(`/api/course/${course.id}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        window.location.replace(`/admin`);
    };

    const uploadImage = async (file: File) => {
        const { url } = await uploadToS3(file);
        const payload = {
            image: file.name
        };

        const res = await fetch(`/api/course/${course.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        location.reload();
    };

    const publishCourse = async (e: React.MouseEvent<HTMLButtonElement>, should: boolean) => {
        e.preventDefault();

        if (!window.confirm(should ? "Are you sure you want to publish this? The whole world is watching..." : "Are you should you want to unpublish this? No one will be able to see your masterpiece!")) return;

        const payload = {
            published: should
        };

        const res = await fetch(`/api/course/${course.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        location.reload();
    };

    const addEditor: FormEventHandler = async (e) => {
        e.preventDefault();

        const payload = {
            username: newUser
        };

        const res = await fetch(`/api/course/${course.id}/editor`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (data.code === 'NO_SUCH_USER') {
            setNewUserError(true);
            return;
        }

        location.reload();
    }

    const removeEditor = async (editor: PrismaUser) => {

        const payload = {
            id: editor.id
        };

        const res = await fetch(`/api/course/${course.id}/editor`, {
            method: 'DELETE',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        location.reload();
    }

    return (
        <main className={styles.container}>
            <Breadcrumbs trail={breadcrumbs} />
            <h6>COURSE</h6>
            <h2>{course.language.toUpperCase()}</h2>
            {course.image ? (
            <div style={{marginTop: '-1.2rem', marginBottom: '1.2rem'}} className={styles.imageContainer}>
                <Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${course.image}`} alt="Course image" />
            </div>
            ) : (null)}
            <div style={{backgroundColor: course.published ? variables.themeBlue : variables.themeRed, padding: '0.4rem', color: variables.backgroundColor, borderRadius: '8px', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.8rem', fontWeight: course.published ? 'bold' : 'normal'}}>{course.published ? 'PUBLISHED' : 'UNDER CONSTRUCTION'}</div>
            <form onSubmit={updateLanguage} style={{fontSize: '12px', display: 'flex', flexDirection: 'row', gap: '0.8rem', marginBottom: '2.4rem'}}>
                <input type='text' placeholder="New language name..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <input type='submit' value="CHANGE LANGUAGE" />
                <FileInput onChange={uploadImage} accept="image/jpg, image/jpeg, image/png" />
                <button onClick={e => {e.preventDefault(); openFileDialog();}}>CHANGE IMAGE</button>
                <button className={styles.deleteButton} onClick={deleteCourse}><FaSkullCrossbones /> DELETE COURSE</button>
                {!course.published ? <button className="important" onClick={e => publishCourse(e, true)}><BsBroadcastPin /> PUBLISH COURSE</button> : <button onClick={e => publishCourse(e, false)}>UNPUBLISH COURSE</button>}
            </form>
            <div className={styles.contentContainer}>
                <h5>MODULES</h5>
                {course.modules.length > 0 ? (
                    <table className={styles.lessonTable}>
                        <colgroup>
                            <col />
                            <col />
                            <col />
                            <col />
                            <col />
                            <col />
                            <col style={{width: '5%'}} />
                            <col style={{width: '5%'}} />
                            <col style={{width: '5%'}} />
                        </colgroup>
                        <thead>
                        <tr>
                            <th></th>
                            <th>Title</th>
                            <th>Lessons</th>
                            <th><AiFillSound /> !</th>
                            <th>Checkpoint</th>
                            <th>Published</th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.map(index => course.modules[index]).map((module, index) => {
                            return (
                                <React.Fragment key={module.id}>
                                <tr className={cn({[styles.up]: upIndex === index, [styles.down]: downIndex === index})}>
                                    <td>{module.image && <div className={styles.tableImage}><Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${module.image}`} alt="Module image" /></div>}</td>
                                    <td style={{fontWeight: 'bold'}}>{module.title}</td>
                                    <td>{module.lessons.length}</td>
                                    <td style={{color: badQuestionsPerModule[module.id] > 0 ? variables.themeRed : 'inherit'}}>{badQuestionsPerModule[module.id]}</td>
                                    <td><input type="checkbox" checked={module.isCheckpoint} onChange={e => toggleCheckpoint(e, module)}/></td>
                                    <td>{module.published ? 'YES' : 'NO'}</td>
                                    <td><Link href={`/admin/module/${module.id}`}><button>Edit</button></Link></td>
                                    <td><button onClick={() => decreaseIndex(index)} className={styles.iconButton}><FaArrowCircleUp /></button></td>
                                    <td><button onClick={() => increaseIndex(index)} className={styles.iconButton}><FaArrowCircleDown /></button></td>
                                </tr>
                                {module.isCheckpoint ? <tr><td style={{backgroundColor: variables.themeGreen, fontSize: '0.8rem', padding: '0.2rem'}} colSpan={9}>CHECKPOINT!</td></tr> : (null)}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (<div className={styles.noScreens}>No modules yet!</div>)}
                <div style={{display: 'flex', width: '100%', justifyContent: 'center', gap: '20px'}}>
                    <button onClick={toggleModal}>ADD A MODULE</button>
                    {unsavedChanges ? <button onClick={updateOrder} className='important' style={{backgroundColor: variables.themeGreen}}>SAVE ORDER</button> : (null)}
                </div>
            </div>
            <div className={styles.contentContainer}>
                <h5>OWNER</h5>
                <div className={styles.editorContainer}>
                    <div>{course.owner.username}</div>
                </div>
                <h5 style={{marginTop: '1rem'}}>EDITORS</h5>
                <div className={styles.editorsContainer}>
                    {course.editors.map(editor => {
                        return (
                            <div className={styles.editorContainer}>
                                <div>{editor.username}</div>
                                {course.ownerId === user.id && editor.username !== user.username ? (
                                    <button onClick={() => removeEditor(editor)}>REVOKE ACCESS</button>
                                ) : (null)}
                            </div>
                        );
                    })}
                </div>
                <form className={styles.addUserForm} onSubmit={addEditor}>
                    <label>
                        Add an editor:
                        <input type="text" placeholder="Username" value={newUser} onChange={e => {if (newUserError) setNewUserError(false); setNewUser(e.target.value)}} />
                    </label>
                    <input type="submit" value="Grant Access" />
                </form>
                {newUserError ? <div>That user doesn't exist!</div> : (null) }
            </div>
            <div className={cn(styles.modal, {[styles.visible]: modalVisible})}>
                <div>
                    <form onSubmit={submitClicked}>
                        <h4>CREATE A MODULE</h4>
                        <input type='text' placeholder='Module Title' value={title} onChange={e => setTitle(e.target.value)} />
                        {!isSubmitting ? <input type="submit" value="CREATE!" /> : 
                        <ClipLoader color={variables.themeRed} loading={true} />}
                    </form>
                    <button className={styles.cancel} onClick={toggleModal}><TiDelete /></button>
                </div>
            </div>
        </main>
    );
}