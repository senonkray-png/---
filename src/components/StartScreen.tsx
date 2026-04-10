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
    <div className="flex flex-col items-center min-h-dvh px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <Flame className="w-16 h-16 text-[var(--accent-pink)] mx-auto mb-4" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] bg-clip-text text-transparent">
          Правда или Действие
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">18+ Edition</p>
      </div>

      {/* Players */}
      <div className="w-full max-w-sm space-y-3 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-secondary)]">Игроки</h2>
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-[var(--bg-card)] rounded-xl px-4 py-3 animate-fade-in"
          >
            <span className="text-[var(--text-primary)]">{p.name}</span>
            <button
              onClick={() => removePlayer(p.id)}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors"
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
              className="flex-1 bg-[var(--bg-card)] rounded-xl px-4 py-3 outline-none border border-[var(--accent-purple)]/30 focus:border-[var(--accent-purple)] transition-colors placeholder:text-[var(--text-secondary)]"
              maxLength={20}
            />
            <button
              onClick={handleAdd}
              className="bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 rounded-xl px-4 py-3 font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card)]/80 rounded-xl px-4 py-3 text-[var(--accent-purple)] border border-dashed border-[var(--accent-purple)]/30 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Добавить игрока
          </button>
        )}
      </div>

      {/* Random Wheel Toggle */}
      <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-xl px-4 py-3 flex items-center justify-between mb-6">
        <span className="text-[var(--text-primary)]">🎡 Рулетка</span>
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

      {/* Buttons */}
      <div className="w-full max-w-sm space-y-3 mt-auto">
        <button
          onClick={() => setScreen('settings')}
          className="w-full flex items-center justify-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 rounded-xl px-4 py-3 text-[var(--text-secondary)] transition-colors"
        >
          <Settings className="w-5 h-5" />
          Настройки
        </button>

        <button
          onClick={() => {
            if (canStart) setScreen('game')
          }}
          disabled={!canStart}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-bold transition-all ${
            canStart
              ? 'bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] hover:opacity-90 pulse-glow'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-6 h-6" />
          СТАРТ
        </button>
        {!canStart && (
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Добавьте минимум 2 игроков
          </p>
        )}
      </div>
    </div>
  )
}
