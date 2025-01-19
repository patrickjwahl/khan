import React from 'react';
import DotLoader from './DotLoader';

export default function Loading() {
    return <div style={{width: '100%', paddingTop: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><DotLoader /></div>
}