import { MouseEventHandler, useState } from 'react';
import styles from '../../Admin.module.scss';
import { WordHint } from './LessonDashboard';
import { FaArrowRight } from 'react-icons/fa';


export default function WordHintEditor({hint, setId, courseId}: {hint: WordHint, setId: (id: number) => void, courseId: number}) {

    const [ root, setRoot ] = useState('');
    const [ error, setError ] = useState(false);
    const [ targetOverride, setTargetOverride ] = useState<string | null>(null);

    const findWord: MouseEventHandler = async e => {
        e.preventDefault();

        const res = await fetch(`/api/word/search/${root}/${courseId}`);
        const data = await res.json();

        if (data.code !== 'OK') {

            setError(true);
            return;
        }

        setId(data.word.id);
        setTargetOverride(`${data.word.target} (${data.word.native})`);
    };

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