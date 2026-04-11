import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { t } from '../services/i18n'
import { ChevronLeft, Settings, Trash2 } from 'lucide-react'

function GenderToggle({
  gender,
  onChange,
}: {
  gender: 'male' | 'female'
  onChange: (g: 'male' | 'female') => void
}) {
  return (
    <div className="flex items-center rounded-full overflow-hidden h-10 w-20 shrink-0 bg-black/60">
      <button
        onClick={() => onChange('male')}
        className={`flex-1 h-full flex items-center justify-center transition-colors ${
          gender === 'male' ? 'bg-red-600' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <circle cx="12" cy="8" r="4" fill={gender === 'male' ? '#fff' : '#e94560'} />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill={gender === 'male' ? '#fff' : '#e94560'} />
        </svg>
      </button>
      <button
        onClick={() => onChange('female')}
        className={`flex-1 h-full flex items-center justify-center transition-colors ${
          gender === 'female' ? 'bg-red-600' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <circle cx="12" cy="8" r="4" fill={gender === 'female' ? '#fff' : '#fff'} />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill={gender === 'female' ? '#fff' : '#fff'} />
        </svg>
      </button>
    </div>
  )
}

export default function StartScreen() {
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const {
    players,
    addPlayer,
    removePlayer,
    setPlayerGender,
    settings,
    updateSettings,
    setScreen,
  } = useGameStore()
  const l = t(settings.language)

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (trimmed) {
      addPlayer(trimmed)
      setNewName('')
      setShowInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const canStart = players.length >= 2

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
          background: 'linear-gradient(180deg, #2d1b33 0%, #8b4c5e 30%, #c88a6e 55%, #d4a574 70%, #b8856a 100%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button className="w-12 h-12 flex items-center justify-center">
          <ChevronLeft className="w-8 h-8 text-white/70" />
        </button>
        <button
          onClick={() => setScreen('settings')}
          className="w-12 h-12 flex items-center justify-center"
        >
          <Settings className="w-7 h-7 text-white/70" />
        </button>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-3">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 animate-fade-in"
          >
            {/* Trash */}
            <button
              onClick={() => removePlayer(p.id)}
              className="w-10 h-10 bg-black/70 rounded-xl flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-5 h-5 text-white/80" />
            </button>

            {/* Name pill */}
            <div
              className="flex-1 h-14 flex items-center justify-center rounded-2xl px-4"
              style={{
                background: 'linear-gradient(90deg, rgba(80,80,80,0.7) 0%, rgba(150,150,150,0.5) 100%)',
              }}
            >
              <span className="text-white font-bold text-xl sm:text-2xl tracking-tight">
                {p.name}
              </span>
            </div>

            {/* Gender toggle */}
            <GenderToggle
              gender={p.gender}
              onChange={(g) => setPlayerGender(p.id, g)}
            />
          </div>
        ))}

        {/* Inline input */}
        {showInput && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-10 shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={l.enterName}
              maxLength={20}
              className="flex-1 h-14 bg-black/40 rounded-2xl px-4 outline-none text-white text-xl font-bold placeholder:text-white/40 border border-white/20 focus:border-white/50"
            />
            <button
              onClick={handleAdd}
              className="h-14 px-5 bg-black/60 rounded-2xl text-white font-bold transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 space-y-3 pt-2">
        {/* Roulette toggle */}
        <div className="flex items-center gap-3 bg-black/60 rounded-2xl px-4 py-3">
          <span className="text-2xl">🎡</span>
          <span className="flex-1 text-white font-bold text-lg">{l.roulette}</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.randomWheel}
              onChange={(e) => updateSettings({ randomWheel: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-green-500" />
          </label>
        </div>

        {/* Start + Add row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (canStart) setScreen('game') }}
            disabled={!canStart}
            className={`flex-1 h-16 rounded-2xl text-2xl font-bold transition-all ${
              canStart
                ? 'bg-white/90 text-black active:scale-[0.97]'
                : 'bg-white/30 text-white/50 cursor-not-allowed'
            }`}
          >
            {canStart ? l.start : l.min2players}
          </button>
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="w-16 h-16 bg-black/70 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
