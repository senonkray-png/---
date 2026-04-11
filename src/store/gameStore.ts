import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loadFeedback, saveFeedback } from '../services/supabaseService'

export interface Player {
  id: string
  name: string
  gender: 'male' | 'female'
}

export interface CustomQuestion {
  type: 'truth' | 'dare'
  text: string
  used: boolean
}

export interface Settings {
  randomWheel: boolean
  customInterval: number
  apiKey: string
  language: 'ru' | 'uk'
}

export interface AiPreferences {
  likes: string[]
  dislikes: string[]
}

export interface TurnState {
  currentPlayerIndex: number
  aiCounter: number
}

interface GameState {
  players: Player[]
  settings: Settings
  customQuestions: CustomQuestion[]
  history: string[]
  aiPreferences: AiPreferences
  turnState: TurnState
  screen: 'start' | 'settings' | 'game'

  // Player actions
  addPlayer: (name: string) => void
  removePlayer: (id: string) => void
  setPlayerGender: (id: string, gender: 'male' | 'female') => void

  // Settings
  updateSettings: (s: Partial<Settings>) => void

  // Custom questions
  addCustomQuestion: (type: 'truth' | 'dare', text: string) => void
  removeCustomQuestion: (index: number) => void
  markCustomQuestionUsed: (index: number) => void
  resetCustomQuestions: () => void

  // History
  addToHistory: (text: string) => void

  // AI preferences
  addLike: (text: string) => void
  addDislike: (text: string) => void
  loadPreferences: () => Promise<void>

  // Turn
  nextTurn: () => void
  setCurrentPlayer: (index: number) => void
  incrementAiCounter: () => void
  resetGame: () => void

  // Navigation
  setScreen: (s: 'start' | 'settings' | 'game') => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [],
      settings: {
        randomWheel: false,
        customInterval: 5,
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY ?? '',
        language: 'ru',
      },
      customQuestions: [],
      history: [],
      aiPreferences: { likes: [], dislikes: [] },
      turnState: { currentPlayerIndex: 0, aiCounter: 0 },
      screen: 'start',

      addPlayer: (name) =>
        set((s) => ({
          players: [...s.players, { id: crypto.randomUUID(), name, gender: 'male' }],
        })),

      setPlayerGender: (id, gender) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, gender } : p)),
        })),

      removePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
        })),

      updateSettings: (partial) =>
        set((s) => ({
          settings: { ...s.settings, ...partial },
        })),

      addCustomQuestion: (type, text) =>
        set((s) => ({
          customQuestions: [...s.customQuestions, { type, text, used: false }],
        })),

      removeCustomQuestion: (index) =>
        set((s) => ({
          customQuestions: s.customQuestions.filter((_, i) => i !== index),
        })),

      markCustomQuestionUsed: (index) =>
        set((s) => ({
          customQuestions: s.customQuestions.map((q, i) =>
            i === index ? { ...q, used: true } : q
          ),
        })),

      resetCustomQuestions: () =>
        set((s) => ({
          customQuestions: s.customQuestions.map((q) => ({ ...q, used: false })),
        })),

      addToHistory: (text) =>
        set((s) => ({
          history: [...s.history.slice(-99), text],
        })),

      addLike: (text) => {
        set((s) => ({
          aiPreferences: {
            ...s.aiPreferences,
            likes: s.aiPreferences.likes.includes(text)
              ? s.aiPreferences.likes
              : [...s.aiPreferences.likes.slice(-49), text],
            // remove from dislikes if it was there
            dislikes: s.aiPreferences.dislikes.filter((d) => d !== text),
          },
        }))
        saveFeedback(text, 'like')
      },

      addDislike: (text) => {
        set((s) => ({
          aiPreferences: {
            ...s.aiPreferences,
            dislikes: s.aiPreferences.dislikes.includes(text)
              ? s.aiPreferences.dislikes
              : [...s.aiPreferences.dislikes.slice(-49), text],
            // remove from likes if it was there
            likes: s.aiPreferences.likes.filter((l) => l !== text),
          },
        }))
        saveFeedback(text, 'dislike')
      },

      loadPreferences: async () => {
        const remote = await loadFeedback()
        if (remote.likes.length === 0 && remote.dislikes.length === 0) return
        set((s) => ({
          aiPreferences: {
            likes: Array.from(new Set([...s.aiPreferences.likes, ...remote.likes])).slice(-50),
            dislikes: Array.from(new Set([...s.aiPreferences.dislikes, ...remote.dislikes])).slice(-50),
          },
        }))
      },

      nextTurn: () => {
        const { players, turnState, settings } = get()
        if (players.length === 0) return
        if (settings.randomWheel) return // roulette handles it
        set({
          turnState: {
            ...turnState,
            currentPlayerIndex:
              (turnState.currentPlayerIndex + 1) % players.length,
          },
        })
      },

      setCurrentPlayer: (index) =>
        set((s) => ({
          turnState: { ...s.turnState, currentPlayerIndex: index },
        })),

      incrementAiCounter: () =>
        set((s) => ({
          turnState: {
            ...s.turnState,
            aiCounter: s.turnState.aiCounter + 1,
          },
        })),

      resetGame: () =>
        set({
          turnState: { currentPlayerIndex: 0, aiCounter: 0 },
          history: [],
          screen: 'start',
        }),

      setScreen: (screen) => set({ screen }),
    }),
    {
      name: 'truth-or-dare-storage',
      partialize: (state) => ({
        players: state.players,
        settings: state.settings,
        customQuestions: state.customQuestions,
        history: state.history,
        aiPreferences: state.aiPreferences,
      }),
    }
  )
)
