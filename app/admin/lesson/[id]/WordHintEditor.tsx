import { MouseEventHandler, ReactNode, useEffect, useState } from 'react';
import styles from '../../Admin.module.scss';
import { WordHint } from './LessonDashboard';
import { FaArrowRight } from 'react-icons/fa';
import { post } from '@/lib/api';


export default function WordHintEditor({isForward, hint, setId, courseId}: {isForward: boolean, hint: WordHint, setId: (id: number | null) => void, courseId: number}) {

    const [ root, setRoot ] = useState('');
    const [ error, setError ] = useState(false);
    const [ targetOverride, setTargetOverride ] = useState<string | null | ReactNode>(null);

    const findWord: MouseEventHandler = async e => {

        e.preventDefault();

        if (!root) {
            setId(null);
            setTargetOverride(<i>None</i>);
            return;
        }

        const payload = {
            word: root
        };

        const res = await post(`/api/word/search/${courseId}`, payload);
        const data = await res.json();

        if (data.code !== 'OK') {

            setError(true);
            return;
        }

        setId(data.word.id);
        setTargetOverride(`${data.word.target} (${data.word.native})`);
    };

    useEffect(() => {
        setTargetOverride(null);
        setError(false);
        setRoot('');
    }, [hint])

    return (
        <>
        <div style={{display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem'}}>
            <div style={{display: 'flex', gap: '0.8rem', alignItems: 'center'}}>
                <div><b>{hint.wordString}</b></div>
                <FaArrowRight />
                <div>{targetOverride || hint.wordEntity && `${hint.wordEntity.target} (${hint.wordEntity.native})` || <i>None</i>}</div>
            </div>
            <div style={{display: 'flex', gap: '0.8rem'}}>
                <input style={{width: '100px'}} type="text" placeholder='Root word' value={root} onChange={e => {if (error) setError(false); setRoot(e.target.value)}}/>
                <button style={{width: '50px'}} onClick={findWord}>Set</button>
            </div>
        </div>
        {error && <div>That word's not in this course.</div>}
        </>
    );
}