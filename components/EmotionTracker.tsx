import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const emotions = {
  veryUnpleasant: [
    'Estressado', 'Ansioso', 'Irritado', 'Triste', 'Frustrado',
    'Deprimido', 'Culpado', 'Desmotivado', 'Preocupado', 'Sobrecarregado', 'Solitário'
  ],
  unpleasant: [
    'Estressado', 'Ansioso', 'Irritado', 'Triste', 'Frustrado',
    'Deprimido', 'Culpado', 'Desmotivado', 'Preocupado', 'Sobrecarregado', 'Solitário'
  ],
  neutral: [
    'Cansado', 'Indiferente', 'Neutro', 'Pensativo', 'Calmo', 'Concentrado', 'Curioso'
  ],
  pleasant: [
    'Feliz', 'Alegre', 'Contente', 'Entusiasmado', 'Grato', 'Confiante',
    'Inspirado', 'Motivado', 'Esperançoso', 'Orgulhoso', 'Tranquilo', 'Satisfeito'
  ],
  veryPleasant: [
    'Feliz', 'Alegre', 'Contente', 'Entusiasmado', 'Grato', 'Confiante',
    'Inspirado', 'Motivado', 'Esperançoso', 'Orgulhoso', 'Tranquilo', 'Satisfeito'
  ]
}

const moodLabels = ['Muito Desagradável', 'Desagradável', 'Neutro', 'Agradável', 'Muito Agradável']

export default function EmotionTracker() {
  const [moodIndex, setMoodIndex] = useState(2) // Inicialmente neutro
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const getMoodEmotions = () => {
    switch(moodIndex) {
      case 0: return emotions.veryUnpleasant
      case 1: return emotions.unpleasant
      case 2: return emotions.neutral
      case 3: return emotions.pleasant
      case 4: return emotions.veryPleasant
      default: return emotions.neutral
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/emotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emotion: selectedEmotion, 
          intensity, 
          note,
          mood: moodLabels[moodIndex]
        }),
      })
      if (response.ok) {
        // Reset form and show success message
        setSelectedEmotion('')
        setIntensity(5)
        setNote('')
        setMoodIndex(2)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000) // Hide message after 3 seconds
      }
    } catch (error) {
      console.error('Error submitting emotion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Escolha como está este momento</h1>
        
        <motion.div 
          className="w-64 h-64 mx-auto mb-8 rounded-full relative"
          style={{
            background: `conic-gradient(from 180deg at 50% 50%, 
              ${moodIndex <= 1 ? '#FF4136' : '#FFDC00'} 0deg, 
              ${moodIndex >= 3 ? '#2ECC40' : '#FFDC00'} 360deg)`
          }}
        >
          <div className="absolute inset-2 rounded-full bg-gray-800 flex items-center justify-center">
            <div className="text-2xl font-bold">{moodLabels[moodIndex]}</div>
          </div>
        </motion.div>

        <motion.div className="relative w-full mb-4" ref={sliderRef}>
          <input
            type="range"
            min="0"
            max="400"
            value={moodIndex * 100}
            onChange={(e) => {
              const newValue = Math.round(parseInt(e.target.value) / 100);
              setMoodIndex(newValue);
            }}
            className="w-full appearance-none bg-transparent cursor-pointer"
            style={{
              WebkitAppearance: 'none',
              background: 'linear-gradient(to right, #FF4136, #FFDC00, #2ECC40)',
              height: '12px',
              borderRadius: '6px',
            }}
          />
          <motion.div
            className="absolute top-0 w-6 h-6 bg-white rounded-full shadow-md"
            style={{
              left: `calc(${(moodIndex / 4) * 100}% - 12px)`,
              top: '-3px',
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={(_, info) => {
              if (sliderRef.current) {
                const newValue = Math.round((info.point.x / sliderRef.current.offsetWidth) * 4);
                setMoodIndex(Math.max(0, Math.min(4, newValue)));
              }
            }}
          />
        </motion.div>
        <div className="flex justify-between text-sm mb-8">
          <span>Muito Desagradável</span>
          <span>Muito Agradável</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            {getMoodEmotions().map((emotion) => (
              <motion.button
                key={emotion}
                type="button"
                className={`p-2 rounded-full text-white text-xs sm:text-sm ${
                  selectedEmotion === emotion
                    ? 'bg-gray-300 bg-opacity-80'
                    : 'bg-gray-500 bg-opacity-60'
                }`}
                onClick={() => setSelectedEmotion(emotion)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {emotion}
              </motion.button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block mb-2">Nota para o seu dia</label>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Notas</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded text-black"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {isLoading ? 'Registrando...' : 'Registrar Emoção'}
          </button>
        </form>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-4 p-3 bg-green-500 text-white rounded-lg text-center"
            >
              Emoção registrada com sucesso!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}