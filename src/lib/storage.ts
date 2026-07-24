import { supabase } from './supabase'

export async function uploadExerciseImage(file: File, exerciseId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${exerciseId}.${ext}`

  const { error } = await supabase.storage
    .from('exercise-images')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from('exercise-images')
    .getPublicUrl(path)

  return data.publicUrl
}
