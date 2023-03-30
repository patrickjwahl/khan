'use client'

import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import styles from '../Learn.module.scss';
import variables from '../../v.module.scss';
import { Course, User } from '@prisma/client';
import { MouseEventHandler, useEffect, useState } from 'react';
import cn from 'classnames';

export default function SidebarContent({ expData, otherCourses, friendData }: { expData: number[], otherCourses: Course[], friendData: (User & {exp: number})[]}) {

    const [ dropdownOpen, setDropdownOpen ] = useState(false);

    const chartData = expData.map((exp, index) => {
        const d = new Date();
        d.setDate(d.getDate() - index);
        return {day: d.toLocaleDateString('en-US', {weekday: 'long'}).substring(0, 2), exp: exp}
    });

    chartData.reverse();

    const hideDropdown = (e: MouseEvent) => {
        if (e.target instanceof Node) {
            const parent = document.getElementById('courses-dropdown');
            if (parent?.contains(e.target))  return;
        }
        
        setDropdownOpen(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', hideDropdown);
        return () => document.removeEventListener('mousedown', hideDropdown);
    }, []);

    return (
        <div className={styles.sidebarContainer}>
            <div className={styles.coursesContainer}>
                <button onClick={() => setDropdownOpen(true)} className='orange'>SWITCH COURSE</button>
                <div className={cn(styles.coursesDropdown, {[styles.visible]: dropdownOpen})}>
                    <div id="courses-dropdown">
                        {otherCourses.map(course => {
                            return <button>{course.language.toUpperCase()}</button>;
                        })}
                        <button className='blue'>ADD A COURSE</button>
                    </div>
                </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <h5>Today's XP</h5>
                <div className={styles.xpBox}>{chartData[6].exp}</div>
            </div>
            <div className={styles.chartContainer}>
                <h5>This Week's Progress</h5>
                <ResponsiveContainer width='100%' height={275}>
                    <AreaChart 
                        width={350}
                        height={350}
                        data={chartData}
                        margin={{top: 20, right: 20}}
                        >
                        <defs>
                            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={variables.gold} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={variables.gold} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis tickLine={false} dataKey="day" tick={{fontSize: 14, fill: variables.superlightforeground}} />
                        <YAxis tickLine={false} axisLine={false} tick={{fontSize: 14, fill: variables.superlightforeground}} />
                        <Line type="monotone" dataKey="exp" stroke={variables.gold} />
                        <CartesianGrid vertical={false} strokeWidth={2} stroke={variables.superlightforeground} />
                        <Area strokeWidth={5} type="linear" dataKey="exp" dot={{fill: variables.gold}} stroke={variables.gold} fillOpacity={1} fill="url(#colorGold)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className={styles.friendDataContainer}>
                <h5>Your Friends Today</h5>
                {friendData.map(friend => {
                    return <div>
                        <b>{friend.username}</b>
                        <span>{friend.exp} XP</span>
                    </div>
                })}
            </div>
        </div>
    );
}