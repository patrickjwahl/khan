'use client'

import styles from './Admin.module.scss';
import React, { ReactNode, createContext, useCallback, useEffect, useState } from 'react';
import cn from 'classnames';

export const ToastContext = createContext((msg: string) => {});

export default function ToastContextProvider({ children }: { children: ReactNode }) {
    const [ message, setMessage ] = useState('');
    const [ visible, setVisible ] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessage('');
        }, 3300);

        const visibleTimer = setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => {
            clearTimeout(visibleTimer)
            clearTimeout(timer);
        };
    }, [message]);

    const addToast = useCallback((msg: string) => {
        setMessage(msg);
        setVisible(true);
    }, [setMessage]);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className={cn(styles.toastContainer, {[styles.visible]: visible})}>
                <div>{message}</div>
            </div>
        </ToastContext.Provider>
    )
}