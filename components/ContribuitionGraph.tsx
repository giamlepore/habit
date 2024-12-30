import React, { useEffect, useRef } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, startOfYear, endOfYear } from 'date-fns'
import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'

// Interface que define a estrutura das props do componente
// calendar: objeto que mapeia datas para diferentes estados do hábito
interface ContributionGraphProps {
  habit: {
    calendar: Record<string, 'check-in' | 'miss' | 'day-off' | 'special' | null>
  }
  darkMode: boolean
}

export default function ContributionGraph({ habit, darkMode }: ContributionGraphProps) {
  // Ref para controlar o scroll do container
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Configuração inicial das datas
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const yearStart = new Date(currentYear, 0, 1)
  const yearEnd = new Date(currentYear, 11, 31)
  
  // Array para armazenar todas as semanas do ano
  const weeks = []
  let currentDate = yearStart

  // Gera um array com todas as semanas do ano
  while (currentDate <= yearEnd) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    weeks.push(days)
    currentDate = addWeeks(currentDate, 1)
  }

  // Effect para scrollar automaticamente para o mês atual
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Calculate scroll position based on current month
      const containerWidth = scrollContainerRef.current.scrollWidth
      const monthPosition = (containerWidth / 12) * currentMonth
      scrollContainerRef.current.scrollLeft = monthPosition
    }
  }, [currentMonth])

  // Define as cores dos quadrados baseado no status do hábito
  const getContributionLevel = (status: string | null) => {
    switch (status) {
        case 'check-in':
          return 'bg-green-500'
        case 'special':
          return 'bg-green-600'
        case 'miss':
          return 'bg-red-300/50'
        case 'day-off':
          return darkMode ? 'bg-[#20242C90]' : 'bg-[#E5E6E6]'
        default:
          return darkMode ? 'bg-[#20242C90]' : 'bg-[#E5E6E6]'
      }
  }

  // Arrays com nomes dos dias da semana e meses em português
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="w-full">
      {/* Container principal que agora inclui os dias da semana e o scroll */}
      <div className="flex">
        {/* Coluna com as iniciais dos dias da semana - ajustado margin para desktop */}
        <div className="flex-none mr-2 md:mr-4 rounded-lg mt-6">
          {WEEKDAYS.map(day => (
            <div key={day} className="h-3 text-[8px] text-gray-500 leading-3 mb-0.5">
              {day[0]}
            </div>
          ))}
        </div>

        {/* Container de scroll agora começa aqui */}
        <div className="overflow-x-auto md:overflow-x-visible px-2 md:px-4" ref={scrollContainerRef}>
          <div className="min-w-max md:min-w-0">
            {/* Cabeçalho com nomes dos meses */}
            <div className="flex mb-2">
              {MONTHS.map((month, i) => (
                <div key={month} className="flex-1 text-center text-xs text-gray-500">
                  {month}
                </div>
              ))}
            </div>

            {/* Grid de contribuições */}
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

      {/* Legenda do gráfico */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#E5E6E6] dark:bg-[rgba(32,36,44,0.565)]" />
          <span>Não preenchido</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-300/50" />
          <span>Não fiz</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Fiz</span>
        </div>
      </div>
    </div>
  )
}
