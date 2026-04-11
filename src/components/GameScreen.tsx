import { useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { generateQuestion } from '../services/aiService'
import { t } from '../services/i18n'
import {
  Heart,
  HeartCrack,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'

export default function GameScreen() {
  const {
    players,
    settings,
    customQuestions,
    history,
    aiPreferences,
    turnState,
    addToHistory,
    addLike,
    addDislike,
    nextTurn,
    setCurrentPlayer,
    incrementAiCounter,
    markCustomQuestionUsed,
    resetCustomQuestions,
    setScreen,
  } = useGameStore()

  const l = t(settings.language)

  const [questionText, setQuestionText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rouletteActive, setRouletteActive] = useState(false)
  const [rouletteName, setRouletteName] = useState('')
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [isCustom, setIsCustom] = useState(false)

  const currentPlayer = players[turnState.currentPlayerIndex] || players[0]

  const allPlayersInfo = players.map((p) => `${p.name} (${p.gender === 'male' ? 'М' : 'Ж'})`).join(', ')

  const runRoulette = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      setRouletteActive(true)
      let count = 0
      const totalSpins = 15 + Math.floor(Math.random() * 10)
      const interval = setInterval(() => {
        const idx = Math.floor(Math.random() * players.length)
        setRouletteName(players[idx].name)
        count++
        if (count >= totalSpins) {
          clearInterval(interval)
          const finalIdx = Math.floor(Math.random() * players.length)
          setRouletteName(players[finalIdx].name)
          setCurrentPlayer(finalIdx)
          setTimeout(() => {
            setRouletteActive(false)
            resolve(finalIdx)
          }, 500)
        }
      }, 100)
    })
  }, [players, setCurrentPlayer])

  const shouldUseCustom = useCallback((): boolean => {
    const { aiCounter } = turnState
    const available = customQuestions.filter((q) => !q.used)
    return (
      settings.customInterval > 0 &&
      (aiCounter + 1) % settings.customInterval === 0 &&
      available.length > 0
    )
  }, [turnState, customQuestions, settings.customInterval])

  const getCustomQuestion = useCallback(
    (type: 'truth' | 'dare'): string | null => {
      const available = customQuestions
        .map((q, i) => ({ ...q, index: i }))
        .filter((q) => !q.used && q.type === type)
      if (available.length === 0) {
        const any = customQuestions
          .map((q, i) => ({ ...q, index: i }))
          .filter((q) => !q.used)
        if (any.length === 0) return null
        const pick = any[Math.floor(Math.random() * any.length)]
        markCustomQuestionUsed(pick.index)
        if (customQuestions.filter((q) => !q.used).length <= 1) resetCustomQuestions()
        return pick.text
      }
      const pick = available[Math.floor(Math.random() * available.length)]
      markCustomQuestionUsed(pick.index)
      if (customQuestions.filter((q) => !q.used).length <= 1) resetCustomQuestions()
      return pick.text
    },
    [customQuestions, markCustomQuestionUsed, resetCustomQuestions]
  )

  const handleChoice = async (type: 'truth' | 'dare') => {
    setQuestionText(null)
    setError(null)
    setLiked(false)
    setDisliked(false)
    setIsCustom(false)

    if (settings.randomWheel) await runRoulette()

    incrementAiCounter()

    if (shouldUseCustom()) {
      const custom = getCustomQuestion(type)
      if (custom) {
        setQuestionText(custom)
        setIsCustom(true)
        addToHistory(custom)
        return
      }
    }

    if (!settings.apiKey) {
      setError(l.addApiKey)
      return
    }

    setLoading(true)
    try {
      const state = useGameStore.getState()
      const player = state.players[state.turnState.currentPlayerIndex] || currentPlayer
      const result = await generateQuestion(
        type,
        player.name,
        player.gender,
        allPlayersInfo,
        history,
        aiPreferences,
        settings.apiKey,
        settings.language
      )
      setQuestionText(result)
      addToHistory(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : l.genError)
    } finally {
      setLoading(false)
    }
  }

  const handleReroll = async () => {
    if (!questionText) return
    const type: 'truth' | 'dare' = Math.random() > 0.5 ? 'truth' : 'dare'
    setLiked(false)
    setDisliked(false)
    setIsCustom(false)
    if (!settings.apiKey) { setError(l.addApiKey); return }

    setLoading(true)
    try {
      const player = players[turnState.currentPlayerIndex] || currentPlayer
      const result = await generateQuestion(type, player.name, player.gender, allPlayersInfo, history, aiPreferences, settings.apiKey, settings.language)
      setQuestionText(result)
      addToHistory(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : l.genError)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = () => {
    if (questionText && !liked) { addLike(questionText); setLiked(true); setDisliked(false) }
  }
  const handleDislike = () => {
    if (questionText && !disliked) { addDislike(questionText); setDisliked(true); setLiked(false) }
  }
  const handleNext = () => {
    setQuestionText(null); setError(null); setLiked(false); setDisliked(false); setIsCustom(false)
    nextTurn()
  }

  const displayName = rouletteActive ? rouletteName : currentPlayer?.name || '?'

  return (
    <div
      className="flex flex-col h-dvh w-full relative overflow-hidden"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0 -z-10"
        style={
          questionText
            ? {
                background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 30%, #ffdce9 54%, #ffb3cc 75%, #ff80b0 100%)',
              }
            : {
                backgroundImage: 'url(/sky.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
              }
        }
      />

      {/* ── Header ── */}
      <div className="flex items-center px-3 py-1 shrink-0">
        <button
          onClick={() => setScreen('start')}
          className={`w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-transform ${
            questionText ? 'bg-black/8' : 'bg-black/20 backdrop-blur-sm'
          }`}
        >
          <ChevronLeft className={`w-7 h-7 ${questionText ? 'text-black/40' : 'text-white'}`} />
        </button>
      </div>

      {/* ── Player name banner (question screen only) ── */}
      {questionText && (
        <div className="flex justify-center shrink-0 px-4 mt-2 mb-1">
          <div
            className="relative px-10 py-2.5"
            style={{
              background:
                'linear-gradient(135deg, #7a7a7a 0%, #c0c0c0 25%, #e8e8e8 50%, #c0c0c0 75%, #7a7a7a 100%)',
              clipPath: 'polygon(7% 0%, 93% 0%, 100% 50%, 93% 100%, 7% 100%, 0% 50%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
            }}
          >
            <div className="text-center">
              <p
                className="uppercase font-semibold text-black/50"
                style={{ fontSize: '9px', letterSpacing: '0.22em' }}
              >
                {l.playerTurn}
              </p>
              <p
                className={`font-black text-black leading-none mt-0.5 transition-all ${
                  rouletteActive ? 'roulette-active' : ''
                }`}
                style={{ fontSize: '34px' }}
              >
                {displayName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className={`w-16 h-16 animate-spin ${questionText ? 'text-black/30' : 'text-white/60'}`} />
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center w-full" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            <div
              className="w-full max-w-sm rounded-2xl p-5 text-center"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            >
              <p className="text-red-300 text-base font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* ── Question card ── */}
        {questionText && !loading && (
          <div className="flex-1 flex items-center justify-center w-full animate-fade-in" style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px' }}>
            <div className="w-full max-w-sm">
              {/* Mughal arch top */}
              <svg viewBox="0 0 340 220" className="w-full" style={{ display: 'block' }}>
                {/* Black fill */}
                <path
                  d="M 0 220 L 0 115 C 0 45 80 0 170 0 C 260 0 340 45 340 115 L 340 220 Z"
                  fill="#111111"
                />
                {/* White border — outer */}
                <path
                  d="M 0 220 L 0 115 C 0 45 80 0 170 0 C 260 0 340 45 340 115 L 340 220"
                  fill="none" stroke="white" strokeWidth="3.5"
                />
                {/* White border 1 */}
                <path
                  d="M 13 220 L 13 118 C 13 56 91 12 170 12 C 249 12 327 56 327 118 L 327 220"
                  fill="none" stroke="white" strokeWidth="2.5"
                />
                {/* White border 2 */}
                <path
                  d="M 25 220 L 25 121 C 25 65 101 22 170 22 C 239 22 315 65 315 121 L 315 220"
                  fill="none" stroke="white" strokeWidth="2"
                />
                {/* White border 3 — inner */}
                <path
                  d="M 36 220 L 36 124 C 36 73 109 31 170 31 C 231 31 304 73 304 124 L 304 220"
                  fill="none" stroke="white" strokeWidth="1.5"
                />
              </svg>
              {/* Card body */}
              <div
                style={{
                  background: '#111111',
                  borderLeft: '3.5px solid white',
                  borderRight: '3.5px solid white',
                  borderBottom: '3.5px solid white',
                  borderRadius: '0 0 28px 28px',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  paddingTop: '24px',
                  paddingBottom: '32px',
                  position: 'relative',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Inner decorative frame */}
                <div style={{
                  position: 'absolute',
                  top: '12px', left: '14px', right: '14px', bottom: '12px',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: '16px',
                  pointerEvents: 'none',
                }} />
                {isCustom && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full mb-3 inline-block" style={{ position: 'relative' }}>
                    {l.customQuestion}
                  </span>
                )}
                <p style={{
                  color: 'white',
                  fontFamily: '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: '22px',
                  lineHeight: '1.5',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  {questionText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Signpost choice ── */}
        {!questionText && !loading && (
          <div className="relative w-full" style={{ maxWidth: '1120px' }}>
            <img
              src="/signpost.png"
              alt=""
              draggable={false}
              className="w-full h-auto select-none translate-y-21 scale-125 max-w-none"
            />
            {/* Player name overlay on ribbon */}
            <div
              className="absolute left-1/2"
              style={{
                top: '3.5%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                width: '55%',
              }}
            >
              <p
                className="uppercase font-semibold"
                style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgb(8, 8, 8)', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                {l.playerTurn}
              </p>
              <p
                className={`font-black leading-none mt-0.5 ${rouletteActive ? 'roulette-active' : ''}`}
                style={{ fontSize: 'clamp(38px, 7vw, 66px)', color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {displayName}
              </p>
            </div>
            {/* Dare invisible tap zone */}
            <button
              onClick={() => handleChoice('dare')}
              className="absolute active:opacity-50 transition-opacity"
              style={{
                top: '38%',
                left: '9%',
                width: '74%',
                height: '18%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
              }}
              aria-label={l.dare}
            />
            {/* Truth invisible tap zone */}
            <button
              onClick={() => handleChoice('truth')}
              className="absolute active:opacity-50 transition-opacity"
              style={{
                top: '60%',
                left: '2%',
                right: '4%',
                height: '16%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
              }}
              aria-label={l.truth}
            />
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="shrink-0 space-y-3" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px' }}>
        {questionText && !loading && (
          <>
            <div className="flex items-center justify-center gap-10">
              <button
                onClick={handleLike}
                className="transition-transform active:scale-90"
              >
                <Heart
                  className="w-9 h-9"
                  style={{ color: liked ? '#e91e63' : '#111111' }}
                  fill={liked ? 'currentColor' : 'none'}
                />
              </button>
              <button onClick={handleReroll} className="active:scale-90 transition-transform">
                <RefreshCw className="w-8 h-8" style={{ color: '#111111' }} />
              </button>
              <button
                onClick={handleDislike}
                className="transition-transform active:scale-90"
              >
                <HeartCrack
                  className="w-9 h-9"
                  style={{ color: disliked ? '#e91e63' : '#111111' }}
                />
              </button>
            </div>
            <button
              onClick={handleNext}
              className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{ background: '#111111' }}
            >
              <span className="text-white text-xl font-bold">{l.nextTurn}</span>
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
