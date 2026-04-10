import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ArrowLeft, Plus, Trash2, Key } from 'lucide-react'

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    customQuestions,
    addCustomQuestion,
    removeCustomQuestion,
    setScreen,
  } = useGameStore()

  const [questionType, setQuestionType] = useState<'truth' | 'dare'>('truth')
  const [questionText, setQuestionText] = useState('')

  const handleAddQuestion = () => {
    const trimmed = questionText.trim()
    if (trimmed) {
      addCustomQuestion(questionType, trimmed)
      setQuestionText('')
    }
  }

  return (
    <div
      className="flex flex-col h-dvh w-full max-w-lg mx-auto px-4"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 py-4 sm:py-5 shrink-0">
        <button
          onClick={() => setScreen('start')}
          className="text-[var(--text-secondary)] hover:text-white transition-colors p-1"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Настройки</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-2">

      {/* API Key */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 sm:p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-[var(--accent-purple)]" />
          <h2 className="font-semibold">API Ключ OpenRouter</h2>
        </div>
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => updateSettings({ apiKey: e.target.value })}
          placeholder="sk-or-v1-..."
          className="w-full bg-[var(--bg-secondary)] rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[var(--accent-purple)] transition-colors text-sm placeholder:text-[var(--text-secondary)]"
        />
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Получите ключ на openrouter.ai
        </p>
      </div>

      {/* Custom Interval */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 sm:p-5 animate-fade-in">
        <h2 className="font-semibold mb-2">Интервал своих вопросов</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">Каждые</span>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.customInterval}
            onChange={(e) =>
              updateSettings({ customInterval: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-16 bg-[var(--bg-secondary)] rounded-lg px-3 py-2 outline-none text-center border border-transparent focus:border-[var(--accent-purple)] transition-colors"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            ходов от ИИ — 1 свой вопрос
          </span>
        </div>
      </div>

      {/* Add Custom Question */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 sm:p-5 animate-fade-in">
        <h2 className="font-semibold mb-3">Добавить свой вопрос</h2>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setQuestionType('truth')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              questionType === 'truth'
                ? 'bg-[var(--accent-purple)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            Правда
          </button>
          <button
            onClick={() => setQuestionType('dare')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              questionType === 'dare'
                ? 'bg-[var(--accent-pink)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            Действие
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Введите вопрос или задание..."
            rows={2}
            className="flex-1 bg-[var(--bg-secondary)] rounded-lg px-3 py-2 outline-none resize-none border border-transparent focus:border-[var(--accent-purple)] transition-colors text-sm placeholder:text-[var(--text-secondary)]"
          />
          <button
            onClick={handleAddQuestion}
            disabled={!questionText.trim()}
            className="self-end bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg px-3 py-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Custom Questions List */}
      {customQuestions.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 sm:p-5 animate-fade-in">
          <h2 className="font-semibold mb-3 text-sm sm:text-base">
            Мои вопросы ({customQuestions.length})
          </h2>
          <div className="space-y-2">
            {customQuestions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-[var(--bg-secondary)] rounded-lg p-3"
              >
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                    q.type === 'truth'
                      ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                      : 'bg-[var(--accent-pink)]/20 text-[var(--accent-pink)]'
                  }`}
                >
                  {q.type === 'truth' ? 'П' : 'Д'}
                </span>
                <span className="flex-1 text-sm">{q.text}</span>
                <button
                  onClick={() => removeCustomQuestion(i)}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
