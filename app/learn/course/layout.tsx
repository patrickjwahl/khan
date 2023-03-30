import { ReactNode, Suspense } from "react";
import '../../user_globals.scss';
import styles from '../Learn.module.scss';
import Navbar from "../Navbar";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: ReactNode}) {
    return (
        <div className={styles.layoutContainer}>
            <div className={styles.layoutNavbarContainer}>
                <Navbar isCourse />
            </div>
            <div className={styles.layoutMainContainer}>
                <div className={styles.layoutCourseContainer}>
                    {children}
                </div>
                <div className={styles.layoutSidebarContainer}>
                    {/* @ts-expect-error Async Server Component */}
                    <Sidebar />
                </div>
            </div>
        </div>
    );
}