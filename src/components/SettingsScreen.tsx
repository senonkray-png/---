import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { t } from '../services/i18n'
import { ArrowLeft, Trash2, Send } from 'lucide-react'

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
        backgroundImage: 'url(/bg-sunset.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 -z-10 bg-black/40" />

      {/* Header */}
      <div className="flex items-center px-4 py-3 shrink-0">
        <button
          onClick={() => setScreen('start')}
          className="w-12 h-12 flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-7 h-7 text-white" />
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold text-white pr-12">{l.settings}</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-4">

        {/* API Key */}
        <div className="bg-black/80 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-3" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-white font-semibold text-base">{l.apiKey}</span>
          </div>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder="sk-or-v1-..."
            style={{ paddingBottom: '8px', paddingLeft: '4px', paddingRight: '4px' }}
            className="w-full bg-transparent border-b border-white/30 outline-none text-white text-sm focus:border-white/70 placeholder:text-white/30 transition-colors"
          />
          <p className="text-xs text-white/40 mt-2" style={{ paddingLeft: '8px', paddingRight: '8px' }}>{l.getKey}</p>
        </div>

        {/* Language toggle */}
        <div className="flex rounded-2xl overflow-hidden h-12">
          <button
            onClick={() => updateSettings({ language: 'uk' })}
            className={`flex-1 flex items-center justify-center text-base font-bold transition-colors ${
              settings.language === 'uk'
                ? 'bg-white text-black'
                : 'bg-black/60 text-white/60'
            }`}
          >
            {l.ukrainian}
          </button>
          <button
            onClick={() => updateSettings({ language: 'ru' })}
            className={`flex-1 flex items-center justify-center text-base font-bold transition-colors ${
              settings.language === 'ru'
                ? 'bg-gradient-to-r from-purple-600 to-teal-500 text-white'
                : 'bg-black/60 text-white/60'
            }`}
          >
            {l.russian}
          </button>
        </div>

        {/* Custom Interval */}
        <div className="bg-black/80 rounded-2xl p-8" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
          <h2 className="text-white font-bold text-lg mb-3" style={{ paddingLeft: '8px' }}>{l.customInterval}</h2>
          <div className="flex items-center gap-3 text-white" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
            <span className="text-sm text-white/80">{l.every}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.customInterval}
              onChange={(e) =>
                updateSettings({ customInterval: Math.max(1, parseInt(e.target.value) || 1) })
              }
              style={{ padding: '0 8px' }}
              className="w-14 h-7 bg-white/10 rounded-xl text-center outline-none border border-white/20 focus:border-white/50 text-sm font-bold"
            />
            <span className="text-sm text-white/80">{l.turnsFromAi}</span>
          </div>
        </div>

        {/* Add Custom Question */}
        <div className="bg-black/80 rounded-2xl p-4">
          <h2 className="text-white font-bold text-lg mb-3" style={{ paddingLeft: '8px', paddingRight: '8px' }}>{l.addQuestion}</h2>

          {/* Type selector */}
          <div className="flex rounded-xl overflow-hidden h-10 mb-3" style={{ marginLeft: '8px', marginRight: '8px' }}>
            <button
              onClick={() => setQuestionType('truth')}
              className={`flex-1 flex items-center justify-center text-sm font-bold transition-colors ${
                questionType === 'truth'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {l.truth}
            </button>
            <button
              onClick={() => setQuestionType('dare')}
              className={`flex-1 flex items-center justify-center text-sm font-bold transition-colors ${
                questionType === 'dare'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-400 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {l.dare}
            </button>
          </div>

          {/* Input + Send */}
          <div className="relative" style={{ marginLeft: '8px', marginRight: '8px', marginTop: '8px' }}>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={l.text}
              rows={2}
              style={{ padding: '10px 40px 10px 12px' }}
              className="w-full bg-white/10 rounded-xl outline-none resize-none text-white text-sm placeholder:text-white/30 border border-white/10 focus:border-white/30 transition-colors"
            />
            <button
              onClick={handleAddQuestion}
              disabled={!questionText.trim()}
              className="absolute right-2 bottom-2.5 text-white/40 hover:text-white disabled:text-white/20 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-column custom questions */}
        <div className="grid grid-cols-2 gap-3 pb-2">
          {/* Truth column */}
          <div className="bg-black/70 rounded-2xl p-3 min-h-[160px]" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
            <h3 className="text-white font-bold text-sm mb-3 text-center">{l.myTruth}</h3>
            <div className="flex flex-col gap-2">
              {truthQuestions.map((q) => {
                const idx = customQuestions.indexOf(q)
                return (
                  <div key={idx} className="flex items-start gap-1 text-white/80 text-xs border-b border-white/10 pb-2 px-2">
                    <span className="flex-1 leading-snug line-clamp-2 min-w-0 overflow-hidden">{q.text}</span>
                    <button
                      onClick={() => removeCustomQuestion(idx)}
                      className="text-white/30 hover:text-red-400 shrink-0 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dare column */}
          <div className="bg-black/70 rounded-2xl p-3 min-h-[160px]" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
            <h3 className="text-white font-bold text-sm mb-3 text-center">{l.myDare}</h3>
            <div className="flex flex-col gap-2">
              {dareQuestions.map((q) => {
                const idx = customQuestions.indexOf(q)
                return (
                  <div key={idx} className="flex items-start gap-1 text-white/80 text-xs border-b border-white/10 pb-2 px-2">
                    <span className="flex-1 leading-snug line-clamp-2 min-w-0 overflow-hidden">{q.text}</span>
                    <button
                      onClick={() => removeCustomQuestion(idx)}
                      className="text-white/30 hover:text-red-400 shrink-0 transition-colors"
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
