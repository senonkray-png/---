import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loadFeedback, saveFeedback } from '../services/supabaseService'

export interface Player {
  id: string
  name: string
  gender: 'male' | 'female'
}

export interface CustomQuestion {
  id: string
  type: 'truth' | 'dare'
  text: string
  level: 1 | 2 | 3
  used: boolean
}

export interface Settings {
  randomWheel: boolean
  customInterval: number
  apiKey: string
  language: 'ru' | 'uk'
  level1Interval: number
  level2Interval: number
  level3Interval: number
  level1Enabled: boolean
  level2Enabled: boolean
  level3Enabled: boolean
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
  addCustomQuestion: (type: 'truth' | 'dare', text: string, level: 1 | 2 | 3) => void
  removeCustomQuestion: (id: string) => void
  markCustomQuestionUsed: (id: string) => void
  resetCustomQuestions: () => void
  resetLevelQuestions: (level: 1 | 2 | 3) => void

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
        level1Interval: 3,
        level2Interval: 6,
        level3Interval: 10,
        level1Enabled: true,
        level2Enabled: true,
        level3Enabled: true,
      },
      customQuestions: [
        { id: 'l1d1',  type: 'dare', level: 1, used: false, text: 'Встань посередине комнаты и станцуй энергичный танец под любую песню, которую выберут девушки, минимум 30 секунд.' },
        { id: 'l1d2',  type: 'dare', level: 1, used: false, text: 'Дай {partner} полностью накрасить тебе лицо яркой женской косметикой и не смывать 10 минут.' },
        { id: 'l1d3',  type: 'dare', level: 1, used: false, text: 'Спой песню «Кукушка» максимально высоким голосом, стоя на одном колене.' },
        { id: 'l1d4',  type: 'dare', level: 1, used: false, text: 'Сделай 20 отжиманий, а {partner} будет считать вслух и хлопать в ладоши при каждом.' },
        { id: 'l1d5',  type: 'dare', level: 1, used: false, text: 'Расскажи всем самую стыдную историю из детства, которую ты обычно никому не говоришь.' },
        { id: 'l1d6',  type: 'dare', level: 1, used: false, text: 'Подойди к {partner}, обними её за талию и поцелуй нежно в щёку, задержавшись на пару секунд.' },
        { id: 'l1d7',  type: 'dare', level: 1, used: false, text: 'Подойди к {partner}, возьми её за руку, притяни к себе и медленно покрути в танце, прижимаясь ближе.' },
        { id: 'l1d8',  type: 'dare', level: 1, used: false, text: 'Подойди к {partner}, сядь рядом, положи руку ей на бедро и шепни на ушко что-то очень пошленькое.' },
        { id: 'l1d9',  type: 'dare', level: 1, used: false, text: 'Подойди к {partner}, обними её сзади, прижмись и поцелуй в шею один раз, не снимая одежду.' },
        { id: 'l1d10', type: 'dare', level: 1, used: false, text: 'Подойди к {partner}, посади её себе на колени боком, обними за талию и просто держи, глядя в глаза 20 секунд.' },
        { id: 'l1d11', type: 'dare', level: 1, used: false, text: 'Дай {partner} завязать тебе глаза и покормить тебя любым продуктом из холодильника вслепую.' },
        { id: 'l1d12', type: 'dare', level: 1, used: false, text: 'Изобрази пантомимой, как ты просыпаешься, чистишь зубы и готовишь завтрак.' },
        { id: 'l1d13', type: 'dare', level: 1, used: false, text: 'Прочитай последнее отправленное сообщение в своём телефоне вслух всем присутствующим.' },
        { id: 'l1d14', type: 'dare', level: 1, used: false, text: 'Сделай массаж плеч {partner} в течение одной минуты.' },
        { id: 'l1d15', type: 'dare', level: 1, used: false, text: 'Надень на голову трусы вместо шапки и походи так по комнате, пока все не отсмеются.' },
        // Level 2
        { id: 'l2d1', type: 'dare', level: 2, used: false, text: 'Подойди к {partner}, нежно обними её за талию, прижми к себе и целуй медленно и глубоко в губы, не отрываясь минимум 30 секунд.' },
        { id: 'l2d2', type: 'dare', level: 2, used: false, text: 'Подойди к {partner}, сними с неё топ, оставь в лифчике, обними сзади и целуй в шею, проводя руками по её животу.' },
        { id: 'l2d3', type: 'dare', level: 2, used: false, text: 'Посади {partner} себе на колени лицом к себе, крепко обними за талию и целуй её в губы, медленно проводя руками по спине.' },
        { id: 'l2d4', type: 'dare', level: 2, used: false, text: 'Подойди к {partner}, поставь её спиной к себе, прижми к стене и страстно целуй в шею и плечи, пока руки гладят её бёдра.' },
        { id: 'l2d5', type: 'dare', level: 2, used: false, text: 'Подойди к {partner}, сними с неё лифчик, обними её спереди и целуй в губы, прижимаясь грудь к груди.' },
        // Level 3
        { id: 'l3d1', type: 'dare', level: 3, used: false, text: 'Подойди к {partner}, медленно сними с неё топ и лифчик, прижми её спиной к себе и целуй в шею, пока твои руки ласкают её голую грудь. Заставь её тихо стонать тебе на ухо.' },
        { id: 'l3d2', type: 'dare', level: 3, used: false, text: 'Подойди к {partner}, посади её себе на колени лицом к себе, сними с неё шорты и страстно целуй, пока твои руки крепко сжимают её попу.' },
        { id: 'l3d3', type: 'dare', level: 3, used: false, text: 'Подойди к {partner}, поставь её на колени перед собой, сними с неё топ и заставь её тереться грудью о твою ширинку, целуя её сверху вниз по животу.' },
        { id: 'l3d4', type: 'dare', level: 3, used: false, text: 'Подойди к {partner}, медленно сними с неё топ, прижми её к стене и целуй страстно в шею, пока твои руки исследуют её грудь. Не останавливайся, пока она не начнёт тяжело дышать.' },
        // Level 1 — Truth
        { id: 'l1t1',  type: 'truth', level: 1, used: false, text: 'Кто из присутствующих тебе больше всего нравится внешне?' },
        { id: 'l1t2',  type: 'truth', level: 1, used: false, text: 'Какой твой самый неловкий момент на свидании?' },
        { id: 'l1t3',  type: 'truth', level: 1, used: false, text: 'Кого из знаменитостей ты считаешь очень привлекательным?' },
        { id: 'l1t4',  type: 'truth', level: 1, used: false, text: 'Какой самый глупый поступок ты делал из-за {partner}?' },
        { id: 'l1t5',  type: 'truth', level: 1, used: false, text: 'Было ли у тебя когда-нибудь свидание вслепую?' },
        { id: 'l1t6',  type: 'truth', level: 1, used: false, text: 'Какой твой любимый способ проводить вечер дома?' },
        { id: 'l1t7',  type: 'truth', level: 1, used: false, text: 'Что ты обычно делаешь, когда остаёшься один дома?' },
        { id: 'l1t8',  type: 'truth', level: 1, used: false, text: 'Какой самый странный комплимент тебе говорили?' },
        { id: 'l1t9',  type: 'truth', level: 1, used: false, text: 'Какой твой самый любимый фильм или сериал для просмотра с {partner}?' },
        { id: 'l1t10', type: 'truth', level: 1, used: false, text: 'Что ты больше всего ценишь в людях?' },
        // Level 2 — Truth
        { id: 'l2t1', type: 'truth', level: 2, used: false, text: 'Кого из присутствующих ты бы хотел поцеловать?' },
        { id: 'l2t2', type: 'truth', level: 2, used: false, text: 'Был ли у тебя секс на первом свидании?' },
        { id: 'l2t3', type: 'truth', level: 2, used: false, text: 'Какой самый смелый поступок ты совершал ради {partner}?' },
        { id: 'l2t4', type: 'truth', level: 2, used: false, text: 'О ком из бывших ты иногда вспоминаешь?' },
        { id: 'l2t5', type: 'truth', level: 2, used: false, text: 'Что в тебе {partner} находит самым привлекательным?' },
        // Level 3 — Truth
        { id: 'l3t1', type: 'truth', level: 3, used: false, text: 'Кого из этой комнаты ты бы хотел увидеть полностью голым?' },
        { id: 'l3t2', type: 'truth', level: 3, used: false, text: 'Какой твой самый сильный сексуальный фетиш?' },
        { id: 'l3t3', type: 'truth', level: 3, used: false, text: 'Был ли у тебя опыт с двумя {partner} одновременно?' },
        { id: 'l3t4', type: 'truth', level: 3, used: false, text: 'Что самое пошленькое ты когда-либо делал с {partner}?' },
        { id: 'l3t5', type: 'truth', level: 3, used: false, text: 'Кого из присутствующих ты представлял в постели?' },
      ],
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

      addCustomQuestion: (type, text, level) =>
        set((s) => ({
          customQuestions: [...s.customQuestions, { id: crypto.randomUUID(), type, text, level, used: false }],
        })),

      removeCustomQuestion: (id) =>
        set((s) => ({
          customQuestions: s.customQuestions.filter((q) => q.id !== id),
        })),

      markCustomQuestionUsed: (id) =>
        set((s) => ({
          customQuestions: s.customQuestions.map((q) =>
            q.id === id ? { ...q, used: true } : q
          ),
        })),

      resetCustomQuestions: () =>
        set((s) => ({
          customQuestions: s.customQuestions.map((q) => ({ ...q, used: false })),
        })),

      resetLevelQuestions: (level) =>
        set((s) => ({
          customQuestions: s.customQuestions.map((q) =>
            q.level === level ? { ...q, used: false } : q
          ),
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
      name: 'truth-or-dare-storage-v2',
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
