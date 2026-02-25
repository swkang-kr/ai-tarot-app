import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveImageToStorage(
  imageUrl: string,
  userId: string
): Promise<string> {
  const response = await fetch(imageUrl)
  const buffer = await response.arrayBuffer()

  const fileName = `${userId}/${Date.now()}.png`
  const { error } = await supabase.storage
    .from('tarot-images')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false
    })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from('tarot-images').getPublicUrl(fileName)

  return publicUrl
}
