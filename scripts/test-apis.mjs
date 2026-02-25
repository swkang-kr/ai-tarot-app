import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  process.env[key] = val
}

const results = []

// Test 1: Anthropic API
async function testClaude() {
  console.log('\n[1/3] Testing Anthropic (Claude) API...')
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.includes('your_') || key.length < 20) {
    console.log('  SKIP: ANTHROPIC_API_KEY not set or placeholder')
    return false
  }
  console.log(`  Key: ${key.slice(0, 15)}...${key.slice(-4)}`)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "hello" in JSON: {"greeting":"..."}' }]
      })
    })

    const data = await res.json()
    if (res.ok) {
      console.log('  OK:', data.content?.[0]?.text?.slice(0, 100))
      return true
    } else {
      console.log('  FAILED:', res.status, data.error?.message || JSON.stringify(data))
      return false
    }
  } catch (err) {
    console.log('  ERROR:', err.message)
    return false
  }
}

// Test 2: Fal.ai API
async function testFal() {
  console.log('\n[2/3] Testing Fal.ai API...')
  const key = process.env.FAL_API_KEY
  if (!key || key.includes('your_') || key.length < 10) {
    console.log('  SKIP: FAL_API_KEY not set or placeholder')
    return false
  }
  console.log(`  Key: ${key.slice(0, 10)}...`)

  try {
    // Just check auth by querying queue status
    const res = await fetch('https://queue.fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${key}`
      },
      body: JSON.stringify({
        prompt: 'test',
        image_size: 'square',
        num_images: 1
      })
    })

    if (res.ok || res.status === 200 || res.status === 201) {
      const data = await res.json()
      console.log('  OK: Request accepted', data.request_id ? `(request_id: ${data.request_id})` : '')
      return true
    } else {
      const data = await res.json().catch(() => ({}))
      console.log('  FAILED:', res.status, data.detail || data.message || JSON.stringify(data).slice(0, 200))
      return false
    }
  } catch (err) {
    console.log('  ERROR:', err.message)
    return false
  }
}

// Test 3: Replicate API
async function testReplicate() {
  console.log('\n[3/3] Testing Replicate API...')
  const key = process.env.REPLICATE_API_TOKEN
  if (!key || key.includes('your_') || key.length < 10) {
    console.log('  SKIP: REPLICATE_API_TOKEN not set or placeholder')
    return false
  }
  console.log(`  Key: ${key.slice(0, 10)}...`)

  try {
    // Check auth by listing models
    const res = await fetch('https://api.replicate.com/v1/account', {
      headers: { 'Authorization': `Bearer ${key}` }
    })

    if (res.ok) {
      const data = await res.json()
      console.log('  OK: Authenticated as', data.username || data.type || 'verified')
      return true
    } else {
      const data = await res.json().catch(() => ({}))
      console.log('  FAILED:', res.status, data.detail || JSON.stringify(data).slice(0, 200))
      return false
    }
  } catch (err) {
    console.log('  ERROR:', err.message)
    return false
  }
}

// Run all tests
console.log('=== AI Tarot App - API Key Test ===')
console.log('Date:', new Date().toISOString())

const claudeOk = await testClaude()
const falOk = await testFal()
const replicateOk = await testReplicate()

console.log('\n=== Results ===')
console.log(`Claude API:    ${claudeOk ? 'PASS' : 'FAIL'}`)
console.log(`Fal.ai API:    ${falOk ? 'PASS' : 'FAIL'}`)
console.log(`Replicate API: ${replicateOk ? 'PASS' : 'FAIL'}`)

if (!claudeOk) {
  console.log('\nClaude API failed - text generation will not work.')
  console.log('Check: https://console.anthropic.com/settings/keys')
}
if (!falOk && !replicateOk) {
  console.log('\nBoth image APIs failed - image generation will not work.')
  console.log('Check Fal.ai: https://fal.ai/dashboard/keys')
  console.log('Check Replicate: https://replicate.com/account/api-tokens')
}
