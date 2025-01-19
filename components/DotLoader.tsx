import React from "react"
import styles from './DotLoader.module.scss'
import variables from '@/app/v.module.scss'

const defaultColor = variables.orange

export default function DotLoader({ color }: { color?: string }) {
    return (
        <div className={styles.spinner}>
            <div style={{backgroundColor: color || defaultColor}} className={styles.bounce1}></div>
            <div style={{backgroundColor: color || defaultColor}} className={styles.bounce2}></div>
            <div style={{backgroundColor: color || defaultColor}} className={styles.bounce3}></div>
        </div>
    )
}

