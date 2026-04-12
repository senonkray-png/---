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
    resetLevelQuestions,
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

  const getPartnerName = useCallback((): string => {
    const oppositeGender = currentPlayer.gender === 'male' ? 'female' : 'male'
    const partner =
      players.find((p) => p.id !== currentPlayer.id && p.gender === oppositeGender) ||
      players.find((p) => p.id !== currentPlayer.id)
    return partner?.name ?? ''
  }, [currentPlayer, players])

  const getCustomLevel = useCallback((): 1 | 2 | 3 | null => {
    const counter = turnState.aiCounter + 1
    const levels: Array<1 | 2 | 3> = [3, 2, 1]
    for (const lvl of levels) {
      const enabledKey = `level${lvl}Enabled` as 'level1Enabled' | 'level2Enabled' | 'level3Enabled'
      const intervalKey = `level${lvl}Interval` as 'level1Interval' | 'level2Interval' | 'level3Interval'
      const enabled = settings[enabledKey]
      const interval = settings[intervalKey]
      const available = customQuestions.filter((q) => !q.used && q.level === lvl)
      if (enabled && interval > 0 && counter % interval === 0 && available.length > 0) {
        return lvl
      }
    }
    return null
  }, [turnState, customQuestions, settings])

  const getCustomQuestion = useCallback(
    (type: 'truth' | 'dare', level: 1 | 2 | 3): string | null => {
      const typed = customQuestions.filter((q) => !q.used && q.level === level && q.type === type)
      const pool = typed.length > 0 ? typed : customQuestions.filter((q) => !q.used && q.level === level)
      if (pool.length === 0) return null
      const pick = pool[Math.floor(Math.random() * pool.length)]
      markCustomQuestionUsed(pick.id)
      const remaining = customQuestions.filter((q) => !q.used && q.level === level && q.id !== pick.id)
      if (remaining.length === 0) resetLevelQuestions(level)
      const partnerName = getPartnerName()
      return pick.text.replace(/\{partner\}/g, partnerName)
    },
    [customQuestions, markCustomQuestionUsed, resetLevelQuestions, getPartnerName]
  )

  const handleChoice = async (type: 'truth' | 'dare') => {
    setQuestionText(null)
    setError(null)
    setLiked(false)
    setDisliked(false)
    setIsCustom(false)

    if (settings.randomWheel) await runRoulette()

    incrementAiCounter()

    const customLevel = getCustomLevel()
    if (customLevel !== null) {
      const custom = getCustomQuestion(type, customLevel)
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
                backgroundImage: 'url(/bg-sunset.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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
        <div className="flex justify-center shrink-0 mt-2 mb-1">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Ghost text — задаёт ширину контейнера, невидим */}
            <div style={{ visibility: 'hidden', whiteSpace: 'nowrap', paddingLeft: '52px', paddingRight: '52px', paddingTop: '10px', paddingBottom: '10px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.22em' }}>{l.playerTurn}</p>
              <p style={{ fontSize: '28px', fontWeight: 900 }}>{displayName}</p>
            </div>
            {/* Ribbon image — растягивается под ширину ghostа */}
            <img
              src="/1.png"
              alt=""
              draggable={false}
              className="select-none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
            />
            {/* Visible text overlay */}
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <p
                className="uppercase font-semibold"
                style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}
              >
                {l.playerTurn}
              </p>
              <p
                className={`font-black leading-none mt-0.5 transition-all ${rouletteActive ? 'roulette-active' : ''}`}
                style={{ fontSize: '28px', color: '#111111', whiteSpace: 'nowrap' }}
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
          <div
            className="flex-1 flex w-full animate-fade-in"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px', paddingTop: '4px', alignItems: 'stretch' }}
          >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Card body — fills all available vertical space */}
              <div
                style={{
                  background: 'rgba(17, 17, 17, 0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '3.5px solid white',
                  borderRadius: '28px',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  paddingTop: '28px',
                  paddingBottom: '40px',
                  position: 'relative',
                  flex: 1,
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
                  fontSize: 'clamp(24px, 3.5dvh, 42px)',
                  lineHeight: '1.55',
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
              src={settings.language === 'uk' ? '/signpostUK.png' : '/signpost.png'}
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
                style={{ paddingTop: '8px', paddingBottom: '8px' }}
              >
                <Heart
                  className="w-14 h-14"
                  style={{ color: liked ? '#e91e63' : 'white' }}
                  fill={liked ? 'currentColor' : 'none'}
                />
              </button>
              <button
                onClick={handleReroll}
                className="active:scale-90 transition-transform"
                style={{ paddingTop: '8px', paddingBottom: '8px' }}
              >
                <RefreshCw className="w-12 h-12" style={{ color: 'white' }} />
              </button>
              <button
                onClick={handleDislike}
                className="transition-transform active:scale-90"
                style={{ paddingTop: '8px', paddingBottom: '8px' }}
              >
                <HeartCrack
                  className="w-14 h-14"
                  style={{ color: disliked ? '#e91e63' : 'white' }}
                />
              </button>
            </div>
            <button
              onClick={handleNext}
              className="w-full rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.4)', paddingTop: '20px', paddingBottom: '20px' }}
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
