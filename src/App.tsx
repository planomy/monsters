import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import './SkyDrop.css'

type Screen = 'home' | 'builder' | 'players' | 'question' | 'drop' | 'results'
type Question = { prompt: string; options: string[]; answer: string }
type QuestionSet = { title: string; subject: string; yearLevel: string; questions: Question[] }
type Reward = { icon: string; name: string }
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }

const SAMPLE_SET: QuestionSet = {
  title: 'Fraction Foundations', subject: 'Mathematics', yearLevel: 'Year 5',
  questions: [
    { prompt: 'Which fraction is equal to one half?', options: ['2/3', '3/6', '4/5', '5/6'], answer: '3/6' },
    { prompt: 'What is 1/4 of 20?', options: ['4', '5', '6', '8'], answer: '5' },
    { prompt: 'Which is the largest fraction?', options: ['1/8', '1/3', '1/5', '1/10'], answer: '1/3' },
    { prompt: 'What fraction of 12 is 3?', options: ['1/2', '1/3', '1/4', '3/4'], answer: '1/4' },
  ],
}

const STARTER_JSON = JSON.stringify(SAMPLE_SET, null, 2)
const monsters = Array.from({ length: 18 }, (_, index) => `${import.meta.env.BASE_URL}monsters/${String(index + 1).padStart(2, '0')}.png`)

function playGameSound(enabled: boolean, kind: 'correct' | 'wrong' | 'drop' | 'land' | 'bullseye') {
  if (!enabled) return
  const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const notes = kind === 'correct' ? [520, 690] : kind === 'wrong' ? [260, 210] : kind === 'drop' ? [340] : kind === 'bullseye' ? [520, 700, 900] : [180, 260]
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = kind === 'drop' ? 'sine' : 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(.0001, context.currentTime + index * .08)
    gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + index * .08 + .015)
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + index * .08 + .18)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(context.currentTime + index * .08)
    oscillator.stop(context.currentTime + index * .08 + .2)
  })
  window.setTimeout(() => context.close().catch(() => undefined), 700)
}

function Brand() {
  return <button className="brand" onClick={() => window.location.reload()} aria-label="Monsterz Play home"><span className="brand__mark"><i /><i /></span><span>MONSTERZ <b>PLAY</b></span></button>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [questionSet, setQuestionSet] = useState<QuestionSet>(SAMPLE_SET)
  const [jsonText, setJsonText] = useState(STARTER_JSON)
  const [importMessage, setImportMessage] = useState('')
  const [selectedMonster, setSelectedMonster] = useState(8)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [gamePoints, setGamePoints] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const [rewards, setRewards] = useState<Reward[]>([])

  const beginGame = () => { setQuestionIndex(0); setCorrectAnswers(0); setGamePoints(0); setRewards([]); setFeedback(null); setScreen('question') }
  const advanceQuestion = () => {
    if (questionIndex + 1 >= questionSet.questions.length) setScreen('results')
    else { setQuestionIndex((index) => index + 1); setScreen('question') }
  }
  const answerQuestion = (option: string) => {
    if (feedback) return
    const correct = option === questionSet.questions[questionIndex].answer
    setFeedback(correct ? 'correct' : 'incorrect')
    playGameSound(soundOn, correct ? 'correct' : 'wrong')
    if (correct) setCorrectAnswers((score) => score + 1)
    window.setTimeout(() => { setFeedback(null); if (correct) setScreen('drop'); else advanceQuestion() }, 850)
  }
  const importSet = () => {
    try {
      const parsed = JSON.parse(jsonText) as QuestionSet
      if (!parsed.title || !Array.isArray(parsed.questions) || !parsed.questions.length) throw new Error()
      const valid = parsed.questions.every((q) => q.prompt && Array.isArray(q.options) && q.options.length >= 2 && q.options.includes(q.answer))
      if (!valid) throw new Error()
      setQuestionSet(parsed); setImportMessage(`Ready — ${parsed.questions.length} questions imported.`)
    } catch { setImportMessage('Check the JSON. Every question needs options and a matching answer.') }
  }

  return <div className="prototype-shell">
    {screen !== 'question' && screen !== 'drop' && <header className="topbar"><Brand /><div className="topbar__right"><span className="status-dot" />Prototype<button className="avatar-button">NP</button></div></header>}
    {screen === 'home' && <Home onBuild={() => setScreen('builder')} onPlay={() => setScreen('players')} />}
    {screen === 'builder' && <SetBuilder set={questionSet} jsonText={jsonText} message={importMessage} onJsonChange={setJsonText} onImport={importSet} onSetChange={setQuestionSet} onDone={() => setScreen('players')} onBack={() => setScreen('home')} />}
    {screen === 'players' && <PlayerPicker selected={selectedMonster} onSelect={setSelectedMonster} onStart={beginGame} onBack={() => setScreen('home')} />}
    {screen === 'question' && <QuestionScreen question={questionSet.questions[questionIndex]} number={questionIndex + 1} total={questionSet.questions.length} monster={selectedMonster} score={gamePoints} rewards={rewards.length} soundOn={soundOn} onSoundToggle={() => setSoundOn((on) => !on)} feedback={feedback} onAnswer={answerQuestion} />}
    {screen === 'drop' && <DropGame monster={selectedMonster} totalPoints={gamePoints} rewards={rewards.length} soundOn={soundOn} onSoundToggle={() => setSoundOn((on) => !on)} onComplete={(points, reward) => { setGamePoints((score) => score + points); setRewards((items) => [...items, reward]); advanceQuestion() }} />}
    {screen === 'results' && <Results monster={selectedMonster} correct={correctAnswers} total={questionSet.questions.length} points={gamePoints} rewards={rewards} onReplay={beginGame} onHome={() => setScreen('home')} />}
  </div>
}

