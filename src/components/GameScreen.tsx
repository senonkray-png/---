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
      className="flex flex-col h-dvh w-full relative"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: questionText
            ? 'linear-gradient(180deg, #f8c8d4 0%, #f0a0b8 50%, #e88ca0 100%)'
            : 'linear-gradient(180deg, #87ceeb 0%, #b5d8e8 30%, #d4e8f0 60%, #a8c8d8 100%)',
        }}
      />

      {/* Header — back arrow */}
      <div className="flex items-center px-4 py-2 shrink-0">
        <button
          onClick={() => setScreen('start')}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8 text-white/70" />
        </button>
      </div>

      {/* Banner — player name */}
      <div className="flex justify-center shrink-0 px-4 mb-4">
        <div
          className="relative px-8 py-3 sm:py-4"
          style={{
            background: 'linear-gradient(135deg, #a0a0a0, #d0d0d0, #a0a0a0)',
            clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
          }}
        >
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-black/60 uppercase tracking-widest font-medium">{l.playerTurn}</p>
            <p
              className={`text-3xl sm:text-4xl font-black text-black leading-none mt-0.5 transition-all ${
                rouletteActive ? 'roulette-active' : ''
              }`}
            >
              {displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col justify-center px-4">

        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-black/40 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-black/20 rounded-2xl p-5 text-center animate-fade-in">
            <p className="text-red-700 text-base font-medium">{error}</p>
          </div>
        )}

        {/* Question card — arch shape */}
        {questionText && !loading && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="w-full max-w-sm">
              {/* Arch SVG top */}
              <svg viewBox="0 0 320 80" className="w-full" preserveAspectRatio="none">
                <path
                  d="M0 80 L0 40 Q0 0 40 0 L280 0 Q320 0 320 40 L320 80 Z"
                  fill="#1a1a1a"
                  stroke="#333"
                  strokeWidth="2"
                />
                {/* Decorative inner arches */}
                <path
                  d="M20 80 L20 50 Q20 15 55 15 L265 15 Q300 15 300 50 L300 80"
                  fill="none"
                  stroke="#444"
                  strokeWidth="1.5"
                />
                <path
                  d="M35 80 L35 55 Q35 25 65 25 L255 25 Q285 25 285 55 L285 80"
                  fill="none"
                  stroke="#555"
                  strokeWidth="1"
                />
              </svg>
              {/* Card body */}
              <div
                className="rounded-b-3xl px-5 py-6 sm:px-6 sm:py-8 border-x-2 border-b-2 border-[#333] -mt-px"
                style={{ background: '#1a1a1a' }}
              >
                {isCustom && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full mb-3 inline-block">
                    {l.customQuestion}
                  </span>
                )}
                <p className="text-white font-bold text-xl sm:text-2xl leading-snug text-center">
                  {questionText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Choice buttons — signpost style */}
        {!questionText && !loading && (
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <button
              onClick={() => handleChoice('dare')}
              className="w-72 sm:w-80 py-5 sm:py-6 bg-[#1a1a1a] rounded-2xl text-white text-3xl sm:text-4xl font-black tracking-tight active:scale-95 transition-transform border-2 border-[#333] shadow-xl"
              style={{ fontStyle: 'italic' }}
            >
              {l.dare}
            </button>
            <button
              onClick={() => handleChoice('truth')}
              className="w-72 sm:w-80 py-5 sm:py-6 bg-[#1a1a1a] rounded-2xl text-white text-3xl sm:text-4xl font-black tracking-tight active:scale-95 transition-transform border-2 border-[#333] shadow-xl"
              style={{ fontStyle: 'italic' }}
            >
              {l.truth}
            </button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pt-2 space-y-3">
        {questionText && !loading && (
          <>
            {/* Like / Reroll / Dislike */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <button
                onClick={handleLike}
                className={`transition-transform active:scale-90 ${liked ? 'text-red-500' : 'text-black/70'}`}
              >
                <Heart className="w-8 h-8 sm:w-10 sm:h-10" fill={liked ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleReroll}
                className="text-black/70 active:scale-90 transition-transform"
              >
                <RefreshCw className="w-7 h-7 sm:w-9 sm:h-9" />
              </button>
              <button
                onClick={handleDislike}
                className={`transition-transform active:scale-90 ${disliked ? 'text-red-500' : 'text-black/70'}`}
              >
                <HeartCrack className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            </div>

            {/* Next turn */}
            <button
              onClick={handleNext}
              className="w-full bg-black/90 rounded-2xl py-4 sm:py-5 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              <span className="text-white text-xl sm:text-2xl font-bold">{l.nextTurn}</span>
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
