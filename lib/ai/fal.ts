import * as fal from '@fal-ai/serverless-client'

fal.config({
  credentials: process.env.FAL_API_KEY!
})

interface FalImage {
  url: string
  width?: number
  height?: number
}

interface FalResult {
  images?: FalImage[]
  data?: { images?: FalImage[] }
}

export async function generateTarotImage(prompt: string): Promise<string> {
  const result = (await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: prompt,
      image_size: 'square_hd',
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'png'
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        console.log('Fal.ai progress:', update.logs)
      }
    }
  })) as FalResult

  // Handle both response formats: { images: [...] } or { data: { images: [...] } }
  const images = result.images || result.data?.images

  if (!images || images.length === 0) {
    console.error('Fal.ai raw result:', JSON.stringify(result).slice(0, 500))
    throw new Error('No image generated from Fal.ai')
  }

  return images[0].url
}
