import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { t } from '../services/i18n'
import { ChevronLeft, Trash2, Send } from 'lucide-react'

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    customQuestions,
    addCustomQuestion,
    removeCustomQuestion,
    setScreen,
  } = useGameStore()

  const l = t(settings.language)
  const [questionType, setQuestionType] = useState<'truth' | 'dare'>('truth')
  const [questionText, setQuestionText] = useState('')

  const handleAddQuestion = () => {
    const trimmed = questionText.trim()
    if (trimmed) {
      addCustomQuestion(questionType, trimmed)
      setQuestionText('')
    }
  }

  const truthQuestions = customQuestions.filter((q) => q.type === 'truth')
  const dareQuestions = customQuestions.filter((q) => q.type === 'dare')

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
          background: 'linear-gradient(180deg, #d4849a 0%, #c97090 20%, #8b3060 50%, #3d1530 100%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          onClick={() => setScreen('start')}
          className="w-12 h-12 flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8 text-white/70" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{l.settings}</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">

        {/* API Key */}
        <div className="bg-black/70 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔑</span>
            <span className="text-white font-semibold text-sm">{l.apiKey}</span>
          </div>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder="sk-or-v1-..."
            className="w-full bg-black/40 rounded-xl px-3 py-2.5 outline-none text-white text-sm border border-white/10 focus:border-white/30 placeholder:text-white/30"
          />
          <p className="text-xs text-white/40 mt-1">{l.getKey}</p>
        </div>

        {/* Language toggle */}
        <div className="flex rounded-2xl overflow-hidden h-12 border border-white/20">
          <button
            onClick={() => updateSettings({ language: 'uk' })}
            className={`flex-1 flex items-center justify-center text-lg font-bold transition-colors ${
              settings.language === 'uk'
                ? 'bg-black/80 text-white'
                : 'bg-white/20 text-white/60'
            }`}
          >
            {l.ukrainian}
          </button>
          <button
            onClick={() => updateSettings({ language: 'ru' })}
            className={`flex-1 flex items-center justify-center text-lg font-bold transition-colors ${
              settings.language === 'ru'
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                : 'bg-white/20 text-white/60'
            }`}
          >
            {l.russian}
          </button>
        </div>

        {/* Custom Interval */}
        <div className="bg-gradient-to-r from-pink-600/80 to-pink-700/80 rounded-2xl p-4">
          <h2 className="text-white font-bold text-lg mb-2">{l.customInterval}</h2>
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm">{l.every}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.customInterval}
              onChange={(e) =>
                updateSettings({ customInterval: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-12 h-8 bg-white/20 rounded-lg px-2 text-center outline-none border border-white/20 text-sm"
            />
            <span className="text-sm">{l.turnsFromAi}</span>
          </div>
        </div>

        {/* Add Custom Question */}
        <div className="bg-black/70 rounded-2xl p-4">
          <h2 className="text-white font-bold text-lg mb-3">{l.addQuestion}</h2>

          {/* Type selector */}
          <div className="flex rounded-xl overflow-hidden h-10 mb-3">
            <button
              onClick={() => setQuestionType('truth')}
              className={`flex-1 flex items-center justify-center text-sm font-bold transition-colors ${
                questionType === 'truth'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {l.truth}
            </button>
            <button
              onClick={() => setQuestionType('dare')}
              className={`flex-1 flex items-center justify-center text-sm font-bold transition-colors ${
                questionType === 'dare'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {l.dare}
            </button>
          </div>

          {/* Input + Send */}
          <div className="relative">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={l.text}
              rows={2}
              className="w-full bg-white rounded-xl px-3 py-2 pr-10 outline-none resize-none text-black text-sm placeholder:text-gray-400"
            />
            <button
              onClick={handleAddQuestion}
              disabled={!questionText.trim()}
              className="absolute right-2 bottom-2 text-gray-400 hover:text-purple-500 disabled:text-gray-300 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-column custom questions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Truth column */}
          <div className="bg-black/60 rounded-2xl p-3 min-h-[200px]">
            <h3 className="text-white font-bold text-base mb-2 text-center">{l.myTruth}</h3>
            <div className="space-y-2">
              {truthQuestions.map((q) => {
                const idx = customQuestions.indexOf(q)
                return (
                  <div key={idx} className="flex items-start gap-1 text-white/80 text-xs border-b border-white/10 pb-1.5">
                    <span className="flex-1 leading-snug">{q.text}</span>
                    <button
                      onClick={() => removeCustomQuestion(idx)}
                      className="text-white/40 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dare column */}
          <div className="bg-black/60 rounded-2xl p-3 min-h-[200px]">
            <h3 className="text-white font-bold text-base mb-2 text-center">{l.myDare}</h3>
            <div className="space-y-2">
              {dareQuestions.map((q) => {
                const idx = customQuestions.indexOf(q)
                return (
                  <div key={idx} className="flex items-start gap-1 text-white/80 text-xs border-b border-white/10 pb-1.5">
                    <span className="flex-1 leading-snug">{q.text}</span>
                    <button
                      onClick={() => removeCustomQuestion(idx)}
                      className="text-white/40 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
