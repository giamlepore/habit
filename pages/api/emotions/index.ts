import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const emotions = await prisma.emotion.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
        })
        res.status(200).json(emotions)
      } catch (error) {
        res.status(500).json({ error: 'Error fetching emotions' })
      }
      break
    case 'POST':
      try {
        const { emotion, intensity, note } = req.body
        const newEmotion = await prisma.emotion.create({
          data: {
            emotion,
            intensity,
            note,
            userId: session.user.id,
          },
        })
        res.status(201).json(newEmotion)
      } catch (error) {
        res.status(500).json({ error: 'Error creating emotion' })
      }
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}