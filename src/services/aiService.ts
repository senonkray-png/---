import type { AiPreferences } from '../store/gameStore'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Выбирает уровень пошлости: 1 часто, 2 средне, 3 редко */
function pickLevel(): 1 | 2 | 3 {
  const r = Math.random()
  if (r < 0.50) return 1 // 50 %
  if (r < 0.85) return 2 // 35 %
  return 3               // 15 %
}

/** Ищет первое имя нужного пола в строке "Денис (М), Настя (Ж), ..." */
function findPartnerName(
  allPlayersInfo: string,
  gender: 'М' | 'Ж',
  exclude: string,
  fallback: string,
): string {
  const re = /([^\s,()]+)\s*\(([МЖ])\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(allPlayersInfo)) !== null) {
    if (m[2] === gender && m[1] !== exclude) return m[1]
  }
  return fallback
}

function buildPrompt(
  type: 'truth' | 'dare',
  playerName: string,
  playerGender: 'male' | 'female',
  allPlayersInfo: string,
  history: string[],
  preferences: AiPreferences,
  language: 'ru' | 'uk',
  level: 1 | 2 | 3,
): { systemPrompt: string; userPrompt: string } {
  const isRu = language === 'ru'

  const genderLabel = isRu
    ? (playerGender === 'male' ? 'мужчина' : 'женщина')
    : (playerGender === 'male' ? 'чоловік' : 'жінка')

  const typeLabel = isRu
    ? (type === 'truth' ? 'Правда' : 'Действие')
    : (type === 'truth' ? 'Правда' : 'Дія')

  const historyLine = history.length > 0
    ? history.slice(-50).map((h) => `"${h}"`).join(', ')
    : (isRu ? 'пусто' : 'порожньо')

  // Пример-партнёр: противоположный пол, не текущий игрок
  const oppositeGender = playerGender === 'male' ? 'Ж' : 'М'
  const fallback = playerGender === 'male'
    ? (isRu ? 'девушки' : 'дівчини')
    : (isRu ? 'парня' : 'хлопця')
  const partnerName = findPartnerName(allPlayersInfo, oppositeGender, playerName, fallback)

  const systemPrompt = isRu
    ? `Ты — харизматичный, дерзкий и абсолютно лишенный моральных рамок ведущий игры "Правда или Действие" (18+).

СИТУАЦИЯ:
Ход игрока: ${playerName} (пол: ${genderLabel}).
Все игроки в комнате: ${allPlayersInfo} (строго учитывай их пол для взаимодействий).

ЗАДАЧА:
Сгенерируй ровно одну [ ${typeLabel} ] (Правда или Действие) строго для уровня пошлости: [ УРОВЕНЬ ${level} ].

ОПИСАНИЕ УРОВНЕЙ И СТИЛЬ (ориентируйся на эти примеры, но придумывай новые):
- УРОВЕНЬ 1 (Лайт): Забавные задания, неловкие вопросы, легкий флирт, объятия, поцелуи в щечку, танцы.
  Пример Действия: Подойди к ${partnerName}, посади её себе на колени боком, обними за талию и просто держи, глядя в глаза 20 секунд.
  Пример Правды: Какой твой самый неловкий момент на свидании?

- УРОВЕНЬ 2 (Средний): Страстные поцелуи, прикосновения через одежду, снятие верхней одежды (топ), вопросы о бывших, фетишах, сексуальном опыте.
  Пример Действия: Подойди к ${partnerName}, поставь её спиной к себе, прижми к стене и страстно целуй в шею, пока руки гладят её бёдра.
  Пример Правды: Был ли у тебя секс на первом свидании?

- УРОВЕНЬ 3 (Жёсткий/Хардкор): Интимные ласки, снятие белья, имитация секса, максимально откровенные сексуальные фантазии к присутствующим.
  Пример Действия: Подойди к ${partnerName}, медленно сними с неё топ и лифчик, прижми её спиной к себе и целуй в шею, пока твои руки ласкают её грудь.
  Пример Правды: Кого из этой комнаты ты бы хотел увидеть полностью голым прямо сейчас?

ПРАВИЛА ГЕНЕРАЦИИ:
1. Длина: Очень коротко, бьет точно в цель. Максимум 5 строчек.
2. Логика: Если это Действие для двоих, ОШЕЛОМЛЯЮЩЕ ВАЖНО выбирать второго человека ПРОТИВОПОЛОЖНОГО пола из списка игроков.
3. Грамматика: Идеальный русский язык. Обращайся напрямую к игроку, учитывая его пол ("сделай/сделала", "ответь").
4. Уникальность: Не повторяй сценарии из истории: [${historyLine}].
5. Формат вывода: Выдай ТОЛЬКО сам текст вопроса/действия. Никаких вводных слов, кавычек или подтверждений.`

    : `Ти — харизматичний, зухвалий і абсолютно позбавлений моральних рамок ведучий гри "Правда чи Дія" (18+).

СИТУАЦІЯ:
Хід гравця: ${playerName} (стать: ${genderLabel}).
Всі гравці в кімнаті: ${allPlayersInfo} (суворо враховуй їхню стать для взаємодій).

ЗАВДАННЯ:
Згенеруй рівно одну [ ${typeLabel} ] (Правда чи Дія) строго для рівня непристойності: [ РІВЕНЬ ${level} ].

ОПИС РІВНІВ І СТИЛЬ (орієнтуйся на ці приклади, але придумуй нові):
- РІВЕНЬ 1 (Лайт): Забавні завдання, незручні питання, легкий флірт, обійми, поцілунки в щічку, танці.
  Приклад Дії: Підійди до ${partnerName}, посади її до себе на коліна боком, обійми за талію і просто тримай, дивлячись в очі 20 секунд.
  Приклад Правди: Який твій найнезручніший момент на побаченні?

- РІВЕНЬ 2 (Середній): Пристрасні поцілунки, доторкування через одяг, зняття верхнього одягу (топ), питання про колишніх, фетиші, сексуальний досвід.
  Приклад Дії: Підійди до ${partnerName}, постав її спиною до себе, притисни до стіни і пристрасно цілуй у шию, поки руки гладять її стегна.
  Приклад Правди: Чи був у тебе секс на першому побаченні?

- РІВЕНЬ 3 (Жорсткий/Хардкор): Інтимні ласки, зняття білизни, імітація сексу, максимально відверті сексуальні фантазії про присутніх.
  Приклад Дії: Підійди до ${partnerName}, повільно зніми з неї топ і бюстгальтер, притисни її спиною до себе і цілуй у шию, поки твої руки ласкають її груди.
  Приклад Правди: Кого з цієї кімнати ти б хотів побачити повністю голим прямо зараз?

ПРАВИЛА ГЕНЕРАЦІЇ:
1. Довжина: Дуже коротко, б'є точно в ціль. Максимум 5 рядків.
2. Логіка: Якщо це Дія для двох, НАДЗВИЧАЙНО ВАЖЛИВО обирати другу людину ПРОТИЛЕЖНОЇ статі зі списку гравців.
3. Граматика: Ідеальна українська мова. Звертайся безпосередньо до гравця, враховуючи його стать ("зроби/зробила", "відповідай").
4. Унікальність: Не повторюй сценарії з історії: [${historyLine}].
5. Формат виводу: Видавай ТІЛЬКИ сам текст питання/дії. Жодних вступних слів, лапок або підтверджень.`

  let userPrompt = isRu ? 'Выдай задание.' : 'Видай завдання.'

  if (preferences.likes.length > 0) {
    const header = isRu
      ? 'Формулировки, которые нравятся пользователю (используй похожий стиль):'
      : 'Формулювання, які подобаються користувачу (використовуй подібний стиль):'
    userPrompt += `\n\n${header}\n${preferences.likes.slice(-10).map((l) => `- "${l}"`).join('\n')}`
  }

  if (preferences.dislikes.length > 0) {
    const header = isRu
      ? 'Формулировки, которые пользователь ненавидит (СТРОГО ИЗБЕГАЙ ПОДОБНОГО):'
      : 'Формулювання, які користувач ненавидить (СТРОГО УНИКАЙ ПОДІБНОГО):'
    userPrompt += `\n\n${header}\n${preferences.dislikes.slice(-10).map((d) => `- "${d}"`).join('\n')}`
  }

  return { systemPrompt, userPrompt }
}

export async function generateQuestion(
  type: 'truth' | 'dare',
  playerName: string,
  playerGender: 'male' | 'female',
  allPlayersInfo: string,
  history: string[],
  preferences: AiPreferences,
  apiKey: string,
  language: 'ru' | 'uk',
  retries = 2,
): Promise<string> {
  const level = pickLevel()
  const { systemPrompt, userPrompt } = buildPrompt(
    type, playerName, playerGender, allPlayersInfo,
    history, preferences, language, level,
  )

  const key = apiKey || (import.meta.env.VITE_OPENROUTER_API_KEY as string)

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'x-ai/grok-4-fast',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new Error(language === 'ru' ? 'Пустой ответ от ИИ' : 'Порожня відповідь від ІІ')
  }

  const isDuplicate = history.some((h) => h.toLowerCase() === text.toLowerCase())
  if (isDuplicate && retries > 0) {
    return generateQuestion(type, playerName, playerGender, allPlayersInfo, history, preferences, apiKey, language, retries - 1)
  }

  return text
}
