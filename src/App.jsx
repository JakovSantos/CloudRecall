import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, ChevronDown, CircleHelp,
  ClipboardCheck, Cloud, Command, Flame, Layers3, RotateCcw, Shuffle, Sparkles,
  Target, Trophy, X, Zap
} from "lucide-react";
import questions from "./questions.json";
import "./styles.css";

const STORAGE_KEY = "cloudrecall-clf-c02-v1";
const sources = ["All questions", "Official Practice Exam", "Official Pretest"];
const readSaved = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      known: value.known || [],
      missed: value.missed || [],
      answered: value.answered || {},
      bestStreak: value.bestStreak || 0,
      totalCorrect: value.totalCorrect || 0,
      totalAttempts: value.totalAttempts || 0,
    };
  } catch {
    return { known: [], missed: [], answered: {}, bestStreak: 0, totalCorrect: 0, totalAttempts: 0 };
  }
};
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const keyOf = (q) => `${q.source}::${q.number}`;
const letters = (q) => q.options.filter(o => o.correct).map(o => o.letter);
const isMulti = (q) => q.type === "multi-select";
const sameAnswers = (a, b) => a.length === b.length && a.every(x => b.includes(x));

function App() {
  const [saved, setSaved] = useState(readSaved);
  const [mode, setMode] = useState("flashcards");
  const [source, setSource] = useState("All questions");
  const [sessionKind, setSessionKind] = useState("all");
  const [deck, setDeck] = useState(() => shuffle(questions));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [session, setSession] = useState({ correct: 0, attempts: 0, streak: 0 });
  const [showAllExplanations, setShowAllExplanations] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }, [saved]);

  const q = deck[index] || null;
  const correctLetters = q ? letters(q) : [];
  const isCorrect = q && sameAnswers(selected, correctLetters);
  const completedCount = Object.keys(saved.answered).length;
  const overallAccuracy = saved.totalAttempts ? Math.round(saved.totalCorrect / saved.totalAttempts * 100) : 0;
  const progress = deck.length ? ((index + 1) / deck.length) * 100 : 0;

  const resetSession = useCallback((nextSource = source, nextKind = "all", shouldShuffle = true) => {
    let list = questions.filter(item => nextSource === "All questions" || item.source === nextSource);
    if (nextKind === "missed") list = list.filter(item => saved.missed.includes(keyOf(item)));
    if (nextKind === "unseen") list = list.filter(item => !saved.answered[keyOf(item)]);
    setDeck(shouldShuffle ? shuffle(list) : list);
    setIndex(0);
    setFlipped(false);
    setSelected([]);
    setSubmitted(false);
    setSession({ correct: 0, attempts: 0, streak: 0 });
    setSessionKind(nextKind);
  }, [source, saved.missed, saved.answered]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
      if (event.code === "Space" && mode === "flashcards") { event.preventDefault(); setFlipped(v => !v); }
      if (event.key === "Enter" && mode === "quiz" && !submitted) submitAnswer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function goNext() {
    if (!deck.length) return;
    setIndex(i => Math.min(i + 1, deck.length - 1));
    setFlipped(false); setSelected([]); setSubmitted(false);
  }
  function goPrev() {
    if (!deck.length) return;
    setIndex(i => Math.max(i - 1, 0));
    setFlipped(false); setSelected([]); setSubmitted(false);
  }
  function choose(option) {
    if (submitted || !q) return;
    if (isMulti(q)) setSelected(old => old.includes(option) ? old.filter(x => x !== option) : [...old, option]);
    else setSelected([option]);
  }
  function submitAnswer() {
    if (!q || submitted || selected.length === 0) return;
    const correct = sameAnswers(selected, correctLetters);
    const id = keyOf(q);
    setSubmitted(true);
    setSession(s => ({
      attempts: s.attempts + 1,
      correct: s.correct + (correct ? 1 : 0),
      streak: correct ? s.streak + 1 : 0
    }));
    setSaved(prev => {
      const answered = { ...prev.answered, [id]: (prev.answered[id] || 0) + 1 };
      const missed = correct ? prev.missed.filter(x => x !== id) : [...new Set([...prev.missed, id])];
      return {
        ...prev, answered, missed,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        bestStreak: Math.max(prev.bestStreak, correct ? session.streak + 1 : 0)
      };
    });
  }
  function markCard(known) {
    if (!q) return;
    const id = keyOf(q);
    setSaved(prev => ({
      ...prev,
      known: known ? [...new Set([...prev.known, id])] : prev.known.filter(x => x !== id),
      missed: known ? prev.missed.filter(x => x !== id) : [...new Set([...prev.missed, id])],
      answered: { ...prev.answered, [id]: (prev.answered[id] || 0) + 1 }
    }));
    goNext();
  }
  function setSourceAndReset(value) {
    setSource(value);
    const list = questions.filter(item => value === "All questions" || item.source === value);
    setDeck(shuffle(list)); setIndex(0); setFlipped(false); setSelected([]); setSubmitted(false);
    setSession({ correct: 0, attempts: 0, streak: 0 }); setSessionKind("all");
  }
  function switchMode(value) {
    setMode(value); setFlipped(false); setSelected([]); setSubmitted(false);
  }
  function startReview(kind) { resetSession(source, kind, true); }
  function shuffleAll() { resetSession(source, sessionKind, true); }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); resetSession("All questions", "all", true); setSource("All questions"); }}>
          <span className="brand-mark"><Cloud size={21}/></span>
          <span><strong>CloudRecall</strong><small>AWS CERTIFIED CLOUD PRACTITIONER</small></span>
        </a>
        <div className="topbar-right">
          <div className="top-stat"><Flame size={15}/><span>{saved.bestStreak} best streak</span></div>
          <button className="icon-btn" onClick={() => setShowSettings(v => !v)} aria-label="Study settings"><Command size={18}/></button>
        </div>
      </header>

      <main className="main-wrap">
        <section className="hero">
          <div className="eyebrow"><span className="live-dot"/> YOUR PERSONAL CERTIFICATION STUDY SPACE</div>
          <h1>Make knowledge <span>stick.</span></h1>
          <p>Practice smarter, recall faster, and build confidence for your AWS Cloud Practitioner exam.</p>
          <div className="hero-tags"><span><Layers3 size={14}/> 130 source questions</span><span><Zap size={14}/> Instant explanations</span><span><Target size={14}/> No lives. No pressure.</span></div>
        </section>

        <section className="stats-grid" aria-label="Study statistics">
          <Stat icon={<BookOpen/>} label="Questions in bank" value="130" note="65 practice · 65 pretest"/>
          <Stat icon={<CheckCheck/>} label="Questions attempted" value={completedCount} note="Saved on this device"/>
          <Stat icon={<Trophy/>} label="Overall accuracy" value={`${overallAccuracy}%`} note={`${saved.totalCorrect} correct answers`}/>
          <Stat icon={<Flame/>} label="Need another look" value={saved.missed.length} note="Questions to review"/>
        </section>

        <section className="study-panel">
          <div className="panel-heading">
            <div><div className="section-kicker">CHOOSE YOUR STUDY MODE</div><h2>How do you want to learn?</h2></div>
            <div className="bank-select">
              <label htmlFor="source-select">QUESTION BANK</label>
              <div className="select-wrap"><select id="source-select" value={source} onChange={e => setSourceAndReset(e.target.value)}>{sources.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={15}/></div>
            </div>
          </div>

          <div className="mode-cards">
            <button className={`mode-card ${mode === "flashcards" ? "active" : ""}`} onClick={() => switchMode("flashcards")}>
              <span className="mode-icon purple"><Layers3 size={22}/></span>
              <span className="mode-copy"><strong>Flashcards</strong><small>See the question, think of the answer, then flip to reveal the correct choice and explanation.</small><em>ACTIVE RECALL · SELF-PACED</em></span>
              <span className="mode-radio">{mode === "flashcards" && <Check size={14}/>}</span>
            </button>
            <button className={`mode-card ${mode === "quiz" ? "active" : ""}`} onClick={() => switchMode("quiz")}>
              <span className="mode-icon blue"><ClipboardCheck size={22}/></span>
              <span className="mode-copy"><strong>Quiz</strong><small>Choose your answer and submit to get instant feedback with the correct answer and explanations.</small><em>RETRIEVAL PRACTICE · INSTANT FEEDBACK</em></span>
              <span className="mode-radio">{mode === "quiz" && <Check size={14}/>}</span>
            </button>
          </div>

          <div className="session-toolbar">
            <div className="session-filters">
              <button className={sessionKind === "all" ? "filter active" : "filter"} onClick={() => resetSession(source, "all", true)}>All questions</button>
              <button className={sessionKind === "unseen" ? "filter active" : "filter"} onClick={() => startReview("unseen")}>Not attempted</button>
              <button className={sessionKind === "missed" ? "filter active" : "filter"} onClick={() => startReview("missed")}>Review missed <span>{saved.missed.length}</span></button>
            </div>
            <button className="shuffle-btn" onClick={shuffleAll}><Shuffle size={15}/> Shuffle</button>
          </div>

          {!q ? (
            <div className="empty-state"><CircleHelp size={30}/><h3>No questions in this set</h3><p>Choose another question bank or return to all questions.</p><button className="primary-btn" onClick={() => resetSession(source,"all",true)}>Show all questions</button></div>
          ) : (
            <>
              <div className="deck-meta">
                <div className="deck-count"><span>QUESTION</span><strong>{index + 1}<i> / {deck.length}</i></strong></div>
                <div className="deck-tags"><span className="source-tag">{q.source === "Official Pretest" ? "PRETEST" : "PRACTICE EXAM"}</span><span className={`type-tag ${isMulti(q) ? "multi" : ""}`}>{isMulti(q) ? "SELECT 2" : "SINGLE ANSWER"}</span></div>
                <div className="progress-label">{Math.round(progress)}% through set</div>
              </div>
              <div className="progress-track"><div style={{width:`${progress}%`}}/></div>

              {mode === "flashcards" ? (
                <div className="flashcard-area">
                  <button className={`flashcard ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(v => !v)} aria-label={flipped ? "Show question" : "Flip card to reveal answer"}>
                    {!flipped ? (
                      <div className="card-face card-front">
                        <div className="card-topline"><span><BookOpen size={15}/> QUESTION {String(q.number).padStart(2,"0")}</span><span className="flip-hint">TAP TO FLIP <RotateCcw size={13}/></span></div>
                        <h3>{q.question}</h3>
                        <div className="choice-list">{q.options.map(o => <div className="choice-row" key={o.letter}><b>{o.letter}</b><span>{o.text}</span></div>)}</div>
                        <div className="card-bottom"><span>{isMulti(q) ? "Choose all correct answers mentally" : "Choose the best answer mentally"}</span><span className="tap-cue">Reveal answer <ArrowRight size={14}/></span></div>
                      </div>
                    ) : (
                      <div className="card-face card-back">
                        <div className="card-topline"><span><Sparkles size={15}/> ANSWER REVEALED</span><span className="flip-hint">TAP TO FLIP BACK <RotateCcw size={13}/></span></div>
                        <div className="answer-label">CORRECT ANSWER{correctLetters.length > 1 ? "S" : ""}</div>
                        <div className="answer-list">{q.options.filter(o => o.correct).map(o => <div className="answer-item" key={o.letter}><span className="answer-check"><Check size={15}/></span><div><b>{o.letter}. {o.text}</b><p>{o.explanation || "The handout marks this option as correct."}</p></div></div>)}</div>
                        <div className="explanation-toggle" onClick={e => { e.stopPropagation(); setShowAllExplanations(v => !v); }}>{showAllExplanations ? "Hide" : "Show"} explanations for other choices <ChevronDown size={14}/></div>
                        {showAllExplanations && <div className="other-explanations">{q.options.filter(o => !o.correct).map(o => <div key={o.letter}><b>{o.letter}. {o.text}</b><p>{o.explanation}</p></div>)}</div>}
                      </div>
                    )}
                  </button>
                  <div className="flashcard-actions">
                    <button className="secondary-btn" onClick={() => setFlipped(v => !v)}><RotateCcw size={15}/>{flipped ? "See question" : "Flip card"}</button>
                    <div className="recall-actions"><button className="review-btn" onClick={() => markCard(false)}><RotateCcw size={15}/> Review again</button><button className="know-btn" onClick={() => markCard(true)}><Check size={15}/> Got it</button></div>
                  </div>
                  <p className="keyboard-note">Tip: Press <kbd>Space</kbd> to flip · <kbd>←</kbd> <kbd>→</kbd> to navigate</p>
                </div>
              ) : (
                <div className="quiz-card">
                  <div className="quiz-question"><div className="quiz-number">QUESTION {String(q.number).padStart(2,"0")} <span>·</span> {isMulti(q) ? "CHOOSE 2 ANSWERS" : "CHOOSE 1 ANSWER"}</div><h3>{q.question}</h3></div>
                  <div className="quiz-options">
                    {q.options.map(o => {
                      const chosen = selected.includes(o.letter);
                      const revealCorrect = submitted && o.correct;
                      const revealWrong = submitted && chosen && !o.correct;
                      return <button key={o.letter} disabled={submitted} className={`quiz-option ${chosen ? "chosen" : ""} ${revealCorrect ? "correct" : ""} ${revealWrong ? "incorrect" : ""}`} onClick={() => choose(o.letter)}>
                        <span className={`option-marker ${isMulti(q) ? "checkbox-marker" : ""}`}>{submitted ? (o.correct ? <Check size={15}/> : chosen ? <X size={15}/> : o.letter) : (isMulti(q) ? (chosen ? <Check size={14}/> : "") : o.letter)}</span>
                        <span className="option-text">{o.text}</span>
                        {revealCorrect && <span className="option-status">CORRECT</span>}
                        {revealWrong && <span className="option-status">YOUR PICK</span>}
                      </button>;
                    })}
                  </div>
                  {!submitted ? (
                    <div className="quiz-submit-row"><span>{selected.length ? `${selected.length} option${selected.length > 1 ? "s" : ""} selected` : "Select your answer to continue"}{isMulti(q) && <small> · Multiple selections allowed</small>}</span><button className="primary-btn" disabled={!selected.length} onClick={submitAnswer}>Submit answer <ArrowRight size={16}/></button></div>
                  ) : (
                    <div className={`feedback-panel ${isCorrect ? "feedback-correct" : "feedback-incorrect"}`}>
                      <div className="feedback-title">{isCorrect ? <CheckCheck size={20}/> : <CircleHelp size={20}/>}<div><strong>{isCorrect ? "That's correct!" : "Not quite. Learn from this one."}</strong><span>{isCorrect ? "Great recall. Keep building that momentum." : "The correct answer is highlighted below. Take a moment to understand why."}</span></div></div>
                      <div className="correct-answer-block"><b>Correct answer{correctLetters.length > 1 ? "s" : ""}: {q.options.filter(o => o.correct).map(o => `${o.letter}. ${o.text}`).join(" · ")}</b></div>
                      <div className="rationale-list"><h4>WHY EACH OPTION IS RIGHT OR WRONG</h4>{q.options.map(o => <div className={`rationale ${o.correct ? "right" : ""}`} key={o.letter}><b>{o.letter}. {o.text} {o.correct && <span>✓ CORRECT</span>}</b><p>{o.explanation || (o.correct ? "Marked as correct in the source handout." : "No explanation was provided in the source handout.")}</p></div>)}</div>
                      <div className="feedback-actions"><button className="secondary-btn" onClick={() => {setSelected([]);setSubmitted(false);}}>Try again</button><button className="primary-btn" onClick={goNext}>Next question <ArrowRight size={16}/></button></div>
                    </div>
                  )}
                </div>
              )}

              <div className="nav-row"><button className="nav-btn" onClick={goPrev} disabled={index === 0}><ArrowLeft size={16}/> Previous</button><div className="session-score"><span>{mode === "quiz" ? `${session.correct}/${session.attempts} correct this session` : `${saved.known.length} marked as known`}</span><span className="score-dot">·</span><span>{deck.length - index - 1} remaining</span></div><button className="nav-btn" onClick={goNext} disabled={index === deck.length - 1}>Next <ArrowRight size={16}/></button></div>
            </>
          )}
        </section>

        <section className="bottom-note"><div className="note-icon"><Sparkles size={18}/></div><div><b>Built for memory, not pressure.</b><p>Retrieval practice helps strengthen recall. Try answering before revealing, revisit missed questions, and space out your review sessions. Mistakes are part of learning.</p></div></section>
        <footer><span>CloudRecall <i>·</i> AWS CLF-C02 study companion</span><span>130 questions sourced from your two PDF handouts</span></footer>
      </main>

      {showSettings && <div className="settings-popover"><div className="settings-head"><b>Study settings</b><button onClick={() => setShowSettings(false)}><X size={16}/></button></div><p>Your progress is saved locally in this browser.</p><button className="reset-progress" onClick={() => {if(window.confirm("Reset all saved study progress? This cannot be undone.")){setSaved({known:[],missed:[],answered:{},bestStreak:0,totalCorrect:0,totalAttempts:0});setShowSettings(false);}}}><RotateCcw size={14}/> Reset saved progress</button></div>}
    </div>
  );
}

function Stat({icon,label,value,note}) {
  return <div className="stat-card"><div className="stat-top">{icon}<span>{label}</span></div><strong>{value}</strong><small>{note}</small></div>;
}

