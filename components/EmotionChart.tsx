import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { format, subDays } from 'date-fns'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface EmotionData {
  id: string
  userId: string
  emotion: string
  intensity: number
  note?: string
  createdAt: string
  updatedAt: string
}

interface HabitData {
  id: string
  name: string
  icon: string
  calendar: Record<string, boolean>
}

export default function EmotionChart() {
  const [emotionData, setEmotionData] = useState<EmotionData[]>([])
  const [habitData, setHabitData] = useState<HabitData[]>([])

  useEffect(() => {
    fetchEmotionData()
    fetchHabitData()
  }, [])

  const fetchEmotionData = async () => {
    try {
      const response = await fetch('/api/emotions')
      if (response.ok) {
        const data: EmotionData[] = await response.json()
        setEmotionData(data)
      }
    } catch (error) {
      console.error('Error fetching emotion data:', error)
    }
  }

  const fetchHabitData = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data: HabitData[] = await response.json()
        setHabitData(data)
      }
    } catch (error) {
      console.error('Error fetching habit data:', error)
    }
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse()

  const chartData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Intensidade Emocional',
        data: last7Days.map(date => {
          const emotion = emotionData.find(e => format(new Date(e.createdAt), 'yyyy-MM-dd') === date)
          return emotion ? emotion.intensity : null
        }),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  }

  const getCompletedHabits = (date: string) => {
    return habitData
      .filter(habit => habit.calendar[date])
      .map(habit => `${habit.icon} ${habit.name}`)
      .join(', ')
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tendências Emocionais'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const date = last7Days[dataIndex];
            const emotion = emotionData.find(e => format(new Date(e.createdAt), 'yyyy-MM-dd') === date);
            const completedHabits = getCompletedHabits(date).split(', ');
            
            let tooltipLines = [];
            if (emotion) {
              tooltipLines = [
                `Nota: ${emotion.intensity}`,
                `Emoção: ${emotion.emotion}`,
                `Anotações: ${emotion.note || 'Nenhuma'}`,
                'Hábitos concluídos:'
              ];
              if (completedHabits.length > 0) {
                tooltipLines = tooltipLines.concat(completedHabits.map(habit => `  ${habit}`));
              } else {
                tooltipLines.push('  Nenhum');
              }
            } else {
              tooltipLines = [`Intensidade: ${context.parsed.y}`];
            }
            return tooltipLines;
          }
        },
        bodySpacing: 8,
        padding: 12,
        displayColors: false,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 6,
        caretSize: 10,
        intersect: false,
        mode: 'index',
        itemSort: null,
        filter: null,
        position: 'nearest'
      }
    }
  }

  return <Line data={chartData} options={options as any} />
}