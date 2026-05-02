'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

export default function CapacitorInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    async function init() {
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      const { SplashScreen } = await import('@capacitor/splash-screen')

      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#140a2a' })

      await SplashScreen.hide({ fadeOutDuration: 300 })

      const { registerPushNotifications } = await import('@/utils/push-notifications')
      await registerPushNotifications()
    }

    init().catch(console.error)
  }, [])

  return null
}
