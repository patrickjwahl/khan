'use client'

import { useSelectedLayoutSegments } from 'next/navigation'
import styles from './Learn.module.scss'
import Link from 'next/link'
import img from '@/public/images/khan-civ.png'
import Image from 'next/image'
import { MouseEvent, useState } from 'react'
import { Theme } from '../GlobalState'
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs'
import { FaSun } from 'react-icons/fa'
import { post } from '@/lib/api'

type Option = 'course' | 'friends' | 'profile'

export default function Navbar({ isCourse = false, theme: initTheme }: { isCourse?: boolean, theme: Theme }) {

    const [theme, _setTheme] = useState(initTheme)

    let current = isCourse ? 'course' : ''
    if (!current) current = useSelectedLayoutSegments()[0]

    const stopIfActive = (e: MouseEvent<HTMLButtonElement>, active: Option) => {
        if (current === active) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    const setTheme = (theme: Theme) => {
        post('/api/user', { theme })
        _setTheme(theme)
    }

    const toggleTheme = () => {
        if (theme === 'light') {
            document.body.classList.add('dark')
            setTheme('dark')
        } else {
            document.body.classList.remove('dark')
            setTheme('light')
        }
    }

    return (
        <div className={styles.navbarContainer}>
            <div className={styles.navbarTop}>
                <div className={styles.navbarImageContainer}>
                    <Image src={img} fill alt="logo" />
                </div>
                <Link href='/learn/course'><button className={current === 'course' ? 'purple' : 'blue'} onClick={e => stopIfActive(e, 'course')}>COURSE</button></Link>
                <Link href='/learn/profile/friends'><button className={current === 'friends' ? 'purple' : 'blue'} onClick={e => stopIfActive(e, 'friends')}>FRIENDS</button></Link>
                <Link href='/learn/profile'><button className={current === 'profile' ? 'purple' : 'blue'} onClick={e => stopIfActive(e, 'profile')}>PROFILE</button></Link>
                <a href='/admin'><button className='orange'>COURSE CREATOR</button></a>
            </div>
            <div className={styles.navbarBottom}>
                <button style={{ height: 50, width: 50, borderRadius: 50, fontSize: '1.6rem' }} onClick={() => toggleTheme()}>
                    {theme === 'light' ? <BsMoonStarsFill /> : <FaSun />}
                </button>
            </div>
        </div>
    )
}