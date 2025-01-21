'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }

    function handleOffline() {
      setIsOffline(true)
    }

    function handleBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
    }
    setDeferredPrompt(null)
  }

  return (
    <AnimatePresence>
      {(isOffline || showInstallPrompt) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-0 left-0 right-0 ${isOffline ? 'bg-red-500' : 'bg-blue-500'} text-white p-4 text-center flex justify-center items-center`}
        >
          {isOffline ? (
            <span>Você está offline. Algumas funcionalidades podem estar indisponíveis.</span>
          ) : showInstallPrompt && (
            <div className="flex items-center gap-2">
              <span>Instale nosso app para uma melhor experiência</span>
              <button
                onClick={handleInstallClick}
                className="px-4 py-1 bg-white text-blue-500 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Instalar
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}