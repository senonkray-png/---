import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { t } from '../services/i18n'
import { ArrowLeft, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react'

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

  const [levelForms, setLevelForms] = useState<Record<1 | 2 | 3, { type: 'truth' | 'dare'; text: string }>>({
    1: { type: 'truth', text: '' },
    2: { type: 'truth', text: '' },
    3: { type: 'truth', text: '' },
  })
  const [openLevels, setOpenLevels] = useState<Record<1 | 2 | 3, boolean>>({ 1: true, 2: false, 3: false })

  const handleAddQuestion = (level: 1 | 2 | 3) => {
    const trimmed = levelForms[level].text.trim()
    if (trimmed) {
      addCustomQuestion(levelForms[level].type, trimmed, level)
      setLevelForms((prev) => ({ ...prev, [level]: { ...prev[level], text: '' } }))
    }
  }

  const levelColors: Record<1 | 2 | 3, string> = {
    1: 'from-green-700 to-teal-600',
    2: 'from-orange-600 to-amber-500',
    3: 'from-red-700 to-pink-600',
  }
  const levelEnabledKeys: Record<1 | 2 | 3, 'level1Enabled' | 'level2Enabled' | 'level3Enabled'> = {
    1: 'level1Enabled',
    2: 'level2Enabled',
    3: 'level3Enabled',
  }
  const levelIntervalKeys: Record<1 | 2 | 3, 'level1Interval' | 'level2Interval' | 'level3Interval'> = {
    1: 'level1Interval',
    2: 'level2Interval',
    3: 'level3Interval',
  }
  const levelNames: Record<1 | 2 | 3, string> = { 1: l.level1, 2: l.level2, 3: l.level3 }

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

        {/* Level sections */}
        {([1, 2, 3] as const).map((lvl) => {
          const enabledKey = levelEnabledKeys[lvl]
          const intervalKey = levelIntervalKeys[lvl]
          const isEnabled = settings[enabledKey]
          const interval = settings[intervalKey]
          const form = levelForms[lvl]
          const lvlQuestions = customQuestions.filter((q) => q.level === lvl)
          const truthQ = lvlQuestions.filter((q) => q.type === 'truth')
          const dareQ = lvlQuestions.filter((q) => q.type === 'dare')
          const isOpen = openLevels[lvl]

          return (
            <div key={lvl} className="rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Level header */}
              <div
                className={`flex items-center gap-3 bg-gradient-to-r ${levelColors[lvl]} cursor-pointer ${isOpen ? 'rounded-t-2xl' : 'rounded-2xl'}`}
                style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '12px' }}
                onClick={() => setOpenLevels((p) => ({ ...p, [lvl]: !p[lvl] }))}
              >
                <span className="text-white font-bold text-base flex-1">{levelNames[lvl]}</span>
                <span className="text-white/70 text-xs">{lvlQuestions.length} {lvl === 1 ? l.truth.toLowerCase() + '+' + l.dare.toLowerCase() : ''}</span>
                {/* Enable toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); updateSettings({ [enabledKey]: !isEnabled }) }}
                  className={`text-xs font-bold rounded-lg transition-colors ${isEnabled ? 'bg-white text-black' : 'bg-white/20 text-white/60'}`}
                  style={{ paddingTop: '4px', paddingBottom: '4px', paddingLeft: '10px', paddingRight: '10px' }}
                >
                  {isEnabled ? l.levelOn : l.levelOff}
                </button>
                {isOpen ? <ChevronUp className="w-4 h-4 text-white/60 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />}
              </div>

              {isOpen && (
                <div className="bg-black/80 rounded-b-2xl flex flex-col gap-3" style={{ paddingTop: '12px', paddingBottom: '16px', paddingLeft: '12px', paddingRight: '12px' }}>
                  {/* Interval */}
                  <div className="flex items-center gap-3">
                    <span className="text-white/70 text-sm">{l.levelInterval}:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={interval}
                      onChange={(e) => updateSettings({ [intervalKey]: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={{ padding: '0 8px' }}
                      className="w-14 h-7 bg-white/10 rounded-xl text-center outline-none border border-white/20 focus:border-white/50 text-sm font-bold text-white"
                    />
                    <span className="text-white/50 text-sm">{l.levelIntervalHint}</span>
                  </div>

                  {/* Type selector */}
                  <div className="flex rounded-xl overflow-hidden h-9">
                    <button
                      onClick={() => setLevelForms((p) => ({ ...p, [lvl]: { ...p[lvl], type: 'truth' } }))}
                      className={`flex-1 flex items-center justify-center text-sm font-bold transition-colors ${form.type === 'truth' ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {l.truth}
                    </button>
                    <button
                      onClick={() => setLevelForms((p) => ({ ...p, [lvl]: { ...p[lvl], type: 'dare' } }))}
                      className={`flex-1 flex items-center justify-center text-sm font-bold transition-colors ${form.type === 'dare' ? 'bg-gradient-to-r from-teal-600 to-teal-400 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {l.dare}
                    </button>
                  </div>

                  {/* Input */}
                  <div className="relative">
                    <textarea
                      value={form.text}
                      onChange={(e) => setLevelForms((p) => ({ ...p, [lvl]: { ...p[lvl], text: e.target.value } }))}
                      placeholder={l.text}
                      rows={2}
                      style={{ padding: '10px 40px 10px 12px' }}
                      className="w-full bg-white/10 rounded-xl outline-none resize-none text-white text-sm placeholder:text-white/30 border border-white/10 focus:border-white/30 transition-colors"
                    />
                    <button
                      onClick={() => handleAddQuestion(lvl)}
                      disabled={!form.text.trim()}
                      className="absolute right-2 bottom-2.5 text-white/40 hover:text-white disabled:text-white/20 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Two-column list */}
                  {lvlQuestions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-xl" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
                        <h4 className="text-white/60 text-xs font-bold mb-2 text-center">{l.myTruth}</h4>
                        <div className="flex flex-col gap-1">
                          {truthQ.map((q) => (
                            <div key={q.id} className="flex items-start gap-1 border-b border-white/10 pb-1">
                              <span className="flex-1 text-white/80 text-xs leading-snug min-w-0">{q.text}</span>
                              <button onClick={() => removeCustomQuestion(q.id)} className="text-white/30 hover:text-red-400 shrink-0 transition-colors" style={{ paddingTop: '2px' }}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
                        <h4 className="text-white/60 text-xs font-bold mb-2 text-center">{l.myDare}</h4>
                        <div className="flex flex-col gap-1">
                          {dareQ.map((q) => (
                            <div key={q.id} className="flex items-start gap-1 border-b border-white/10 pb-1">
                              <span className="flex-1 text-white/80 text-xs leading-snug min-w-0">{q.text}</span>
                              <button onClick={() => removeCustomQuestion(q.id)} className="text-white/30 hover:text-red-400 shrink-0 transition-colors" style={{ paddingTop: '2px' }}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