function Home({ onBuild, onPlay }: { onBuild: () => void; onPlay: () => void }) {
  return <main className="dashboard page">
    <section className="welcome"><div><span className="eyebrow">GOOD MORNING, NIC</span><h1>Make learning feel<br /><em>like play.</em></h1><p>Create a question set in minutes, then let the monsters loose.</p><div className="button-row"><button className="primary" onClick={onBuild}><span>＋</span> Create a set</button><button className="secondary" onClick={onPlay}>▶ Try the game</button></div></div>
      <div className="welcome-art" aria-hidden="true"><span className="orb orb--one" /><span className="orb orb--two" /><img className="hero-monster hero-monster--left" src={monsters[2]} /><img className="hero-monster hero-monster--main" src={monsters[8]} /><img className="hero-monster hero-monster--right" src={monsters[14]} /><span className="spark spark--one">✦</span><span className="spark spark--two">✦</span></div>
    </section>
    <section className="content-section"><div className="section-title"><div><span className="eyebrow">YOUR LIBRARY</span><h2>Question sets</h2></div><button className="text-button">View all →</button></div>
      <div className="set-grid">
        <article className="set-card set-card--feature" onClick={onPlay}><div className="subject-icon">½</div><span className="card-label">MATHEMATICS · YEAR 5</span><h3>Fraction Foundations</h3><p>12 questions · Played yesterday</p><div className="card-footer"><span className="tiny-monsters"><img src={monsters[0]} /><img src={monsters[6]} /><img src={monsters[11]} /></span><button>Play now</button></div></article>
        <article className="set-card"><div className="subject-icon subject-icon--green">Aa</div><span className="card-label">ENGLISH · YEAR 6</span><h3>Persuasive Devices</h3><p>20 questions · Played 3 days ago</p><div className="mastery"><span style={{ width: '78%' }} /></div><small>78% class mastery</small></article>
        <article className="set-card"><div className="subject-icon subject-icon--orange">AU</div><span className="card-label">HASS · YEAR 5</span><h3>Australian Democracy</h3><p>15 questions · Not played yet</p><div className="mastery"><span style={{ width: '0%' }} /></div><small>Ready to play</small></article>
        <button className="new-set-card" onClick={onBuild}><span>＋</span><b>New question set</b><small>Build manually or paste AI JSON</small></button>
      </div>
    </section>
  </main>
}

