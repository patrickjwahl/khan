import React, { useEffect } from 'react'
import { ReactNode } from "react"
import styles from './LearnModal.module.scss'

export default function LearnModal({ isOpen, children }: { isOpen: boolean, children: ReactNode }) {

    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);

    if (!isOpen) return null

    return (
        <div className={styles.container}>
            <div className={styles.body}>
                {children}
            </div>
        </div>
    )
}