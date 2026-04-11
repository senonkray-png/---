import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type FeedbackType = 'like' | 'dislike'

/** Загружает все лайки и дизлайки из БД */
export async function loadFeedback(): Promise<{ likes: string[]; dislikes: string[] }> {
  const { data, error } = await supabase
    .from('ai_feedback')
    .select('text, type')
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.warn('[supabase] loadFeedback error:', error?.message)
    return { likes: [], dislikes: [] }
  }

  const likes = data.filter((r) => r.type === 'like').map((r) => r.text as string)
  const dislikes = data.filter((r) => r.type === 'dislike').map((r) => r.text as string)
  return { likes, dislikes }
}

/** Сохраняет один отзыв */
export async function saveFeedback(text: string, type: FeedbackType): Promise<void> {
  const { error } = await supabase
    .from('ai_feedback')
    .upsert({ text, type }, { onConflict: 'text' })

  if (error) console.warn('[supabase] saveFeedback error:', error.message)
}

/** Удаляет отзыв по тексту (если пользователь передумал) */
export async function deleteFeedback(text: string): Promise<void> {
  const { error } = await supabase
    .from('ai_feedback')
    .delete()
    .eq('text', text)

  if (error) console.warn('[supabase] deleteFeedback error:', error.message)
}
