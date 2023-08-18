import { ReactNode } from "react";
import '../globals.scss';
import React from 'react';
import ToastContextProvider from "./Toast";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return <ToastContextProvider>
        {children}
    </ToastContextProvider>
}