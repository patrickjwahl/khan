'use client'
import Image from 'next/image';
import styles from '../../Learn.module.scss';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';
import variables from '../../../v.module.scss';
import cn from 'classnames';
import { useState, useEffect } from 'react';

import { Course, Lesson, Module, Prisma, UserCourse } from "@prisma/client";
import Link from 'next/link';
import ProgressBar from '@ramonak/react-progress-bar';
import { COMPLETIONS_FOR_LESSON_PASS } from '@/lib/settings';
import Navbar from '../../Navbar';
import { ModuleWithLessonsAndCourse } from '@/app/admin/module/[id]/ModuleDashboard';

export type CourseWithModulesAndLessons = Prisma.CourseGetPayload<{include: {modules: {include: {lessons: true}}}}>;
type ModuleWithLessons = Prisma.ModuleGetPayload<{include: {lessons: true}}>

export default function CourseContent({ course, moduleIndex: initModuleIndex, lessonIndex: initLessonIndex, lessonCompletions: initLessonCompletions }: { course: CourseWithModulesAndLessons, moduleIndex: number, lessonIndex: number, lessonCompletions: number }) {

    const [ moduleIndex, setModuleIndex ] = useState(initModuleIndex);
    const [ lessonIndex, setLessonIndex ] = useState(initLessonIndex);
    const [ lessonCompletions, setLessonCompletions ] = useState(initLessonCompletions);
    const [ activeModule, setActiveModule ] = useState(0);

    useEffect(() => {
        if (moduleIndex === -1) {
            setModuleIndex(JSON.parse(localStorage.getItem('guestSession') || '{}')[course.id]?.moduleIndex || 0);
            setLessonIndex(JSON.parse(localStorage.getItem('guestSession') || '{}')[course.id]?.lessonIndex || 0);
            setLessonCompletions(JSON.parse(localStorage.getItem('guestSession') || '{}')[course.id]?.lessonCompletions || 0);
        }
    }, []);

    useEffect(() => {
        const urlSplit = document.URL.split('#')
        if (urlSplit.length > 1) {
            const anchorSplit = urlSplit[1].split('-')
            if (anchorSplit.length > 1) {
                const anchorModule = parseInt(anchorSplit[1])
                setActiveModule(anchorModule)
            }
        }
    }, []);

    const changeActiveModule = (moduleId: number) => {
        return () => {
            setActiveModule(moduleId)
            const moduleView = document.getElementById(`module-${moduleId}`);
            moduleView?.scrollIntoView({behavior: 'smooth'})
        }
    }

    const arrows = course.modules.map((module, mIndex) => {

        const firstArrow = mIndex !== 0 ? <Xarrow key={`m${mIndex}`} start={`${course.modules[mIndex - 1].id}-${course.modules[mIndex-1].lessons[course.modules[mIndex-1].lessons.length - 1].id}`}
            end={`module-${module.id}`} showHead={false} color={variables.pink} path='straight' startAnchor='middle' endAnchor='middle' strokeWidth={8} /> : (null);

        const others = module.lessons.map((lesson, lIndex) => {
            return <Xarrow key={`${mIndex}-${lIndex}`} start={lIndex === 0 ? `module-${module.id}` : `${module.id}-${module.lessons[lIndex - 1].id}`}
                end={`${module.id}-${lesson.id}`} showHead={false} color={variables.pink} path='straight' startAnchor='middle' endAnchor='middle' strokeWidth={8} />
        });

        return [firstArrow, ...others];
    }).flat();

    // const ArrowUpdater = () => {
    //     const updateXarrow = useXarrow();
    //     setInterval(() => {
    //         updateXarrow();
    //     }, 100);

    //     return (null);
    // }

    const isLessonUnlocked = (queryModule: Module, queryLesson: Lesson): boolean => {
        return !course.published || !queryModule.published || moduleIndex > queryModule.index || (moduleIndex === queryModule.index && lessonIndex >= queryLesson.index)
    }

    const isTestUnlocked = (queryModule: ModuleWithLessons): boolean => {
        const maxLessonIndex = Math.max(...queryModule.lessons.map(l => l.index))
        return moduleIndex > queryModule.index || (moduleIndex === queryModule.index && lessonIndex === maxLessonIndex && lessonCompletions == COMPLETIONS_FOR_LESSON_PASS) || !queryModule.published || !course.published
    }

    const isModuleUnlocked = (queryModule: Module): boolean => {
        return !course.published || !queryModule.published || moduleIndex >= queryModule.index
    }

    return (
        <div className={styles.container}>
            <div className={styles.courseHeader}>
                <h1>{course.language.toUpperCase()}</h1>
                { course.image && (
                <div className={styles.languageImageContainer}>
                    <Image src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${course.image}`} alt='Language icon' fill />
                </div>     
                )}
                {!course.published && <h5 className={styles.previewModeBanner}>This course is in preview mode!</h5>}
            </div>
            <div className={styles.courseBody}>
                <div className={styles.courseIndex}>
                    <ul>
                        {course.modules.map(module => (
                            <li className={cn({[styles.selected]: activeModule === module.id})} onClick={changeActiveModule(module.id)}>{module.title}</li>
                        ))}
                    </ul>
                </div>
                <div className={styles.moduleList}>
                    {course.modules.map(module => {
                        return (
                        <div key={module.id} className={styles.moduleContainer}>
                            <div id={`module-${module.id}`} className={cn(styles.moduleHeader, {[styles.disabled]: !isModuleUnlocked(module)})}>
                                {module.image && 
                                <div className={styles.moduleImageContainer}>
                                    <Image src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${module.image}`} alt={`${module.title} icon`} fill />
                                </div>
                                }
                                <div>
                                    <div className={styles.moduleIndexLabel}>MODULE {module.index + 1}</div>
                                    <h4>{module.title}</h4>
                                    <div className={styles.headerButtonContainer}>
                                        <a href={`/learn/module/${module.id}/study`}><button className='orange'>STUDY</button></a>
                                        <a href={`/learn/module/${module.id}/practice`}><button className='purple'>PRACTICE</button></a>
                                    </div>
                                    {!module.published && <div>This module is in preview mode!</div>}
                                </div>
                            </div>
                            <div className={styles.moduleBody}>
                                {module.lessons.map(lesson => {
                                    return (
                                        <a key={lesson.id} href={`/learn/lesson/${lesson.id}`}>
                                            <button onClick={e => {if (!isLessonUnlocked(module, lesson)) e.preventDefault()}} key={lesson.id} id={`${module.id}-${lesson.id}`} className={cn(styles.lessonButton, 'blue', {[styles.current]: module.index === moduleIndex && lesson.index === lessonIndex, [styles.disabled]: !isLessonUnlocked(module, lesson)})}>
                                                {lesson.title.toUpperCase()}
                                                {module.index === moduleIndex && lesson.index === lessonIndex && <ProgressBar completed={Math.floor(lessonCompletions * 100 / COMPLETIONS_FOR_LESSON_PASS)} isLabelVisible={false} bgColor={variables.gold} height='10px' barContainerClassName={styles.progressBar} className={styles.progressBarContainer}/>}
                                            </button>
                                        </a>
                                    );
                                })}
                                <div className={styles.testButtonWrapper}>
                                    <a href={`/learn/module/${module.id}/test`}>
                                        <button onClick={e => {if (!isTestUnlocked(module)) e.preventDefault()}} className={cn(styles.testButton, {[styles.disabled]: !isTestUnlocked(module)})}>
                                            <span>CHALLENGE</span>
                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                    {/* <Xwrapper>
                        <ArrowUpdater />
                        {arrows}
                    </Xwrapper> */}
                </div>
            </div>
        </div>
    );
}