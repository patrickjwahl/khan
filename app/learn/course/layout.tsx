import { ReactNode, Suspense } from "react"
// import '../../user_globals.scss';
import styles from '../Learn.module.scss'
import Navbar from "../Navbar"
import Sidebar from "./Sidebar"
import { useUser } from "@/lib/user"
import { prisma } from "@/lib/db"
import { Theme } from "@/app/GlobalState"

export default async function AdminLayout({ children }: { children: ReactNode }) {

    const user = await useUser()
    let userData
    if (user) {
        userData = await prisma.user.findFirst({
            where: {
                id: user.id
            },
            select: {
                theme: true
            }
        })
    }

    return (
        <div className={styles.layoutContainer}>
            <div className={styles.layoutNavbarContainer}>
                <Navbar isCourse theme={userData?.theme as Theme || 'light'} />
            </div>
            <div id='main-container' className={styles.layoutMainContainer}>
                <div className={styles.layoutCourseContainer}>
                    {children}
                </div>
                <div className={styles.layoutSidebarContainer}>
                    {/* @ts-expect-error Async Server Component */}
                    <Sidebar />
                </div>
            </div>
        </div>
    )
}