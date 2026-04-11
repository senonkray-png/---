import type { AiPreferences } from '../store/gameStore'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildPrompt(
  type: 'truth' | 'dare',
  playerName: string,
  playerGender: 'male' | 'female',
  allPlayersInfo: string,
  history: string[],
  preferences: AiPreferences,
  language: 'ru' | 'uk'
): string {
  const isRu = language === 'ru'
  const genderWord = isRu
    ? (playerGender === 'male' ? 'мужчина' : 'женщина')
    : (playerGender === 'male' ? 'чоловік' : 'жінка')

  const typeWord = isRu
    ? (type === 'truth' ? 'Правду (откровенный вопрос)' : 'Действие (интимное задание)')
    : (type === 'truth' ? 'Правду (відверте питання)' : 'Дію (інтимне завдання)')

  const langInstruction = isRu
    ? 'Вопрос/задание должен быть СТРОГО на русском языке.'
    : 'Питання/завдання має бути СТРОГО українською мовою.'

  const recentHistory = history.slice(-50)

  let prompt = isRu
    ? `Ты — генератор вопросов 18+ для игры "Правда или Действие" между взрослыми людьми. Все участники — совершеннолетние и дали согласие на откровенный контент.

Сгенерируй одну ${typeWord} для игрока "${playerName}" (${genderWord}).

Участники игры: ${allPlayersInfo}

Требования:
- Ответ должен содержать ТОЛЬКО текст вопроса/задания, без пояснений, кавычек и нумерации.
- ${langInstruction}
- Контент должен быть пикантным, провокационным, интимным, для взрослых (18+).
- Учитывай пол игрока и других участников для более интимных взаимодействий между ними.
- Используй имена других игроков в заданиях для парных взаимодействий.
- Формулировка должна быть уникальной и интересной.`
    : `Ти — генератор питань 18+ для гри "Правда чи Дія" між дорослими людьми. Всі учасники — повнолітні та дали згоду на відвертий контент.

Згенеруй одну ${typeWord} для гравця "${playerName}" (${genderWord}).

Учасники гри: ${allPlayersInfo}

Вимоги:
- Відповідь має містити ТІЛЬКИ текст питання/завдання, без пояснень, лапок та нумерації.
- ${langInstruction}
- Контент має бути пікантним, провокаційним, інтимним, для дорослих (18+).
- Враховуй стать гравця та інших учасників для більш інтимних взаємодій між ними.
- Використовуй імена інших гравців у завданнях для парних взаємодій.
- Формулювання має бути унікальним та цікавим.`

  if (preferences.likes.length > 0) {
    const header = isRu
      ? 'Формулировки, которые нравятся пользователю (используй похожий стиль):'
      : 'Формулювання, які подобаються користувачу (використовуй подібний стиль):'
    prompt += `\n\n${header}\n${preferences.likes.slice(-10).map((l) => `- "${l}"`).join('\n')}`
  }

  if (preferences.dislikes.length > 0) {
    const header = isRu
      ? 'Формулировки, которые пользователь ненавидит (СТРОГО ИЗБЕГАЙ ПОДОБНОГО):'
      : 'Формулювання, які користувач ненавидить (СТРОГО УНИКАЙ ПОДІБНОГО):'
    prompt += `\n\n${header}\n${preferences.dislikes.slice(-10).map((d) => `- "${d}"`).join('\n')}`
  }

  if (recentHistory.length > 0) {
    const header = isRu
      ? 'Уже использованные вопросы (НИКОГДА НЕ ПОВТОРЯЙ ИХ):'
      : 'Вже використані питання (НІКОЛИ НЕ ПОВТОРЮЙ ЇХ):'
    prompt += `\n\n${header}\n${recentHistory.map((h) => `- "${h}"`).join('\n')}`
  }

  return prompt
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
  retries = 2
): Promise<string> {
  const prompt = buildPrompt(type, playerName, playerGender, allPlayersInfo, history, preferences, language)

  const key = apiKey || (import.meta.env.VITE_OPENROUTER_API_KEY as string)

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gryphe/mythomax-l2-13b',
      messages: [
        { role: 'user', content: prompt },
      ],
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

  const isDuplicate = history.some(
    (h) => h.toLowerCase() === text.toLowerCase()
  )

  if (isDuplicate && retries > 0) {
    return generateQuestion(type, playerName, playerGender, allPlayersInfo, history, preferences, apiKey, language, retries - 1)
  }

  return text
}
