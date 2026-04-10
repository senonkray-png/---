import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { UserPlus, X, Settings, Play, Flame } from 'lucide-react'

export default function StartScreen() {
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const { players, addPlayer, removePlayer, settings, updateSettings, setScreen } = useGameStore()

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
    <div className="flex flex-col h-dvh w-full max-w-lg mx-auto px-4 pt-safe-top pb-safe-bottom" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>

      {/* Header */}
      <div className="text-center py-4 sm:py-6 animate-fade-in shrink-0">
        <Flame className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--accent-pink)] mx-auto mb-2 sm:mb-3" />
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] bg-clip-text text-transparent">
          Правда или Действие
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 text-xs sm:text-sm">18+ Edition</p>
      </div>

      {/* Players */}
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 py-2">
        <h2 className="text-sm sm:text-base font-semibold text-[var(--text-secondary)] px-1">Игроки</h2>
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-[var(--bg-card)] rounded-xl px-4 py-3 sm:py-4 animate-fade-in"
          >
            <span className="text-[var(--text-primary)] text-sm sm:text-base">{p.name}</span>
            <button
              onClick={() => removePlayer(p.id)}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        {showInput ? (
          <div className="flex gap-2 animate-fade-in">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите имя"
              className="flex-1 bg-[var(--bg-card)] rounded-xl px-4 py-3 sm:py-4 outline-none border border-[var(--accent-purple)]/30 focus:border-[var(--accent-purple)] transition-colors placeholder:text-[var(--text-secondary)] text-sm sm:text-base"
              maxLength={20}
            />
            <button
              onClick={handleAdd}
              className="bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 rounded-xl px-5 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card)]/80 rounded-xl px-4 py-3 sm:py-4 text-[var(--accent-purple)] border border-dashed border-[var(--accent-purple)]/30 transition-colors text-sm sm:text-base"
          >
            <UserPlus className="w-5 h-5" />
            Добавить игрока
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 space-y-3 pt-3 sm:pt-4">
        {/* Random Wheel Toggle */}
        <div className="bg-[var(--bg-card)] rounded-xl px-4 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-[var(--text-primary)] text-sm sm:text-base">🎡 Рулетка</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.randomWheel}
              onChange={(e) => updateSettings({ randomWheel: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-purple)]"></div>
          </label>
        </div>

        <button
          onClick={() => setScreen('settings')}
          className="w-full flex items-center justify-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 rounded-xl px-4 py-3 sm:py-4 text-[var(--text-secondary)] transition-colors text-sm sm:text-base"
        >
          <Settings className="w-5 h-5" />
          Настройки
        </button>

        <button
          onClick={() => { if (canStart) setScreen('game') }}
          disabled={!canStart}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-4 sm:py-5 text-base sm:text-lg font-bold transition-all ${
            canStart
              ? 'bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] hover:opacity-90 pulse-glow'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6" />
          СТАРТ
        </button>

        {!canStart && (
          <p className="text-center text-xs sm:text-sm text-[var(--text-secondary)]">
            Добавьте минимум 2 игроков
          </p>
        )}
      </div>
    </div>
  )
}
