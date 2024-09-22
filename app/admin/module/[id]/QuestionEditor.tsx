'use client'
import { ClipLoader } from 'react-spinners';
import styles from '../../Admin.module.scss';
import InfoEditor from '../../lesson/[id]/InfoEditor';
import WordHintEditor from '../../lesson/[id]/WordHintEditor';
import AudioForm from './AudioForm';
import { QuestionWithFeedback } from './ScreenDisplay';
import { MouseEventHandler, useContext, useRef, useState } from 'react';
import { FeedbackRule, Module, QuestionType } from '@prisma/client';
import { WordHint } from '../../lesson/[id]/LessonDashboard';
import { convertBlobToURL } from '@/lib/audio';
import { post } from '@/lib/api';
import variables from '../../../_variables.module.scss';
import { getMainVariant } from '@/lib/string_processing';
import { ToastContext } from '../../Toast';

export default function QuestionEditor({ module, question, language, fetchData }: { 
                                                        module: Module, 
                                                        question: QuestionWithFeedback | null, 
                                                        language: string,
                                                        fetchData: () => void }) {

    const [ prevQuestion, setPrevQuestion ] = useState<QuestionWithFeedback | null>(question);

    const [ type, setType ] = useState<QuestionType>('QUESTION');
    const [ questionId, setQuestionId ] = useState<number | null>(null);
    const [ target, setTarget ] = useState('');
    const [ native, setNative ] = useState('');
    const [ wordHintsForward, setWordHintsForward ] = useState<WordHint[]>([]);
    const [ wordHintsBackward, setWordHintsBackward ] = useState<WordHint[]>([]);
    const [ notes, setNotes ] = useState('');
    const [ feedbackRules, setFeedbackRules ] = useState<FeedbackRule[]>([]);
    const [ index, setIndex ] = useState(-1);
    const [ lessonId, setLessonId ] = useState<number | null>(null);
    const [ firstPass, setFirstPass ] = useState(true);
    const [ info, setInfo ] = useState('');
    const [ infoTitle, setInfoTitle ] = useState('');
    const [ audioBlob, setAudioBlob ] = useState<null | Blob>(null);
    const [ forwardEnabled, setForwardEnabled ] = useState(true);
    const [ backwardEnabled, setBackwardEnabled] = useState(true);
    const [ recordingEnabled, setRecordingEnabled ] = useState(true);

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const topRef = useRef<HTMLTextAreaElement | null>(null);

    const addToast = useContext(ToastContext);

    const newQuestion = () => {
        setTarget('');
        setNative('');
        setFeedbackRules([]);
        setQuestionId(null);
        setIndex(-1);
        setNotes('');
        setInfo('');
        setWordHintsForward([]);
        setWordHintsBackward([]);
        setLessonId(null);
        setFirstPass(true);
        setInfoTitle('');
        setAudioBlob(null);
        setForwardEnabled(true);
        setBackwardEnabled(true);
        setRecordingEnabled(true);
        topRef.current && topRef.current.focus();
    }

    if (prevQuestion?.id != question?.id) {
        // question prop changed, so let's update our state

        setPrevQuestion(question)

        if (!question) { 

            newQuestion();
        } else {

            if (question.recording) {
                fetch(question.recording).then(res => res.blob()).then(blob => {
                    setAudioBlob(blob);
                });
            } else {
                setAudioBlob(null);
            }
            setType(question.type);
            setQuestionId(question.id);
            setTarget(question.target || '');
            setNative(question.native || '');
            setFeedbackRules(question.feedbackRules);
            setNotes(question.notes || '');
            setLessonId(question.lessonId);
            setWordHintsForward(question.wordHintsForward);
            setWordHintsBackward(question.wordHintsBackward);
            setIndex(question.index);
            setFirstPass(question.firstPass);
            setInfo(question.info || '');
            setInfoTitle(question.infoTitle || '');
            setForwardEnabled(question.forwardEnabled);
            setBackwardEnabled(question.backwardEnabled);
            setRecordingEnabled(question.recordingEnabled);
        }
    }

    const submitData = async () => {
        if (!native && !infoTitle) return;

        setIsSubmitting(true);

        let payload = {};

        const audioURL = await convertBlobToURL(audioBlob);

        const maxIndex = -1;

        if (type === 'QUESTION') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'QUESTION',
                target: target,
                native: native,
                info: null,
                infoTitle: null,
                moduleId: module.id,
                lessonId: lessonId,
                recording: audioURL,
                notes: notes,
                difficulty: null,
                firstPass: firstPass,
                index: index < 0 ? maxIndex : index,
                feedbackRules: feedbackRules,
                wordHintsBackward: wordHintsBackward,
                wordHintsForward: wordHintsForward,
                forwardEnabled,
                backwardEnabled,
                recordingEnabled
            }

            payload = newQuestion
        } else if (type === 'INFO') {
            const newQuestion: QuestionWithFeedback = {
                id: questionId || -1,
                type: 'INFO',
                target: null,
                native: null,
                info: info,
                infoTitle: infoTitle,
                moduleId: module.id,
                lessonId: lessonId,
                recording: null,
                notes: notes,
                difficulty: null,
                firstPass: true,
                index: index < 0 ? maxIndex : index,
                feedbackRules: [],
                wordHintsForward: [],
                wordHintsBackward: [],
                forwardEnabled: false,
                backwardEnabled: false,
                recordingEnabled: false
            }
            payload = newQuestion;
        }

        const res = await post('/api/question', payload)

        const data = await res.json();

        addToast(questionId ? 'Screen updated' : 'Screen added');
        fetchData();
        setIsSubmitting(false);
    }

    const submitClicked: MouseEventHandler = async e => {
        e.preventDefault();
        submitData();
    };

    const universalizeWordHint = (index: number, isForward: boolean) => {
        return async () => {
            const hint = (isForward) ? wordHintsForward[index] : wordHintsBackward[index]
            await post(`/api/module/${module.id}/wordHint/universalize`, hint)
            addToast("Applied changes")
            fetchData()
        }
    }

    const handleWordHintForwardChange = (index: number) => {
        return (wordId: number | null) => {
            const newHints = [...wordHintsForward];
            newHints[index].wordEntityId = wordId;
            setWordHintsForward(newHints);
            submitData();
        }
    };

    const handleWordHintBackwardChange = (index: number) => {
        return (wordId: number | null) => {
            const newHints = [...wordHintsBackward];
            newHints[index].wordEntityId = wordId;
            setWordHintsBackward(newHints);
            submitData();
        }
    };

    const handleFeedbackTriggerChange = (value: string, index: number) => {
        const newRules = [...feedbackRules];
        newRules[index].trigger = value;
        setFeedbackRules(newRules);
    };

    const handleFeedbackChange = (value: string, index: number) => {
        const newRules = [...feedbackRules];
        newRules[index].feedback = value;
        setFeedbackRules(newRules);
    };

    const addFeedbackRule: MouseEventHandler = e => {
        e.preventDefault();
        const newRules: FeedbackRule[] = [...feedbackRules, {trigger: '', feedback: '', id: -1} as FeedbackRule]
        setFeedbackRules(newRules);
    };

    const notesForm = (
        <>
            <div className={styles.formSectionHeader}>NOTES & MISCELLANEA</div>
            <textarea placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} />
        </>
    ); 

    const feedbackRulesForm = (
        <>
            <div className={styles.formSectionHeader}>FEEDBACK RULES</div>
            <div className={styles.feedbackRulesContainer}>
                {feedbackRules.length > 0 ? feedbackRules.map((rule, index) => (
                    <div key={index}>
                        <input type="text" placeholder="Trigger" value={rule.trigger} onChange={e => handleFeedbackTriggerChange(e.target.value, index)} />
                        <input type="text" placeholder="Feedback" value={rule.feedback} onChange={e => handleFeedbackChange(e.target.value, index)} />
                    </div>
                )) : <div style={{fontStyle: 'italic', fontSize: '0.8rem'}}>No feedback rules yet</div>}
            </div>
            <button onClick={addFeedbackRule}>Add Feedback Rule</button>
        </>
    );

    const questionForm = (
        <>
            <div className={styles.formSectionHeader}>QUESTION INFO</div>
            <div style={{fontSize: '0.7rem'}}>Place each variation on a new line, primary variation on the first line</div>
            <textarea ref={topRef} wrap="off" placeholder={`${language} variations`} value={target} onChange={e => setTarget(e.target.value)} />
            <textarea wrap="off" placeholder="Native variations" value={native} onChange={e => setNative(e.target.value)} />
            <div className={styles.formSectionHeader}>RECORD AUDIO</div>
            <AudioForm audioBlob={audioBlob} setAudioBlob={setAudioBlob} />
            <div className={styles.formSectionHeader}>OPTIONS</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem', rowGap: '0.2rem', justifyContent:'center'}}>
                <label>
                    Forward translation
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={forwardEnabled} onChange={e => setForwardEnabled(e.target.checked)} />
                </label>
                <label>
                    Backward translation
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={backwardEnabled} onChange={e => setBackwardEnabled(e.target.checked)} />
                </label>
                <label>
                    Audio translation
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={recordingEnabled} onChange={e => setRecordingEnabled(e.target.checked)} />
                </label>
                <label>
                    Second pass only?
                    <input style={{marginLeft: '0.4rem'}} type="checkbox" checked={!firstPass} onChange={e => setFirstPass(!e.target.checked)} />
                </label>
            </div>

            <div className={styles.formSectionHeader}>WORD HINTS (BACKWARD)</div>
            {wordHintsBackward.map((hint, index) => {
                return <WordHintEditor key={index} isForward={false} hint={hint} prevHint={(index > 0 && wordHintsBackward[index - 1]) || null} setId={handleWordHintBackwardChange(index)} universalize={universalizeWordHint(index, false)} courseId={module.courseId} />
            })}

            <div className={styles.formSectionHeader}>WORD HINTS (FORWARD)</div>
            {wordHintsForward.map((hint, index) => {
                return <WordHintEditor key={index} isForward hint={hint} prevHint={(index > 0 && wordHintsForward[index - 1]) || null} setId={handleWordHintForwardChange(index)} universalize={universalizeWordHint(index, true)} courseId={module.courseId} />
            })}

            {feedbackRulesForm}
            {notesForm}
        </>
    );

    const infoForm = (
        <>
            <div className={styles.formSectionHeader}>LESSON INFORMATION</div>
            <input type="text" placeholder="Title" value={infoTitle} onChange={e => setInfoTitle(e.target.value)} />
            <div style={{fontSize: '12px', textAlign: 'center'}}>Enter vocab words between {"{brackets}"} so they'll play a pronunciation when users hover over them!</div>
            <InfoEditor data={info} setData={setInfo} />
            {notesForm}
        </>
    );

    let formContent = type === 'INFO' ? infoForm : questionForm;

    return (
        <div className={styles.editor}>
            <div>
                <form onSubmit={e => {e.preventDefault(); return false}}>
                    <div className={styles.formTopRow}>
                        <h5>SCREEN EDITOR</h5>
                        <div>
                            {questionId ? <button onClick={newQuestion}>CREATE NEW</button> : (null)}
                            {!isSubmitting ? <input type="submit" onClick={submitClicked} value={!questionId ? "CREATE" : "UPDATE"} /> : 
                            <ClipLoader color={variables.themeRed} loading={true} />}
                        </div>
                    </div>
                    {questionId && <div style={{fontStyle: 'italic', fontSize: '0.9rem'}}>Editing "{infoTitle || getMainVariant(target)}"</div>}
                    <div className={styles.formSectionHeader}>SCREEN TYPE</div>
                    <div className={styles.radioContainer}>
                        <div className={styles.radio}>
                            <input type='radio' id="question-button" name="question" value="QUESTION" checked={type === 'QUESTION'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                            <label htmlFor='question-button'>Question</label>
                        </div>
                        <div className={styles.radio}>
                            <input type='radio' id="info-button" name="info" value="INFO" checked={type === 'INFO'} onChange={e => setType(e.currentTarget.value as QuestionType)} />
                            <label htmlFor='info-button'>Info</label>
                        </div>
                    </div>
                    { formContent }
                </form>
            </div>
        </div>
    )
}