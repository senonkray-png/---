import { useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { generateQuestion } from '../services/aiService'
import {
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
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

  const [questionText, setQuestionText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rouletteActive, setRouletteActive] = useState(false)
  const [rouletteName, setRouletteName] = useState('')
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [isCustom, setIsCustom] = useState(false)

  const currentPlayer = players[turnState.currentPlayerIndex] || players[0]

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
        // Try any available
        const any = customQuestions
          .map((q, i) => ({ ...q, index: i }))
          .filter((q) => !q.used)
        if (any.length === 0) return null
        const pick = any[Math.floor(Math.random() * any.length)]
        markCustomQuestionUsed(pick.index)
        // Check if all used -> reset
        if (customQuestions.filter((q) => !q.used).length <= 1) {
          resetCustomQuestions()
        }
        return pick.text
      }

      const pick = available[Math.floor(Math.random() * available.length)]
      markCustomQuestionUsed(pick.index)
      if (customQuestions.filter((q) => !q.used).length <= 1) {
        resetCustomQuestions()
      }
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

    // Roulette
    if (settings.randomWheel) {
      await runRoulette()
    }

    incrementAiCounter()

    // Check custom question
    if (shouldUseCustom()) {
      const custom = getCustomQuestion(type)
      if (custom) {
        setQuestionText(custom)
        setIsCustom(true)
        addToHistory(custom)
        return
      }
    }

    // AI generation
    if (!settings.apiKey) {
      setError('Добавьте API ключ OpenRouter в настройках')
      return
    }

    setLoading(true)
    try {
      const playerName =
        players[useGameStore.getState().turnState.currentPlayerIndex]?.name ||
        currentPlayer.name
      const result = await generateQuestion(
        type,
        playerName,
        history,
        aiPreferences,
        settings.apiKey
      )
      setQuestionText(result)
      addToHistory(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  const handleReroll = async () => {
    if (!questionText) return
    const type = Math.random() > 0.5 ? 'truth' : 'dare'
    setLiked(false)
    setDisliked(false)
    setIsCustom(false)

    if (!settings.apiKey) {
      setError('Добавьте API ключ OpenRouter в настройках')
      return
    }

    setLoading(true)
    try {
      const playerName =
        players[turnState.currentPlayerIndex]?.name || currentPlayer.name
      const result = await generateQuestion(
        type,
        playerName,
        history,
        aiPreferences,
        settings.apiKey
      )
      setQuestionText(result)
      addToHistory(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = () => {
    if (questionText && !liked) {
      addLike(questionText)
      setLiked(true)
      setDisliked(false)
    }
  }

  const handleDislike = () => {
    if (questionText && !disliked) {
      addDislike(questionText)
      setDisliked(true)
      setLiked(false)
    }
  }

  const handleNext = () => {
    setQuestionText(null)
    setError(null)
    setLiked(false)
    setDisliked(false)
    setIsCustom(false)
    nextTurn()
  }

  const displayName = rouletteActive
    ? rouletteName
    : currentPlayer?.name || '?'

  return (
    <div
      className="flex flex-col h-dvh w-full"
      style={{
        background: '#0a0a0f',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center px-5 py-3 shrink-0">
        <button
          onClick={() => setScreen('start')}
          className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs text-white/50 uppercase tracking-widest font-medium">
            Ход игрока
          </span>
          <span
            className={`text-2xl sm:text-3xl font-bold text-white mt-0.5 transition-all ${
              rouletteActive ? 'roulette-active text-[var(--accent-pink)]' : ''
            }`}
          >
            {displayName}
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-5 gap-5">

        {/* Loader */}
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-14 h-14 text-[var(--accent-purple)] animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-5 text-center animate-fade-in">
            <p className="text-red-400 text-base">{error}</p>
          </div>
        )}

        {/* Question card */}
        {questionText && !loading && (
          <div className="animate-fade-in">
            <div
              className="rounded-3xl p-6 sm:p-8"
              style={{ background: '#1a1f3c' }}
            >
              {isCustom && (
                <span className="text-xs bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] px-2 py-1 rounded-full mb-4 inline-block">
                  Свой вопрос
                </span>
              )}
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                {questionText}
              </p>
            </div>

            {/* Reroll / Like / Dislike */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5">
              <button
                onClick={handleReroll}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-5 py-2.5 text-white/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Заменить</span>
              </button>
              <button
                onClick={handleLike}
                className={`rounded-full p-2.5 transition-colors ${
                  liked ? 'bg-green-500/30 text-green-400' : 'bg-white/10 hover:bg-white/20 text-white/60'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
              <button
                onClick={handleDislike}
                className={`rounded-full p-2.5 transition-colors ${
                  disliked ? 'bg-red-500/30 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white/60'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Choice buttons */}
        {!questionText && !loading && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <button
              onClick={() => handleChoice('truth')}
              className="w-full rounded-3xl px-6 py-8 sm:py-10 text-3xl sm:text-4xl font-bold text-white active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #6d28d9, #4c1d95)' }}
            >
              🔮 ПРАВДА
            </button>
            <button
              onClick={() => handleChoice('dare')}
              className="w-full rounded-3xl px-6 py-8 sm:py-10 text-3xl sm:text-4xl font-bold text-white active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #e94560, #be123c)' }}
            >
              🔥 ДЕЙСТВИЕ
            </button>
          </div>
        )}
      </div>

      {/* Next turn button */}
      <div className="px-4 sm:px-5 shrink-0 pt-2">
        {questionText && !loading ? (
          <button
            onClick={handleNext}
            className="w-full rounded-2xl py-5 sm:py-6 text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={{ background: 'linear-gradient(90deg, #e94560, #8b5cf6)' }}
          >
            Следующий ход
            <ChevronRight className="w-6 h-6" />
          </button>
        ) : (
          <div className="h-16 sm:h-20" />
        )}
      </div>
    </div>
  )
}
