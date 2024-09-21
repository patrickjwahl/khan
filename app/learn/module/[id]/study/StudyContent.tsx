'use client'

import { Module } from "@prisma/client";
import styles from '../../../lesson/[id]/Lesson.module.scss';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import cn from 'classnames';
import { LessonQuestion } from "@/app/learn/lesson/[id]/page";
import { setUpSentenceHintListeners, setUpWordHintListeners } from "@/app/learn/lesson/[id]/LessonScreen";

export default function StudyContent({ screens, module }: { screens: LessonQuestion[], module: Module }) {

    const [ selectedScreen, setSelectedScreen ] = useState(0)

    const screen = screens[selectedScreen]

    const router = useRouter()

    const switchScreen = (index: number): void => {
        setSelectedScreen(index);
    }

    useEffect(() => {
        return setUpSentenceHintListeners(screens[selectedScreen])
    }, [selectedScreen])

    useEffect(() => {
        return setUpWordHintListeners(screens[selectedScreen])
    }, [selectedScreen])

    return (
        <div className={styles.container}>
            <div className={styles.studyContainer}>
                <div className={styles.studySidebar}>
                    <h2>STUDY</h2>
                    <h4>{module.title}</h4>
                    <button onClick={() => router.push(`/learn/course/${module.courseId}`)}>RETURN TO COURSE</button>
                    <ul>
                        {screens.map((screen, index) => {
                            return (
                                <li key={screen.id} onClick={() => switchScreen(index)} className={cn({[styles.selected]: selectedScreen === index})}>
                                    {screen.infoTitle}
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <div className={styles.studyContent}>
                    { screen ? (
                        <div className={styles.infoContent}>
                            <h5>{screen.infoTitle}</h5>
                            {screen.info && <div dangerouslySetInnerHTML={{__html: screen.info}} />}
                        </div>
                    ) : (<h5>This module doesn't have any study guides!</h5>)}
                </div>
            </div>
        </div>
    )
}