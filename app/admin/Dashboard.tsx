'use client'

import { Course, Prisma } from '@prisma/client';
import { User } from '../../lib/user';
import styles from './Admin.module.scss';
import cn from 'classnames';
import { FormEventHandler, useEffect, useState } from 'react';
import { TiDelete } from 'react-icons/ti';
import { ClipLoader } from 'react-spinners';
import variables from '../_variables.module.scss';
import { useRouter } from 'next/navigation';
import Breadcrumbs, { Breadcrumb } from './Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';

type CourseWithModules = Prisma.CourseGetPayload<{include: {modules: true}}>;

export default function Dashboard({ user, courses }: { user: User, courses: CourseWithModules[] }) {

    const [ modalVisible, setModalVisible ] = useState(false);
    const [ language, setLanguage ] = useState('');

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const router = useRouter();

    const breadcrumbs: Breadcrumb[] = [
        {
            name: 'My Dashboard',
            link: '/admin'
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

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        if (!language) return;

        setIsSubmitting(true);

        const res = await fetch('/api/course', {
            method: 'POST',
            body: JSON.stringify({ language }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        setIsSubmitting(false);

        if (data.code === 'OK') {
            router.push(`/admin/course/${data.redirectId}`);
        } else {
            console.log(data);
        }
    };

    return (
        <main className={styles.container}>
            <Breadcrumbs trail={breadcrumbs} />
            <h2>MY DASHBOARD</h2>
            <div className={styles.contentContainer}>
                <h5>MY COURSES</h5>
                <div className={styles.courseList}>
                    {courses.map(course => {
                        return (
                            <Link style={{display: 'block'}} href={`/admin/course/${course.id}`} key={course.id}>
                                <div style={{backgroundColor: course.published ? '' : '#dadada', color: course.published ? '' : variables.foregroundColor}} className={styles.courseThumbnail}>
                                    <h4>{course.language}</h4>
                                    {course.image ? (
                                    <div className={styles.imageContainer}>
                                        <Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${course.image}`} alt="Course image" />
                                    </div>
                                    ) : (null)}
                                    <div>{course.modules.length} modules</div>
                                    <div style={{fontStyle: 'italic', textAlign: 'center', fontSize: '0.8rem'}}>{course.published ? 'PUBLISHED' : 'UNDER CONSTRUCTION'}</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                <button onClick={toggleModal}>ADD A COURSE</button>
            </div>
            <div className={cn(styles.modal, {[styles.visible]: modalVisible})}>
                <div>
                    <form onSubmit={submitClicked}>
                        <h4>CREATE A COURSE</h4>
                        <input type='text' placeholder='Language' value={language} onChange={e => setLanguage(e.target.value)} />
                        {!isSubmitting ? <input type="submit" value="CREATE!" /> : 
                        <ClipLoader color={variables.themeRed} loading={true} />}
                    </form>
                    <button className={styles.cancel} onClick={toggleModal}><TiDelete /></button>
                </div>
            </div>
        </main>
    ); 

}