// import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
// import { prisma } from '../../../lib/prisma'

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const session = await getSession({ req })
//   if (!session || !session.user) {
//     return res.status(401).json({ error: 'Unauthorized totally' })
//   }

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' }) }

  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const habits = await prisma.habit.findMany({
          where: { userId: session.user.id },
        })
        res.status(200).json(habits)
      } catch (_error) {
        res.status(500).json({ error: 'Error fetching habits' })
      }
      break
    case 'POST':
      try {
        const { name, icon, time } = req.body
        const habit = await prisma.habit.create({
          data: {
            name,
            icon,
            time,
            userId: session.user.id,
          },
        })
        res.status(201).json(habit)
      } catch (_error) {
        res.status(500).json({ error: 'Error creating habit' })
      }
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}