// import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
// import { prisma } from '../../../lib/prisma'

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const session = await getSession({ req })
//   if (!session || !session.user) {
//     return res.status(401).json({ error: 'Unauthorized [id]' })
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
  const habitId = req.query.id as string

  switch (method) {
    case 'PUT':
      try {
        const { name, icon, time, streak, consistency, checkIns, calendar } = req.body
        const habit = await prisma.habit.update({
          where: { id: habitId },
          data: { name, icon, time, streak, consistency, checkIns, calendar },
        })
        res.status(200).json(habit)
      } catch (_error) {
        res.status(500).json({ error: 'Error updating habit' })
      }
      break
    case 'DELETE':
      try {
        await prisma.habit.delete({ where: { id: habitId } })
        res.status(204).end()
      } catch (_error) {
        res.status(500).json({ error: 'Error deleting habit' })
      }
      break
    default:
      res.setHeader('Allow', ['PUT', 'DELETE'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}