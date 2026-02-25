// 1. Pollinations.ai (무료, API 키 불필요)
async function generateWithPollinations(prompt: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`

  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Pollinations status ${response.status}`)

  return response.url || imageUrl
}

// 2. SiliconFlow (Flux Schnell, ~$0.015/장)
async function generateWithSiliconFlow(prompt: string): Promise<string> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) throw new Error('SILICONFLOW_API_KEY not set')

  const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt,
      image_size: '1024x1024',
      num_inference_steps: 4,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`SiliconFlow status ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const url = data?.images?.[0]?.url
  if (!url) throw new Error('No image URL from SiliconFlow')

  return url
}

// Pollinations → SiliconFlow 순서로 시도
export async function generateTarotImage(prompt: string): Promise<string> {
  const providers = [
    { name: 'Pollinations', fn: generateWithPollinations },
    { name: 'SiliconFlow', fn: generateWithSiliconFlow },
  ]

  for (const { name, fn } of providers) {
    try {
      const url = await fn(prompt)
      console.log(`[${name}] Image generated successfully`)
      return url
    } catch (err) {
      console.warn(`[${name}] Failed:`, err instanceof Error ? err.message : err)
    }
  }

  throw new Error('이미지 생성 실패 (Pollinations + SiliconFlow 모두 실패)')
}
