import React from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, startOfYear, endOfYear } from 'date-fns'
import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'

interface HabitStatsGraphProps {
  habits: Array<{
    name: string
    calendar: Record<string, 'check-in' | 'miss' | 'day-off' | 'special' | null>
  }>
  darkMode: boolean
  view: 'week' | 'month' | 'year'
  currentDate: Date
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function HabitStatsGraph({ habits, darkMode, view = 'year', currentDate }: HabitStatsGraphProps) {
  let startDate: Date
  let endDate: Date

  switch (view) {
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

  const weeks = []
  let currentWeekStart = startDate
  while (currentWeekStart <= endDate) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ 
      start: currentWeekStart, 
      end: weekEnd > endDate ? endDate : weekEnd 
    })
    weeks.push(days)
    currentWeekStart = addWeeks(currentWeekStart, 1)
  }

  const getCompletionColor = (count: number) => {
    if (count === 0) return darkMode ? 'bg-[#20242C90]' : 'bg-[#E5E6E6]'
    if (count <= 2) return 'bg-green-100'
    if (count <= 4) return 'bg-green-200'
    if (count <= 6) return 'bg-green-300'
    if (count <= 8) return 'bg-green-400'
    return 'bg-green-500'
  }

  const getCompletedHabits = (date: string) => {
    return habits.filter(habit => 
      habit.calendar[date] === 'check-in' || habit.calendar[date] === 'special'
    )
  }

  return (
    <div className="w-full">
      <div className="flex">
        <div className="flex-none mr-2 md:mr-4 rounded-lg mt-6">
          {WEEKDAYS.map(day => (
            <div key={day} className="h-3 text-[8px] text-gray-500 leading-3 mb-0.5">
              {day[0]}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto md:overflow-x-visible px-2 md:px-4">
          <div className="min-w-max md:min-w-0">
            {view === 'year' && (
              <div className="flex mb-2">
                {MONTHS.map(month => (
                  <div key={month} className="flex-1 text-center text-xs text-gray-500">
                    {month}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-0.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map(day => {
                    const dateString = format(day, 'yyyy-MM-dd')
                    const completedHabits = getCompletedHabits(dateString)
                    const completedCount = completedHabits.length
                    
                    return (
                      <Tooltip.Provider key={dateString}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <motion.div
                              className={`w-3 h-3 rounded-sm ${getCompletionColor(completedCount)}`}
                              whileHover={{ scale: 1.2 }}
                            />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="bg-gray-900 text-white px-3 py-2 rounded text-xs"
                              sideOffset={5}
                            >
                              {format(day, 'dd/MM/yyyy')}
                              <br />
                              {completedCount} hábitos concluídos
                              {completedCount > 0 && (
                                <ul className="mt-1 list-disc pl-4">
                                  {completedHabits.map((habit, index) => (
                                    <li key={index}>{habit.name}</li>
                                  ))}
                                </ul>
                              )}
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-500 justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${darkMode ? 'bg-[#20242C90]' : 'bg-[#E5E6E6]'}`} />
          <span>0 hábitos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-100" />
          <span>1-2 hábitos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <span>3-4 hábitos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <span>5-6 hábitos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <span>7-8 hábitos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>9+ hábitos</span>
        </div>
      </div>
    </div>
  )
}