function SetBuilder({ set, jsonText, message, onJsonChange, onImport, onSetChange, onDone, onBack }: { set: QuestionSet; jsonText: string; message: string; onJsonChange: (value: string) => void; onImport: () => void; onSetChange: (value: QuestionSet) => void; onDone: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<'build' | 'import'>('import')
  return <main className="builder page"><button className="back-button" onClick={onBack}>← Back to sets</button><div className="builder-heading"><div><span className="eyebrow">CREATE A SET</span><h1>Ready in a flash.</h1><p>Write questions yourself or paste a set made with AI.</p></div><img src={monsters[5]} /></div>
    <div className="builder-card"><div className="tabs"><button className={tab === 'build' ? 'active' : ''} onClick={() => setTab('build')}>Build manually</button><button className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>Import AI JSON <span>FASTEST</span></button></div>
      {tab === 'import' ? <div className="import-layout"><div className="import-main"><label>Paste your question set</label><textarea value={jsonText} onChange={(event) => onJsonChange(event.target.value)} spellCheck={false} /><div className={`validation ${message.startsWith('Ready') ? 'success' : ''}`}>{message || 'The app checks the format before creating your set.'}</div><div className="button-row"><button className="primary" onClick={onImport}>Check & import</button><button className="secondary" onClick={onDone}>Use current set →</button></div></div>
        <aside className="prompt-card"><span className="wand">✦</span><h3>Make it with AI</h3><p>Copy this prompt into ChatGPT, change the topic, then paste the JSON here.</p><div className="prompt-copy">Create a 12-question {set.yearLevel} Australian Curriculum quiz about fractions. Use multiple choice and return only valid JSON.</div><button onClick={() => navigator.clipboard?.writeText('Create a 12-question Year 5 Australian Curriculum quiz about fractions. Use multiple choice and return only valid JSON.')}>Copy prompt</button></aside></div>
        : <div className="manual-build"><div className="field-row"><label>Set title<input value={set.title} onChange={(e) => onSetChange({ ...set, title: e.target.value })} /></label><label>Subject<input value={set.subject} onChange={(e) => onSetChange({ ...set, subject: e.target.value })} /></label><label>Year level<input value={set.yearLevel} onChange={(e) => onSetChange({ ...set, yearLevel: e.target.value })} /></label></div>{set.questions.slice(0, 3).map((question, index) => <div className="question-row" key={question.prompt}><b>{index + 1}</b><span>{question.prompt}</span><small>{question.options.length} choices</small><button>•••</button></div>)}<button className="add-question">＋ Add question</button><button className="primary align-right" onClick={onDone}>Save & choose game →</button></div>}
    </div>
  </main>
}

function PlayerPicker({ selected, onSelect, onStart, onBack }: { selected: number; onSelect: (index: number) => void; onStart: () => void; onBack: () => void }) {
  return <main className="picker page"><button className="back-button" onClick={onBack}>← Teacher dashboard</button><div className="picker-heading"><span className="eyebrow">SKY DROP</span><h1>Choose your monster</h1><p>Pick a teammate for today’s adventure.</p></div><div className="monster-grid">{monsters.map((src, index) => <button className={selected === index ? 'selected' : ''} key={src} onClick={() => onSelect(index)}><img src={src} /><span>{selected === index ? '✓' : ''}</span></button>)}</div><div className="picker-action"><div><img src={monsters[selected]} /><span><small>YOUR MONSTER</small><b>Ready to fly!</b></span></div><button className="primary" onClick={onStart}>Start game <span>→</span></button></div></main>
}

function GameHeader({ monster, score, rewards, progress, soundOn, onSoundToggle }: { monster: number; score: number; rewards: number; progress: string; soundOn: boolean; onSoundToggle: () => void }) {
  return <header className="game-header"><Brand /><div className="game-progress"><span style={{ width: progress }} /></div><div className="game-score"><span className="reward-count">◆ {rewards}</span><button className="sound-toggle" onClick={onSoundToggle} aria-label={soundOn ? 'Mute sounds' : 'Turn sounds on'}>{soundOn ? '♪' : '×'}</button><span>{score.toLocaleString()}</span> pts <img src={monsters[monster]} /></div></header>
}

function QuestionScreen({ question, number, total, monster, score, rewards, soundOn, onSoundToggle, feedback, onAnswer }: { question: Question; number: number; total: number; monster: number; score: number; rewards: number; soundOn: boolean; onSoundToggle: () => void; feedback: 'correct' | 'incorrect' | null; onAnswer: (option: string) => void }) {
  return <div className="game-page question-page"><GameHeader monster={monster} score={score} rewards={rewards} soundOn={soundOn} onSoundToggle={onSoundToggle} progress={`${((number - 1) / total) * 100}%`} /><main className="question-stage"><div className="question-meta"><span>QUESTION {number} OF {total}</span><span className="timer-pill">◷ 18</span></div><h1>{question.prompt}</h1><div className="answer-grid">{question.options.map((option, index) => <button key={option} className={feedback && option === question.answer ? 'correct' : feedback ? 'muted' : ''} onClick={() => onAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><div className="question-helper"><img src={monsters[monster]} /><span>{feedback === 'correct' ? 'Brilliant! Your supply crate is ready.' : feedback === 'incorrect' ? `Good try — the answer was ${question.answer}.` : 'Choose carefully. A correct answer earns a supply drop!'}</span></div></main></div>
}

function DropGame({ monster, totalPoints, rewards, soundOn, onSoundToggle, onComplete }: { monster: number; totalPoints: number; rewards: number; soundOn: boolean; onSoundToggle: () => void; onComplete: (points: number, reward: Reward) => void }) {
  const [x, setX] = useState(12), [direction, setDirection] = useState(1), [droppedX, setDroppedX] = useState<number | null>(null), [landingX, setLandingX] = useState<number | null>(null), [result, setResult] = useState<{ points: number; label: string; reward: Reward; bullseye: boolean } | null>(null)
  const target = 32 + ((totalPoints * 7 + 37) % 42)
  const wind = totalPoints % 2 === 0 ? 4.5 : -5.5
  useEffect(() => { if (droppedX !== null) return; const timer = window.setInterval(() => setX((current) => { if (current >= 88) { setDirection(-1); return 87.4 } if (current <= 12) { setDirection(1); return 12.6 } return current + direction * .65 }), 18); return () => window.clearInterval(timer) }, [direction, droppedX])
  const drop = () => {
    if (droppedX !== null) return
    const landing = Math.max(5, Math.min(95, x + wind))
    setDroppedX(x); setLandingX(landing); playGameSound(soundOn, 'drop')
    const distance = Math.abs(landing - target), bullseye = distance < 2.8
    const points = bullseye ? 750 : distance < 7 ? 400 : distance < 14 ? 200 : 100
    const label = bullseye ? 'Bullseye!' : distance < 7 ? 'Great landing!' : distance < 14 ? 'Nice one!' : 'Supplies delivered!'
    const reward = bullseye ? { icon: '✦', name: 'Sky crystal' } : distance < 7 ? { icon: '●', name: 'Golden orb' } : { icon: '★', name: 'Supply badge' }
    window.setTimeout(() => { setResult({ points, label, reward, bullseye }); playGameSound(soundOn, bullseye ? 'bullseye' : 'land') }, 920)
  }
  return <div className={`game-page drop-page ${result?.bullseye ? 'drop-page--bullseye' : ''}`}><GameHeader monster={monster} score={totalPoints} rewards={rewards} soundOn={soundOn} onSoundToggle={onSoundToggle} progress="50%" /><main className="sky-stage" onClick={drop}><div className="sun" /><div className="cloud cloud--a" /><div className="cloud cloud--b" /><div className="cloud cloud--c" /><div className="wind-meter"><small>WIND</small><b>{wind > 0 ? '→' : '←'}</b><span>{Math.abs(wind).toFixed(1)}</span></div><div className="flight" style={{ left: `${droppedX ?? x}%` }}><div className="balloon"><span /><span /><span /></div><div className="basket"><img src={monsters[monster]} /></div></div>{droppedX !== null && <div className={`crate ${result ? 'crate--landed' : ''}`} style={{ left: `${droppedX}%`, '--landing-drift': `${wind}vw` } as CSSProperties}><span>★</span></div>}<div className="mountains"><i /><i /><i /><i /></div><div className="island" style={{ left: `${target}%` }}><span className="target"><i /><i /><i /></span><span className="bonus-flag">+750</span><div className="tree">♣</div></div>{result && landingX !== null && <div className="impact" style={{ left: `${landingX}%` }}><i /><i /><i /><i /><i /><span /></div>}{!result && <div className="drop-instruction"><b>{droppedX === null ? 'CLICK ANYWHERE TO DROP' : 'Wind is carrying it…'}</b><span>Aim upwind and land near the golden centre</span></div>}{result && <div className="result-pop"><div className="reward-gem">{result.reward.icon}</div><span>+{result.points}</span><h2>{result.label}</h2><p><b>{result.reward.name}</b> added to your collection.</p><button className="primary" onClick={(event) => { event.stopPropagation(); onComplete(result.points, result.reward) }}>Next question →</button></div>}</main></div>
}

function Results({ monster, correct, total, points, rewards, onReplay, onHome }: { monster: number; correct: number; total: number; points: number; rewards: Reward[]; onReplay: () => void; onHome: () => void }) {
  return <main className="results-page page"><div className="confetti">✦ <span>●</span> ◆ <i>✦</i> ●</div><img className="result-monster" src={monsters[monster]} /><span className="eyebrow">ADVENTURE COMPLETE</span><h1>Fantastic flying!</h1><p>You answered, aimed and helped the islanders.</p><div className="result-stats"><div><small>ACCURACY</small><b>{Math.round((correct / total) * 100)}%</b><span>{correct} of {total} correct</span></div><div><small>SKY DROP SCORE</small><b>{points.toLocaleString()}</b><span>points collected</span></div></div>{rewards.length > 0 && <section className="reward-shelf"><small>YOUR FINDS</small><div>{rewards.map((reward, index) => <span key={`${reward.name}-${index}`} title={reward.name}>{reward.icon}<b>{reward.name}</b></span>)}</div></section>}<div className="button-row centre"><button className="primary" onClick={onReplay}>Play again</button><button className="secondary" onClick={onHome}>Teacher dashboard</button></div></main>
}

export default App
