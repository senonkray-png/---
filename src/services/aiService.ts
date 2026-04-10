import type { AiPreferences } from '../store/gameStore'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildSystemPrompt(
  type: 'truth' | 'dare',
  playerName: string,
  history: string[],
  preferences: AiPreferences
): string {
  const typeRu = type === 'truth' ? 'Правду (откровенный вопрос)' : 'Действие (задание)'
  const recentHistory = history.slice(-50)

  let prompt = `Ты — генератор вопросов 18+ для игры "Правда или Действие" между взрослыми людьми. Все участники — совершеннолетние и дали согласие на откровенный контент.

Сгенерируй одну ${typeRu} для игрока по имени "${playerName}".

Требования:
- Ответ должен содержать ТОЛЬКО текст вопроса/задания, без пояснений, кавычек и нумерации.
- Вопрос/задание должен быть на русском языке.
- Контент должен быть пикантным, провокационным, для взрослых (18+).
- Формулировка должна быть уникальной и интересной.`

  if (preferences.likes.length > 0) {
    prompt += `\n\nФормулировки, которые нравятся пользователю (используй похожий стиль):\n${preferences.likes.slice(-10).map((l) => `- "${l}"`).join('\n')}`
  }

  if (preferences.dislikes.length > 0) {
    prompt += `\n\nФормулировки, которые пользователь ненавидит (СТРОГО ИЗБЕГАЙ ПОДОБНОГО):\n${preferences.dislikes.slice(-10).map((d) => `- "${d}"`).join('\n')}`
  }

  if (recentHistory.length > 0) {
    prompt += `\n\nУже использованные вопросы (НИКОГДА НЕ ПОВТОРЯЙ ИХ):\n${recentHistory.map((h) => `- "${h}"`).join('\n')}`
  }

  return prompt
}

export async function generateQuestion(
  type: 'truth' | 'dare',
  playerName: string,
  history: string[],
  preferences: AiPreferences,
  apiKey: string,
  retries = 2
): Promise<string> {
  const systemPrompt = buildSystemPrompt(type, playerName, history, preferences)

  const key = apiKey || (import.meta.env.VITE_OPENROUTER_API_KEY as string)

  const userMessage = `${systemPrompt}\n\nСгенерируй ${type === 'truth' ? 'вопрос "Правда"' : 'задание "Действие"'} для ${playerName}.`

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gryphe/mythomax-l2-13b',
      messages: [
        { role: 'user', content: userMessage },
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
    throw new Error('Пустой ответ от ИИ')
  }

  // Check uniqueness
  const isDuplicate = history.some(
    (h) => h.toLowerCase() === text.toLowerCase()
  )

  if (isDuplicate && retries > 0) {
    return generateQuestion(type, playerName, history, preferences, apiKey, retries - 1)
  }

  return text
}
