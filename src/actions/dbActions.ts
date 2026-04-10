"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Audit Logging ───────────────────────────────────────────────────────────

export async function logAuditAction(userId: string, action: string, severity: string = 'LOW') {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        severity,
        status: 'SUCCESS'
      }
    })
    revalidatePath('/')
  } catch (error) {
    console.error("[DB_ERROR] Audit logging failed:", error)
  }
}

// ─── Incident Management ─────────────────────────────────────────────────────

export async function recordIncident(zoneName: string, type: string, message: string, mitigation?: string) {
  try {
    const zone = await prisma.zone.findFirst({
      where: { name: zoneName }
    })

    if (!zone) return

    await prisma.incidentLog.create({
      data: {
        zoneId: zone.id,
        type,
        message,
        mitigationTaken: mitigation,
        resolvedAt: mitigation ? new Date() : null
      }
    })
  } catch (error) {
    console.error("[DB_ERROR] Incident recording failed:", error)
  }
}

// ─── Export History ──────────────────────────────────────────────────────────

export async function recordExport(filename: string, format: string, userName?: string) {
  try {
    await prisma.export.create({
      data: {
        filename,
        format,
        user: userName
      }
    })
  } catch (error) {
    console.error("[DB_ERROR] Export recording failed:", error)
  }
}

// ─── Data Access ─────────────────────────────────────────────────────────────

export async function getAuditLogs() {
  return await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: { user: true }
  })
}

export async function getIncidentHistory() {
  return await prisma.incidentLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { zone: true }
  })
}
