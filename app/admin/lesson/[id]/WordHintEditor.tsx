import { KeyboardEventHandler, MouseEventHandler, ReactNode, useEffect, useState } from 'react';
import styles from './WordHint.module.scss';
import { WordHint } from './LessonDashboard';
import { FaArrowRight, FaGlobeAmericas } from 'react-icons/fa';
import { AiFillCaretUp, AiOutlineSearch } from 'react-icons/ai';
import { post } from '@/lib/api';


export default function WordHintEditor({isForward, hint, prevHint, setId, universalize, courseId}: {isForward: boolean, hint: WordHint, prevHint: WordHint | null, setId: (id: number | null) => void, universalize: () => void, courseId: number}) {

    const [ root, setRoot ] = useState('');
    const [ error, setError ] = useState(false);
    const [ targetOverride, setTargetOverride ] = useState<string | null | ReactNode>(null);

    const findWord = async () => {

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

    const handleButtonClick: MouseEventHandler = async e => {
        e.preventDefault();
        findWord();
    }

    const handleMatchPrevious: MouseEventHandler = async e => {
        e.preventDefault();
        
        if (prevHint) {
            console.log(prevHint.wordEntityId);
            const res = await fetch(`/api/word/${prevHint.wordEntityId}`);
            const data = await res.json();

            if (data.code === 'OK') {
                setTargetOverride(`${data.word.target} (${data.word.native})`);
            }
            setId(prevHint.wordEntityId);
        }
    }

    const handleUniversalize: MouseEventHandler = async e => {
        e.preventDefault();

        universalize();
    }

    const handleKeyUp: KeyboardEventHandler = e => {
        e.preventDefault();
        if (e.key === 'Enter') {
            findWord();
        }
    }

    const handleKeyDown: KeyboardEventHandler = e => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    }

    useEffect(() => {
        setTargetOverride(null);
        setError(false);
        setRoot('');
    }, [hint])

    return (
        <>
        <div className={styles.container}>
            <div style={{alignItems: 'center'}}>
                <div><b>{hint.wordString}</b></div>
                <FaArrowRight />
                <div>{targetOverride || hint.wordEntity && `${hint.wordEntity.target} (${hint.wordEntity.native})` || <i>None</i>}</div>
            </div>
            <div className={styles.buttonsAndSearch}>
                <button title={`Use this hint for all appearances of "${hint.wordString}" in module`} onClick={handleUniversalize}><FaGlobeAmericas /></button>
                <input type="text" placeholder='Root word' value={root} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onChange={e => {if (error) setError(false); setRoot(e.target.value)}}/>
                <div className={styles.buttonContainer}>
                    { prevHint && <button title='Match previous' onClick={handleMatchPrevious}><AiFillCaretUp /></button> }
                    <button title='Search' onClick={handleButtonClick}><AiOutlineSearch /></button>
                </div>
            </div>
        </div>
        {error && <div>That word's not in this course.</div>}
        </>
    );
}