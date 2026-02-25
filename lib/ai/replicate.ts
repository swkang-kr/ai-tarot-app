import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

export async function generateTarotImageFallback(
  prompt: string
): Promise<string> {
  const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
    input: {
      prompt: prompt,
      aspect_ratio: '1:1',
      output_format: 'png',
      output_quality: 90,
      safety_tolerance: 2
    }
  })

  console.log('[Replicate] Raw output type:', typeof output, Array.isArray(output) ? 'array' : '')

  // Handle various Replicate output formats:
  // - string URL directly
  // - FileOutput object with .url()
  // - array of URLs or FileOutput objects
  let imageUrl: string | undefined

  if (typeof output === 'string') {
    imageUrl = output
  } else if (output && typeof output === 'object') {
    if ('url' in output && typeof (output as any).url === 'function') {
      imageUrl = (output as any).url()
    } else if ('url' in output && typeof (output as any).url === 'string') {
      imageUrl = (output as any).url
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0]
      if (typeof first === 'string') {
        imageUrl = first
      } else if (first && typeof first === 'object' && 'url' in first) {
        imageUrl = typeof first.url === 'function' ? first.url() : first.url
      }
    }
    // FileOutput can be coerced to string (URL)
    if (!imageUrl && typeof output.toString === 'function') {
      const str = output.toString()
      if (str.startsWith('http')) {
        imageUrl = str
      }
    }
  }

  if (!imageUrl) {
    console.error('[Replicate] Unexpected output:', JSON.stringify(output, null, 2)?.slice(0, 500))
    throw new Error('Invalid Replicate output format')
  }

  return imageUrl
}
