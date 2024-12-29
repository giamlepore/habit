import React, { useEffect, useState, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Settings, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Check, ChevronUpCircle, LogOutIcon, Sun, Moon, BarChart2, SmileIcon, MoreVertical, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import confetti from 'canvas-confetti'
import { Line } from 'react-chartjs-2'
import EmotionTracker from './EmotionTracker'
import EmotionChart from './EmotionChart'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import ContributionGraph from './ContribuitionGraph'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Habit {
  id: string
  name: string
  icon: string
  time?: string
  streak: number
  consistency: number
  checkIns: number
  calendar: Record<string, 'check-in' | 'miss' | 'day-off' | 'special' | null>
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function HabitTracker() {
  const { data: session } = useSession()
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState({ name: '', icon: '' })
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'year'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [darkMode, setDarkMode] = useState(true)
  const [loadingConsistency, setLoadingConsistency] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null)
  const [showSpecialDay, setShowSpecialDay] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [collapsedHabits, setCollapsedHabits] = useState<Record<string, boolean>>({})
  const [addDayHabit, setAddDayHabit] = useState<Habit | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (session) {
      fetchHabits()
    }
  }, [session])

  useEffect(() => {
    setLoadingConsistency(true)
    setTimeout(() => {
      habits.forEach(habit => {
        habit.consistency = calculateConsistency(habit, calendarView, currentDate)
      })
      setLoadingConsistency(false)
    }, 500)
  }, [calendarView])

  const fetchHabits = async () => {
    const response = await fetch('/api/habits')
    if (response.ok) {
      const data = await response.json()
      setHabits(data)
    }
  }

  const addHabit = async () => {
    if (newHabit.name && newHabit.icon) {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabit),
      })
      if (response.ok) {
        const habit = await response.json()
        setHabits([...habits, habit])
        setNewHabit({ name: '', icon: '' })
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    }
  }

  const editHabit = async (habit: Habit) => {
    const response = await fetch(`/api/habits/${habit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    })
    if (response.ok) {
      const updatedHabit = await response.json()
      setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h))
      setEditingHabit(null)
    }
  }

  const removeHabit = async (id: string) => {
    const response = await fetch(`/api/habits/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      setHabits(habits.filter(habit => habit.id !== id))
      setHabitToDelete(null)
    }
  }

  const toggleCheckIn = async (habit: Habit, date: string) => {
    const newCalendar = { ...habit.calendar }
    if (!newCalendar[date]) {
      newCalendar[date] = 'check-in'
    } else if (newCalendar[date] === 'check-in') {
      newCalendar[date] = 'miss'
    } else if (newCalendar[date] === 'miss') {
      newCalendar[date] = 'day-off'
    } else {
      delete newCalendar[date]
    }

    const updatedHabit = { ...habit, calendar: newCalendar }
    updateHabitStats(updatedHabit)
    await editHabit(updatedHabit)
  }

  const toggleTodayCheckIn = async (habit: Habit, isSpecial: boolean = false) => {
    const today = new Date().toISOString().split('T')[0]
    const newCalendar = { ...habit.calendar }
    if (newCalendar[today] === 'check-in' || newCalendar[today] === 'special') {
      delete newCalendar[today]
    } else {
      newCalendar[today] = isSpecial ? 'special' : 'check-in'
    }

    const updatedHabit = { ...habit, calendar: newCalendar }
    updateHabitStats(updatedHabit)
    await editHabit(updatedHabit)

    if (isSpecial) {
      setShowSpecialDay(true)
      triggerConfetti()
      setTimeout(() => triggerConfetti(), 500)
      setTimeout(() => setShowSpecialDay(false), 3000)
    } else {
      triggerConfetti()
    }
  }

  const updateHabitStats = (habit: Habit) => {
    const checkIns = Object.values(habit.calendar).filter(v => v === 'check-in' || v === 'special').length
    habit.checkIns = checkIns
    habit.consistency = calculateConsistency(habit, calendarView, currentDate)
    habit.streak = calculateStreak(habit)
  }

  const calculateStreak = (habit: Habit) => {
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      if (habit.calendar[dateString] === 'check-in' || habit.calendar[dateString] === 'special') {
        streak++
      } else if (habit.calendar[dateString] !== 'day-off') {
        break
      }
    }
    return streak
  }

  const calculateConsistency = (habit: Habit, view: 'week' | 'month' | 'year', date: Date) => {
    let startDate: Date
    let endDate: Date

    switch (view) {
      case 'week':
        startDate = startOfWeek(date, { weekStartsOn: 0 })
        endDate = endOfWeek(date, { weekStartsOn: 0 })
        break
      case 'month':
        startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        break
      case 'year':
        startDate = new Date(date.getFullYear(), 0, 1)
        endDate = new Date(date.getFullYear(), 11, 31)
        break
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const totalDays = days.length
    const checkIns = days.filter(day => 
      habit.calendar[day.toISOString().split('T')[0]] === 'check-in' || habit.calendar[day.toISOString().split('T')[0]] === 'special'
    ).length

    return Math.round((checkIns / totalDays) * 100) || 0
  }

  const renderCalendar = (habit: Habit) => {
    let startDate: Date
    let endDate: Date

    switch (calendarView) {
      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
        break
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        break
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1)
        endDate = new Date(currentDate.getFullYear(), 11, 31)
        break
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <button
            className="p-1 rounded-full hover:bg-gray-200 text-black"
            onClick={() => {
              const newDate = new Date(currentDate)
              if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7)
              else if (calendarView === 'month') newDate.setMonth(newDate.getMonth() - 1)
              else newDate.setFullYear(newDate.getFullYear() - 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            value={calendarView}
            onChange={(e) => setCalendarView(e.target.value as 'week' | 'month' | 'year')}
          >
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
          <button
            className="p-1 rounded-full text-black hover:bg-gray-200"
            onClick={() => {
              const newDate = new Date(currentDate)
              if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7)
              else if (calendarView === 'month') newDate.setMonth(newDate.getMonth() + 1)
              else newDate.setFullYear(newDate.getFullYear() + 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className={`grid gap-0.5 ${calendarView === 'year' ? 'grid-cols-12' : 'grid-cols-7'}`}>
          {calendarView === 'week' && DAYS.map((day, index) => (
            <div key={day} className="text-center text-xs text-gray-500">
              {index === 5 || index === 6 ? day : day[0]}
            </div>
          ))}
          {days.map(date => {
            const dateString = date.toISOString().split('T')[0]
            const status = habit.calendar[dateString]
            return (
              <button
                key={dateString}
                className={`h-6 w-full rounded ${
                  status === 'check-in' ? 'bg-green-500' :
                  status === 'special' ? 'bg-green-500 animate-pulse' :
                  status === 'miss' ? 'bg-red-500 bg-opacity-50' :
                  status === 'day-off' ? 'bg-gray-100/50' :
                  'bg-gray-100/50'
                } ${isToday(date) ? 'font-bold' : ''}`}
                onClick={() => toggleCheckIn(habit, dateString)}
              >
                <span className="text-xs">
                  {calendarView === 'year' 
                    ? ''
                    : format(date, 'd')}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between text-xs mt-4 text-gray-400">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-1"></div>
            Check-in
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 bg-opacity-50 rounded-full mr-1"></div>
            Não fiz
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-500 rounded-full mr-1"></div>
            Dia off
          </div>
        </div>
      </div>
    )
  }

  const renderStatsChart = () => {
    let startDate: Date
    let endDate: Date

    switch (calendarView) {
      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
        break
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        break
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1)
        endDate = new Date(currentDate.getFullYear(), 11, 31)
        break
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const labels = days.map(day => format(day, 'MMM dd'))
    const data = days.map(day => {
      const dateString = day.toISOString().split('T')[0]
      return habits.filter(habit => habit.calendar[dateString] === 'check-in' || habit.calendar[dateString] === 'special').length
    })

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Hábitos Concluídos',
          data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Hábitos Concluídos por dia'
        }
      }
    }

    return <Line data={chartData} options={options} />
  }

  const toggleCollapse = (habitId: string) => {
    setCollapsedHabits(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }))
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <h1 className="mb-8 text-4xl font-bold text-white text-center" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji' }}>
          Um novo jeito de acompanhar hábitos
        </h1>
        <div className="p-6 rounded-lg shadow-lg bg-gray-800 text-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>🔥</span>
              <span className="font-semibold">Criar novos hábitos</span>
            </div>
            <div className="flex gap-2 items-center">
              <motion.button
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-green-500"
                onClick={() => signIn()}
                whileTap={{ scale: 0.8 }}
                animate={{
                  boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 10px rgba(34, 197, 94, 0)'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                }}
              >
                <span className="text-green-500"></span>
              </motion.button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm">Sequência</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0<span className="text-xs">%</span></div>
              <div className="text-sm">Consistência</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm">Check-ins</div>
            </div>
          </div>
          <div className="text-black">
            {renderCalendar({
              id: 'new',
              name: 'Criar novos hábitos',
              icon: '➕',
              streak: 0,
              consistency: 0,
              checkIns: 0,
              calendar: {}
            })}
          </div>
          <motion.button
            className="w-full mt-4 p-2 rounded-full bg-green-500 text-white font-semibold"
            onClick={() => signIn()}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 10px rgba(34, 197, 94, 0)'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
            }}
          >
            Começar agora
          </motion.button>
        </div>
      </div>
    )
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 400,
      origin: { y: 0.5 },
    });
  };

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${darkMode ? 'bg-[#242933] text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#A6ADBA]">{habits.length} HÁBITOS</h1>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-300'}`}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <motion.button
                  className={`p-2 rounded-full ${darkMode ? 'bg-gray-700/80 hover:bg-gray-600/80' : 'bg-gray-400/80 hover:bg-gray-300/80'} backdrop-blur-sm transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SmileIcon className="h-5 w-5" />
                </motion.button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
                <Dialog.Content
                  className={`fixed inset-0 ${
                    darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-black'
                  } p-4 sm:p-6 overflow-y-auto transition-all backdrop-blur-md`}
                >
                  <div className="space-y-8 h-full">
                    <EmotionTracker />
                    <EmotionChart />
                  </div>
                  <Dialog.Close asChild>
                    <motion.button
                      className="absolute top-2 right-2 p-2 rounded-full bg-gray-200/80 text-gray-800 hover:bg-gray-300/80 transition-colors"
                      aria-label="Close"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-300'}`}
              onClick={() => setShowStatsModal(true)}
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="h-4 w-4" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
                <Dialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-xl`}>
                  <Dialog.Title className="text-lg font-bold mb-4">Adicionar novo hábito</Dialog.Title>
                  <input
                    className={`w-full p-2 mb-4 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-500'}`}
                    placeholder="Nome do hábito"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                  <input
                    className={`w-full p-2 mb-4 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-500'}`}
                    placeholder="Ícone do hábito (emoji)"
                    value={newHabit.icon}
                    onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  />
                  <button
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={addHabit}
                  >
                    Adicionar Hábito
                  </button>
                  {showSuccessMessage && (
                    <div className="mt-4 p-2 bg-green-500 text-white rounded flex items-center justify-center">
                      <Check className="h-4 w-4 mr-2" />
                      Habit adicionado com sucesso!
                    </div>
                  )}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-300'}`}
              onClick={() => signOut()}
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {habits.map(habit => (
            <div key={habit.id} className={`p-4 sm:p-6 rounded-lg shadow ${darkMode ? 'bg-gray-700/25 text-white' : 'bg-white text-black'}`}>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <button className="p-1 rounded-full hover:bg-gray-200/20">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
  <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
  <Dialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-gray-700/25' : 'bg-white'} p-4 rounded-lg shadow-xl min-w-[200px]`}>
    <div className="flex flex-col gap-2">
      <button
        className={`flex items-center gap-2 p-2 ${darkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-100'} rounded-lg w-full text-left`}
        onClick={() => setEditingHabit(habit)}
      >
        <Pencil className="h-4 w-4" />
        <span>Editar</span>
      </button>
      <button
        className={`flex items-center gap-2 p-2 ${darkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-100'} rounded-lg w-full text-left`}
        onClick={() => setAddDayHabit(habit)}
      >
        <Calendar className="h-4 w-4" />
        <span>Adicionar um Dia</span>
      </button>
      <button
        className={`flex items-center gap-2 p-2 ${darkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-100'} rounded-lg w-full text-left text-red-500`}
        onClick={() => setHabitToDelete(habit)}
      >
        <Trash2 className="h-4 w-4" />
        <span>Excluir</span>
      </button>
    </div>
  </Dialog.Content>
</Dialog.Portal>
                  </Dialog.Root>
                  <span>{habit.icon}</span>
                  <span className={`font-semibold text-lg ${darkMode ? 'text-[#A6ADBA]' : ''}`}>{habit.name}</span>
                  {habit.time && <span className={`text-sm ${darkMode ? 'text-[#A6ADBA]' : ''}`}>{habit.time}</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <motion.button
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                      habit.calendar[new Date().toISOString().split('T')[0]] === 'check-in'
                        ? 'bg-green-500 border-green-500'
                        : habit.calendar[new Date().toISOString().split('T')[0]] === 'special'
                        ? 'bg-green-500 border-green-500 animate-pulse'
                        : 'border-gray-300'
                    }`}
                    onClick={() => toggleTodayCheckIn(habit)}
                    onMouseDown={() => {
                      longPressTimerRef.current = setTimeout(() => {
                        toggleTodayCheckIn(habit, true)
                      }, 3000)
                    }}
                    onMouseUp={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current)
                      }
                    }}
                    onMouseLeave={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current)
                      }
                    }}
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 800, damping: 17 }}
                  >
                    {(habit.calendar[new Date().toISOString().split('T')[0]] === 'check-in' || 
                      habit.calendar[new Date().toISOString().split('T')[0]] === 'special') && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </motion.button>
                </div>
              </div>
              {!collapsedHabits[habit.id] && (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center mb-8">
                    <div>
                      <div className={`text-3xl font-bold ${habit.streak >= 3 ? 'text-orange-500' : darkMode ? 'text-[#A6ADBA]' : ''}`}>
                        {habit.streak}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-[#A6ADBA]/70' : 'text-gray-500/70'}`}>Sequência</div>
                    </div>
                    <div>
                      <div className={`text-3xl font-bold ${darkMode ? 'text-[#A6ADBA]' : ''}`}>
                        {loadingConsistency ? <div className="loader"></div> : <>{habit.consistency}<span className="text-xs"> %</span></>}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-[#A6ADBA]/70' : 'text-gray-500/70'}`}>Consistência</div>
                    </div>
                    <div>
                      <div className={`text-3xl font-bold ${darkMode ? 'text-[#A6ADBA]' : ''}`}>{habit.checkIns}</div>
                      <div className={`text-xs ${darkMode ? 'text-[#A6ADBA]/70' : 'text-gray-500/70'}`}>Check-ins</div>
                    </div>
                  </div>
                  <ContributionGraph habit={habit} />
                </>
              )}
              <button
                onClick={() => toggleCollapse(habit.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                {collapsedHabits[habit.id] ? (
                  <>
                    <ChevronUpCircle className="h-4 w-4 rotate-180" />
                    Expandir
                  </>
                ) : (
                  <>
                    <ChevronUpCircle className="h-4 w-4 transform" />
                    Diminuir
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      
      </div>
      <Dialog.Root open={showStatsModal} onOpenChange={setShowStatsModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-xl w-11/12 max-w-4xl`}>
            <Dialog.Title className="text-lg font-bold mb-4">Estatísticas dos Hábitos</Dialog.Title>
            <div className="mb-4">
              <select
                className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
                value={calendarView}
                onChange={(e) => setCalendarView(e.target.value as 'week' | 'month' | 'year')}
              >
                <option value="week">Semana</option>
                <option value="month">Mês</option>
                <option value="year">Ano</option>
              </select>
            </div>
            {renderStatsChart()}
            <button
              className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowStatsModal(false)}
            >
              Fechar
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <AnimatePresence>
        {showSpecialDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white text-black p-8 rounded-lg text-2xl font-bold"
            >
              Dia Especial
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Edit Habit Modal */}
      <Dialog.Root open={editingHabit !== null} onOpenChange={() => setEditingHabit(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-xl w-96`}>
            <Dialog.Title className="text-lg font-bold mb-4">Editar Hábito</Dialog.Title>
            {editingHabit && (
              <form onSubmit={(e) => {
                e.preventDefault()
                editHabit(editingHabit)
              }}>
                <input
                  className={`w-full p-2 mb-4 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                  placeholder="Nome do hábito"
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                />
                <input
                  className={`w-full p-2 mb-4 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                  placeholder="Ícone do hábito (emoji)"
                  value={editingHabit.icon}
                  onChange={(e) => setEditingHabit({ ...editingHabit, icon: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setEditingHabit(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={habitToDelete !== null} onOpenChange={() => setHabitToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-xl w-96`}>
            <Dialog.Title className="text-lg font-bold mb-4">Confirmar Exclusão</Dialog.Title>
            <p className="mb-4">Tem certeza que deseja excluir o hábito "{habitToDelete?.name}"?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                onClick={() => setHabitToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => habitToDelete && removeHabit(habitToDelete.id)}
              >
                Excluir
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Day Modal */}
      <Dialog.Root open={addDayHabit !== null} onOpenChange={() => setAddDayHabit(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-xl w-96`}>
            <Dialog.Title className="text-lg font-bold mb-4">Adicionar um Dia</Dialog.Title>
            {addDayHabit && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm mb-2">Selecione a data</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setAddDayHabit(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                      if (addDayHabit) {
                        toggleCheckIn(addDayHabit, selectedDate);
                        setAddDayHabit(null);
                      }
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}