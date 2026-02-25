'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export default function PushNotificationButton() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
      setSupported(true)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {
      // ignore
    }
  }

  const handleToggle = async () => {
    if (!VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setSubscribed(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
        setSubscribed(true)
      }
    } catch (err) {
      console.error('Push toggle error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
        subscribed
          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
          : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/15'
      } disabled:opacity-50`}
    >
      <span>{subscribed ? '🔔' : '🔕'}</span>
      <span>{loading ? '처리 중…' : subscribed ? '알림 켜짐' : '매일 운세 알림 받기'}</span>
    </motion.button>
  )
}
