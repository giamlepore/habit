import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            image: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 10
    })
    return res.json(activities)
  }

  if (req.method === 'POST') {
    const activity = await prisma.activity.create({
      data: {
        habitId: req.body.habitId,
        habitName: req.body.habitName,
        habitIcon: req.body.habitIcon,
        type: req.body.type,
        completedAt: req.body.completedAt,
        userName: req.body.userName,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            image: true
          }
        }
      }
    })
    return res.json(activity)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}