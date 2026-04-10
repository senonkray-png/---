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
      className="flex flex-col h-dvh w-full max-w-lg mx-auto px-4"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      {/* Top Bar */}
      <div className="flex items-center shrink-0 py-3 sm:py-4">
        <button
          onClick={() => setScreen('start')}
          className="text-[var(--text-secondary)] hover:text-white transition-colors p-1"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">
            Ход игрока
          </span>
        </div>
        <div className="w-8" />
      </div>

      {/* Player Name */}
      <div
        className={`text-3xl sm:text-4xl font-bold text-center py-4 sm:py-6 shrink-0 transition-all ${
          rouletteActive ? 'roulette-active text-[var(--accent-pink)]' : ''
        }`}
      >
        {displayName}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center">

        {/* Loader */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-[var(--accent-purple)] animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Question card */}
        {questionText && !loading && (
          <div className="flex flex-col gap-4 sm:gap-5 animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6">
              {isCustom && (
                <span className="text-xs bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] px-2 py-1 rounded mb-3 inline-block">
                  Свой вопрос
                </span>
              )}
              <p className="text-base sm:text-lg leading-relaxed">{questionText}</p>
            </div>

            {/* Like / Dislike / Reroll */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={handleReroll}
                className="flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] rounded-xl px-4 py-3 sm:py-4 text-[var(--text-secondary)] transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm sm:text-base">Заменить</span>
              </button>
              <button
                onClick={handleLike}
                className={`rounded-xl p-3 sm:p-4 transition-colors ${
                  liked
                    ? 'bg-green-600 text-white'
                    : 'bg-[var(--bg-card)] hover:bg-green-600/20 text-[var(--text-secondary)]'
                }`}
              >
                <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={handleDislike}
                className={`rounded-xl p-3 sm:p-4 transition-colors ${
                  disliked
                    ? 'bg-red-600 text-white'
                    : 'bg-[var(--bg-card)] hover:bg-red-600/20 text-[var(--text-secondary)]'
                }`}
              >
                <ThumbsDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Choice buttons */}
        {!questionText && !loading && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <button
              onClick={() => handleChoice('truth')}
              className="w-full bg-gradient-to-r from-[var(--accent-purple)] to-purple-800 hover:opacity-90 rounded-2xl px-6 py-7 sm:py-9 text-2xl sm:text-3xl font-bold transition-opacity active:scale-95 transform"
            >
              🔮 ПРАВДА
            </button>
            <button
              onClick={() => handleChoice('dare')}
              className="w-full bg-gradient-to-r from-[var(--accent-pink)] to-red-800 hover:opacity-90 rounded-2xl px-6 py-7 sm:py-9 text-2xl sm:text-3xl font-bold transition-opacity active:scale-95 transform"
            >
              🔥 ДЕЙСТВИЕ
            </button>
          </div>
        )}

      </div>

      {/* Next turn button — bottom */}
      {questionText && !loading && (
        <div className="shrink-0 pt-3 sm:pt-4">
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] hover:opacity-90 rounded-xl px-4 py-4 sm:py-5 text-base sm:text-lg font-bold transition-opacity"
          >
            Следующий ход
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
