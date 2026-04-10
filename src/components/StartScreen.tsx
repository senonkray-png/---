import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ChevronLeft, Settings } from 'lucide-react'

function GenderToggle({
  gender,
  onChange,
}: {
  gender: 'male' | 'female'
  onChange: (g: 'male' | 'female') => void
}) {
  return (
    <div className="flex items-center rounded-xl overflow-hidden border-2 border-white/40 h-10 w-20 shrink-0">
      <button
        onClick={() => onChange('male')}
        className={`flex-1 h-full flex items-center justify-center transition-colors ${
          gender === 'male' ? 'bg-[#1a2f5e]' : 'bg-white/30'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
        </svg>
      </button>
      <button
        onClick={() => onChange('female')}
        className={`flex-1 h-full flex items-center justify-center transition-colors ${
          gender === 'female' ? 'bg-[#e94560]' : 'bg-white/30'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
          <path d="M12 2a4.5 4.5 0 1 0 0 9A4.5 4.5 0 0 0 12 2zM12 13c-4 0-7 2-7 3.5V18h14v-1.5c0-1.5-3-3.5-7-3.5z" />
        </svg>
      </button>
    </div>
  )
}

export default function StartScreen() {
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const { players, addPlayer, removePlayer, setPlayerGender, settings, setScreen } = useGameStore()

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
      className="flex flex-col h-dvh w-full"
      style={{
        background: 'linear-gradient(160deg, #4ecbd4 0%, #3ab8c8 100%)',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0">
        <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setScreen('settings')}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {players.map((p, i) => (
          <div key={p.id}>
            <div className="flex items-center gap-3 py-3">
              <button
                onClick={() => removePlayer(p.id)}
                className="w-8 h-8 shrink-0 flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="20" y1="4" x2="4" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>

              <span className="flex-1 text-white font-bold text-2xl sm:text-3xl leading-none tracking-tight">
                {p.name}
              </span>

              <GenderToggle
                gender={p.gender}
                onChange={(g) => setPlayerGender(p.id, g)}
              />
            </div>
            {i < players.length - 1 && (
              <div className="h-px bg-white/30 ml-11" />
            )}
          </div>
        ))}

        {/* Add player input */}
        {showInput && (
          <div className="flex items-center gap-3 py-3 animate-fade-in">
            <div className="w-8 h-8 shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите имя"
              className="flex-1 bg-white/20 rounded-xl px-4 py-2 outline-none text-white text-xl font-bold placeholder:text-white/50 border border-white/30 focus:border-white/60"
              maxLength={20}
            />
            <button
              onClick={handleAdd}
              className="bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-white font-bold transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Add player circular button */}
      {!showInput && (
        <div className="flex justify-center items-center py-4 shrink-0">
          <button
            onClick={() => setShowInput(true)}
            className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center active:scale-95 transition-transform"
          >
            {/* Curved text */}
            <svg
              viewBox="0 0 120 120"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <path
                  id="circlePath"
                  d="M 60,60 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0"
                />
              </defs>
              <text
                fontSize="10.5"
                fill="white"
                fontWeight="600"
                letterSpacing="1.5"
              >
                <textPath href="#circlePath" startOffset="5%">
                  ДОДАТИ НОВОГО ГРАВЦЯ •
                </textPath>
              </text>
            </svg>
            {/* Circle button */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1a2f5e] flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Start Button */}
      <div className="px-5 pt-2 shrink-0">
        <button
          onClick={() => { if (canStart) setScreen('game') }}
          disabled={!canStart}
          className={`w-full rounded-2xl py-5 sm:py-6 text-2xl sm:text-3xl font-bold tracking-wide transition-all ${
            canStart
              ? 'bg-white text-[#e94560] active:scale-[0.97]'
              : 'bg-white/40 text-white/60 cursor-not-allowed'
          }`}
        >
          {canStart ? 'Грати' : 'Мін. 2 гравці'}
        </button>
      </div>
    </div>
  )
}
