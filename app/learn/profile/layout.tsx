import { ReactNode, Suspense } from "react";
import '../../user_globals.scss';
import styles from '../Learn.module.scss';
import Navbar from "../Navbar";
import { useSelectedLayoutSegments } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode}) {

    return (
        <div className={styles.layoutContainer}>
            <div className={styles.layoutNavbarContainer}>
                <Navbar />
            </div>
            <div className={styles.layoutMainContainer}>
                <div className={styles.layoutCourseContainer}>
                    {children}
                </div>
            </div>
        </div>
    );
}