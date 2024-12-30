import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'

interface Activity {
  id: string
  habitId: string
  habitName: string
  habitIcon: string
  completedAt: string
  type: 'check-in' | 'special'
  userName: string
  user: {
    image: string | null
  }
}

interface RecentActivitiesProps {
  activities: Activity[]
  darkMode: boolean
}

export default function RecentActivities({ activities, darkMode }: RecentActivitiesProps) {
  return (
    <div className={`px-6 py-6 rounded-xl shadow ${
      darkMode ? 'bg-gray-700/25 text-white' : 'bg-white text-black'
    }`}>
      <h2 className={`text-xxl font-semibold mb-4 ${
        darkMode ? 'text-[#A6ADBA]' : 'text-gray-800'
      }`} style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif', 
        letterSpacing: '-0.02em', 
        fontWeight: '600' 
      }}>
        Atividades
      </h2>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhuma atividade recente
          </p>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {activity.user?.image ? (
                    <Image
                      src={activity.user.image}
                      alt={activity.userName}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`} style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif', 
                      letterSpacing: '-0.02em', 
                      fontWeight: '600' 
                    }}>
                      {activity.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${
                    darkMode ? 'text-[#A6ADBA]' : 'text-gray-800'
                  }`}>
                    <span className="font-bold" style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif', 
                      letterSpacing: '-0.02em', 
                      fontWeight: '600' 
                    }}>
                      {activity.userName.split(' ')[0]}
                    </span> concluiu{' '}
                    <span className="font-medium flex items-center gap-1 inline-flex">
                      <span>{activity.habitIcon}</span>
                      <span>{activity.habitName}</span>
                    </span>
                  </p>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {new Date(activity.completedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} • {formatDistanceToNow(new Date(activity.completedAt), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}