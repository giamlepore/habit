import React, { useEffect, useRef } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, startOfYear, endOfYear } from 'date-fns'
import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'

interface ContributionGraphProps {
  habit: {
    calendar: Record<string, 'check-in' | 'miss' | 'day-off' | 'special' | null>
  }
}

export default function ContributionGraph({ habit }: ContributionGraphProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const yearStart = new Date(currentYear, 0, 1)
  const yearEnd = new Date(currentYear, 11, 31)
  const weeks = []
  let currentDate = yearStart

  while (currentDate <= yearEnd) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    weeks.push(days)
    currentDate = addWeeks(currentDate, 1)
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Calculate scroll position based on current month
      const containerWidth = scrollContainerRef.current.scrollWidth
      const monthPosition = (containerWidth / 12) * currentMonth
      scrollContainerRef.current.scrollLeft = monthPosition
    }
  }, [currentMonth])

  const getContributionLevel = (status: string | null) => {
    switch (status) {
      case 'check-in':
        return 'bg-green-500'
      case 'special':
        return 'bg-green-600'
      case 'miss':
        return 'bg-red-300'
      case 'day-off':
        return 'bg-gray-400'
      default:
        return 'bg-[#E5E6E6] dark:bg-[rgba(32,36,44,0.565)]'
    }
  }

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="w-full">
      <div className="overflow-x-auto px-4 md:px-8 lg:px-16" ref={scrollContainerRef}>
        <div className="min-w-max mx-auto">
          <div className="flex mb-2">
            <div className="w-10" /> {/* Spacer for weekday labels */}
            {MONTHS.map((month, i) => (
              <div key={month} className="flex-1 text-center text-xs text-gray-500">
                {month}
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="flex-none mr-2 md:mr-10 rounded-lg bg-gray-700/25 dark:bg-gray-700/25" style={{ position: 'sticky', left: 0 }}>
              {WEEKDAYS.map(day => (
                <div key={day} className="h-3 text-[8px] text-gray-500 leading-3 mb-0.5">
                  {day[0]}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map(day => {
                    const dateString = format(day, 'yyyy-MM-dd')
                    const status = habit.calendar[dateString]
                    
                    return (
                      <Tooltip.Provider key={dateString}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <motion.div
                              className={`w-3 h-3 rounded-sm ${getContributionLevel(status)}`}
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
                              {status ? status : 'Sem registro'}
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

      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#E5E6E6] dark:bg-[rgba(32,36,44,0.565)]" />
          <span>Sem registro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-300/50" />
          <span>Faltou</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Check-in</span>
        </div>
      </div>
    </div>
  )
}
