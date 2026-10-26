import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:dev.db'
  let targetUrl = dbUrl

  if (dbUrl.startsWith('file:')) {
    const rawPath = dbUrl.replace(/^file:/, '').replace(/^\/\//, '')
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    // Normalize Windows backslashes for file URLs
    targetUrl = `file:${resolvedPath.replace(/\\/g, '/')}`
  }

  const adapter = new PrismaLibSql({ url: targetUrl })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
