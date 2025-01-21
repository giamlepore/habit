import { useSession } from 'next-auth/react'
import HabitTracker from '../components/HabitTracker'
import LoadingScreen from '../components/LoadingScreen'

export default function Home() {
  const { status } = useSession()

  if (status === "loading") {
    return <LoadingScreen />
  }

  return <HabitTracker />
}