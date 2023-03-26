'use client'

import variables from '../_variables.module.scss';

export default function Error({error}: {error: Error}) {
    return <div style={{width: '100%', paddingTop: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{error.message}</div>
}