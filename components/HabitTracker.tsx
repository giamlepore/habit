import React, { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Settings, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameYear } from 'date-fns'

interface Habit {
  id: string
  name: string
  icon: string
  time?: string
  streak: number
  consistency: number
  checkIns: number
  calendar: Record<string, 'check-in' | 'miss' | 'day-off' | null>
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function HabitTracker() {
  const { data: session } = useSession()
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState({ name: '', icon: '' })
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'year'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (session) {
      fetchHabits()
    }
  }, [session])

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

  const toggleTodayCheckIn = async (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0]
    const newCalendar = { ...habit.calendar }
    if (newCalendar[today] === 'check-in') {
      delete newCalendar[today]
    } else {
      newCalendar[today] = 'check-in'
    }

    const updatedHabit = { ...habit, calendar: newCalendar }
    updateHabitStats(updatedHabit)
    await editHabit(updatedHabit)
  }

  const updateHabitStats = (habit: Habit) => {
    const checkIns = Object.values(habit.calendar).filter(v => v === 'check-in').length
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
      if (habit.calendar[dateString] === 'check-in') {
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
        startDate = startOfWeek(date)
        endDate = endOfWeek(date)
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
      habit.calendar[day.toISOString().split('T')[0]] === 'check-in'
    ).length

    return Math.round((checkIns / totalDays) * 100) || 0
  }

  const renderCalendar = (habit: Habit) => {
    let startDate: Date
    let endDate: Date

    switch (calendarView) {
      case 'week':
        startDate = startOfWeek(currentDate)
        endDate = endOfWeek(currentDate)
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
            className="p-1 rounded-full hover:bg-gray-200"
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
          <Select.Root value={calendarView} onValueChange={(value: 'week' | 'month' | 'year') => setCalendarView(value)}>
            <Select.Trigger className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
              <Select.Value placeholder="Select view" />
              <Select.Icon className="ml-2">
                <ChevronRight className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="week">Week</Select.Item>
              <Select.Item value="month">Month</Select.Item>
              <Select.Item value="year">Year</Select.Item>
            </Select.Content>
          </Select.Root>
          <button
            className="p-1 rounded-full hover:bg-gray-200"
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
        <div className="grid grid-cols-7 gap-1">
          {calendarView === 'week' && DAYS.map(day => (
            <div key={day} className="text-center text-xs text-gray-500">{day}</div>
          ))}
          {days.map(date => {
            const dateString = date.toISOString().split('T')[0]
            const status = habit.calendar[dateString]
            return (
              <button
                key={dateString}
                className={`h-6 w-full rounded ${
                  status === 'check-in' ? 'bg-green-500' :
                  status === 'miss' ? 'bg-red-500' :
                  status === 'day-off' ? 'bg-gray-500' :
                  'bg-gray-200'
                }`}
                onClick={() => toggleCheckIn(habit, dateString)}
              >
                <span className="text-xs">
                  {calendarView === 'year' 
                    ? (isSameMonth(date, currentDate) ? format(date, 'd') : '')
                    : format(date, 'd')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => signIn()}
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-black">{habits.length} HABITS</h1>
          <div className="flex gap-2">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="h-4 w-4" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl">
                  <Dialog.Title className="text-lg font-bold mb-4">Add New Habit</Dialog.Title>
                  <input
                    className="w-full p-2 mb-4 border rounded"
                    placeholder="Habit name"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                  <input
                    className="w-full p-2 mb-4 border rounded"
                    placeholder="Habit icon (emoji)"
                    value={newHabit.icon}
                    onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  />
                  <button
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={addHabit}
                  >
                    Add Habit
                  </button>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
              onClick={() => signOut()}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <span>{habit.icon}</span>
                  <span className="font-semibold">{habit.name}</span>
                  {habit.time && <span className="text-gray-500 text-sm">{habit.time}</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <motion.button
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      habit.calendar[new Date().toISOString().split('T')[0]] === 'check-in'
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}
                    onClick={() => toggleTodayCheckIn(habit)}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {habit.calendar[new Date().toISOString().split('T')[0]] === 'check-in' && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </motion.button>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
                      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl">
                        <Dialog.Title className="text-lg font-bold mb-4">Edit Habit</Dialog.Title>
                        <input
                          className="w-full p-2 mb-4 border rounded"
                          placeholder="Habit name"
                          value={editingHabit?.name || ''}
                          onChange={(e) => setEditingHabit(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                        <input
                          className="w-full p-2 mb-4 border rounded"
                          placeholder="Habit icon (emoji)"
                          value={editingHabit?.icon || ''}
                          onChange={(e) => setEditingHabit(prev => prev ? { ...prev, icon: e.target.value } : null)}
                        />
                        <button
                          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => editingHabit && editHabit(editingHabit)}
                        >
                          Save Changes
                        </button>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => removeHabit(habit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-4 text-gray-500">
                <div>
                  <div className="text-2xl font-bold">{habit.streak}</div>
                  <div className="text-gray-500 text-sm">Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{habit.consistency}%</div>
                  <div className="text-gray-500 text-sm">Consistency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{habit.checkIns}</div>
                  <div className="text-gray-500 text-sm">Check-ins</div>
                </div>
              </div>
              {renderCalendar(habit)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}