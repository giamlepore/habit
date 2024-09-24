// import { PrismaClient } from '@prisma/client'

// declare global {
//   var prisma: PrismaClient | undefined
// }

// export const prisma = global.prisma || new PrismaClient()

// if (process.env.NODE_ENV !== 'production') global.prisma = prisma

import { PrismaClient } from '@prisma/client'

declare global {
  // Adicionar a propriedade `prisma` ao objeto `globalThis`
  var prisma: PrismaClient | undefined;
}

// Usar a variável global apenas se não estiver definida
export const prisma = globalThis.prisma || new PrismaClient();

// Evitar criar várias instâncias em ambiente de desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}