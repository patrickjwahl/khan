import Link from 'next/link';
import styles from './Admin.module.scss';
import React from 'react';

export type Breadcrumb = {
    name: string,
    link: string
}

export default function Breadcrumbs({ trail }: {trail: Breadcrumb[]}) {
    return (
        <div className={styles.breadcrumbsContainer}>
            {trail.map((crumb, index) => {
                return (<React.Fragment key={index}>
                    {index === 0 ? (null) : <div>{'>'}</div>}
                    <a href={crumb.link}>{crumb.name}</a>
                </React.Fragment>);
            })}
        </div>
    )
}