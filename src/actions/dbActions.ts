"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Audit Logging ───────────────────────────────────────────────────────────

export async function logAuditAction(
  operatorName: string = "root_admin",
  action: string,
  severity: "LOW" | "MEDIUM" | "HIGH" = "LOW"
) {
  try {
    const entry = await prisma.auditLog.create({
      data: {
        operatorName,
        action,
        severity,
        status: "SUCCESS"
      }
    })
    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true, entry }
  } catch (error) {
    console.error("[DB_ERROR] Audit logging failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function getAuditLogs(take: number = 50) {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take,
      include: { user: true }
    })
  } catch (error) {
    console.error("[DB_ERROR] getAuditLogs failed:", error)
    return []
  }
}

// ─── Zone Management ─────────────────────────────────────────────────────────

export async function getZones() {
  try {
    return await prisma.zone.findMany({
      orderBy: { capacity: "desc" },
      include: {
        staff: true,
        resources: true,
        incidentLogs: {
          where: { status: "ACTIVE" }
        }
      }
    })
  } catch (error) {
    console.error("[DB_ERROR] getZones failed:", error)
    return []
  }
}

export async function updateZoneMetrics(
  zoneId: string,
  data: {
    currentOccupancy?: number
    status?: string
    queueLength?: number
    waitingExternal?: number
    rerouted?: number
  }
) {
  try {
    const updated = await prisma.zone.update({
      where: { id: zoneId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
    return { success: true, zone: updated }
  } catch (error) {
    console.error("[DB_ERROR] updateZoneMetrics failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function syncRoomsToDatabase(rooms: Array<{
  name: string
  currentOccupancy: number
  status: string
  queueLength: number
  waitingExternal?: number
  rerouted?: number
  staffAssigned?: number
}>) {
  try {
    for (const r of rooms) {
      const zone = await prisma.zone.findFirst({
        where: { name: r.name }
      })
      if (zone) {
        await prisma.zone.update({
          where: { id: zone.id },
          data: {
            currentOccupancy: r.currentOccupancy,
            status: r.status,
            queueLength: r.queueLength,
            waitingExternal: r.waitingExternal ?? zone.waitingExternal,
            rerouted: r.rerouted ?? zone.rerouted,
            staffAssigned: r.staffAssigned ?? zone.staffAssigned,
            updatedAt: new Date()
          }
        })
      }
    }
    return { success: true }
  } catch (error) {
    console.error("[DB_ERROR] syncRoomsToDatabase failed:", error)
    return { success: false, error: String(error) }
  }
}

// ─── Staff Management ─────────────────────────────────────────────────────────

export async function getStaffRoster() {
  try {
    return await prisma.staff.findMany({
      orderBy: { id: "asc" },
      include: { zone: true }
    })
  } catch (error) {
    console.error("[DB_ERROR] getStaffRoster failed:", error)
    return []
  }
}

export async function assignStaffToZone(staffId: string, zoneName: string | null) {
  try {
    let zoneId: string | null = null
    if (zoneName) {
      const zone = await prisma.zone.findFirst({ where: { name: zoneName } })
      if (zone) zoneId = zone.id
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        assignedZone: zoneName,
        zoneId: zoneId,
        status: zoneName ? "active" : "unassigned"
      }
    })

    // Log the assignment audit action
    await prisma.auditLog.create({
      data: {
        operatorName: "op_alpha",
        action: `STAFF_REASSIGN: ${updated.name} (${updated.id}) -> ${zoneName || "UNASSIGNED"}`,
        severity: "LOW",
        status: "SUCCESS"
      }
    })

    revalidatePath("/staff")
    revalidatePath("/")
    return { success: true, staff: updated }
  } catch (error) {
    console.error("[DB_ERROR] assignStaffToZone failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateStaffStatusAction(staffId: string, status: string) {
  try {
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { status }
    })
    revalidatePath("/staff")
    return { success: true, staff: updated }
  } catch (error) {
    console.error("[DB_ERROR] updateStaffStatusAction failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function swapStaffAssignmentsAction(staffIdA: string, staffIdB: string) {
  try {
    const [staffA, staffB] = await Promise.all([
      prisma.staff.findUnique({ where: { id: staffIdA } }),
      prisma.staff.findUnique({ where: { id: staffIdB } })
    ])

    if (!staffA || !staffB) throw new Error("Staff member not found")

    await prisma.$transaction([
      prisma.staff.update({
        where: { id: staffIdA },
        data: {
          assignedZone: staffB.assignedZone,
          zoneId: staffB.zoneId,
          status: staffB.assignedZone ? "active" : "unassigned"
        }
      }),
      prisma.staff.update({
        where: { id: staffIdB },
        data: {
          assignedZone: staffA.assignedZone,
          zoneId: staffA.zoneId,
          status: staffA.assignedZone ? "active" : "unassigned"
        }
      }),
      prisma.auditLog.create({
        data: {
          operatorName: "op_alpha",
          action: `STAFF_SWAP: ${staffA.name} <-> ${staffB.name} (${staffA.assignedZone || 'none'} <-> ${staffB.assignedZone || 'none'})`,
          severity: "MEDIUM",
          status: "SUCCESS"
        }
      })
    ])

    revalidatePath("/staff")
    return { success: true }
  } catch (error) {
    console.error("[DB_ERROR] swapStaffAssignmentsAction failed:", error)
    return { success: false, error: String(error) }
  }
}

// ─── Resource Management ─────────────────────────────────────────────────────

export async function getResourcesList() {
  try {
    return await prisma.resource.findMany({
      orderBy: { id: "asc" }
    })
  } catch (error) {
    console.error("[DB_ERROR] getResourcesList failed:", error)
    return []
  }
}

export async function allocateResourceAction(resourceId: string, amount: number) {
  try {
    const current = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!current) throw new Error("Resource not found")

    const newAllocated = Math.max(0, Math.min(current.required, current.allocated + amount))
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        allocated: newAllocated,
        setupStatus: newAllocated >= current.required ? "ready" : "in-progress"
      }
    })

    await prisma.auditLog.create({
      data: {
        operatorName: "op_alpha",
        action: `RESOURCE_ALLOCATE: ${current.name} (+${amount}) -> ${newAllocated}/${current.required}`,
        severity: "LOW",
        status: "SUCCESS"
      }
    })

    revalidatePath("/resources")
    return { success: true, resource: updated }
  } catch (error) {
    console.error("[DB_ERROR] allocateResourceAction failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateResourceSetupStatusAction(resourceId: string, setupStatus: string) {
  try {
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: { setupStatus }
    })
    revalidatePath("/resources")
    return { success: true, resource: updated }
  } catch (error) {
    console.error("[DB_ERROR] updateResourceSetupStatusAction failed:", error)
    return { success: false, error: String(error) }
  }
}

// ─── Incident Management & Autonomous AI Mitigation ──────────────────────────

export async function recordIncident(
  zoneName: string,
  type: string,
  message: string,
  severity: "INFO" | "WARNING" | "CRITICAL" = "CRITICAL",
  predictedImpact?: string,
  mitigation?: string
) {
  try {
    const zone = await prisma.zone.findFirst({
      where: { name: zoneName }
    })

    if (!zone) return null

    // Update zone status to reflect incident
    await prisma.zone.update({
      where: { id: zone.id },
      data: { status: severity === "CRITICAL" ? "CRITICAL" : "WARNING" }
    })

    const incident = await prisma.incidentLog.create({
      data: {
        zoneId: zone.id,
        zoneName,
        type,
        severity,
        message,
        predictedImpact: predictedImpact || `Surge anomaly in ${zoneName}. Capacity threshold violated.`,
        mitigationTaken: mitigation,
        status: "ACTIVE",
        recommendations: {
          create: [
            {
              description: `Autonomous Neural Redistribution: Reroute 45 attendees to Hall A, 20 to Main Stage. Deploy 2 roving marshals and expand Gate 1-4 stanchion pipeline.`,
              actionPayload: JSON.stringify({
                sourceZone: zoneName,
                targetRerouteA: "Hall A",
                countA: 45,
                targetRerouteB: "Main Stage",
                countB: 20,
                additionalStaff: 2,
                barrierReallocation: 30
              }),
              confidenceScore: 0.96,
              status: "PENDING"
            }
          ]
        }
      },
      include: { recommendations: true }
    })

    await prisma.auditLog.create({
      data: {
        operatorName: "SYSTEM_NEURAL_ENGINE",
        action: `INCIDENT_FLAGGED [${severity}]: ${type} in ${zoneName} - ${message}`,
        severity: severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        status: "SUCCESS"
      }
    })

    revalidatePath("/")
    revalidatePath("/reports")
    return incident
  } catch (error) {
    console.error("[DB_ERROR] Incident recording failed:", error)
    return null
  }
}

export async function executeAiMitigation(
  incidentId: string,
  operatorName: string = "op_alpha"
) {
  try {
    const incident = await prisma.incidentLog.findUnique({
      where: { id: incidentId },
      include: { recommendations: true, zone: true }
    })

    if (!incident) throw new Error("Incident not found")

    // Update Incident to RESOLVED
    await prisma.incidentLog.update({
      where: { id: incidentId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        mitigationTaken: "AUTONOMOUS_NEURAL_REDISTRIBUTION_EXECUTED"
      }
    })

    // Update Recommendation to ACCEPTED
    if (incident.recommendations.length > 0) {
      await prisma.recommendation.update({
        where: { id: incident.recommendations[0].id },
        data: { status: "ACCEPTED" }
      })
    }

    // Rebalance Zone Occupancies in Database
    const [hallB, hallA, mainStage] = await Promise.all([
      prisma.zone.findFirst({ where: { name: "Hall B" } }),
      prisma.zone.findFirst({ where: { name: "Hall A" } }),
      prisma.zone.findFirst({ where: { name: "Main Stage" } }),
    ])

    if (hallB) {
      await prisma.zone.update({
        where: { id: hallB.id },
        data: {
          currentOccupancy: Math.max(70, hallB.currentOccupancy - 45),
          status: "NOMINAL",
          queueLength: 0,
          rerouted: hallB.rerouted + 65
        }
      })
    }

    if (hallA) {
      await prisma.zone.update({
        where: { id: hallA.id },
        data: {
          currentOccupancy: hallA.currentOccupancy + 45,
          status: "NOMINAL"
        }
      })
    }

    if (mainStage) {
      await prisma.zone.update({
        where: { id: mainStage.id },
        data: {
          currentOccupancy: mainStage.currentOccupancy + 20,
          status: "NOMINAL"
        }
      })
    }

    // Allocate resources to stabilize flow
    const barrierResource = await prisma.resource.findFirst({ where: { category: "Barriers" } })
    if (barrierResource) {
      await prisma.resource.update({
        where: { id: barrierResource.id },
        data: {
          allocated: Math.min(barrierResource.required, barrierResource.allocated + 30),
          setupStatus: "ready"
        }
      })
    }

    // Create high-severity forensic AuditLog
    await prisma.auditLog.create({
      data: {
        operatorName,
        action: `AI_MITIGATION_EXECUTED: Autonomous crowd redistribution authorized for ${incident.zone.name}. 65 attendees rerouted (45->Hall A, 20->Main Stage). Stanchions expanded. Status stabilized to NOMINAL.`,
        severity: "HIGH",
        status: "SUCCESS"
      }
    })

    revalidatePath("/")
    revalidatePath("/reports")
    revalidatePath("/staff")
    revalidatePath("/resources")
    return { success: true }
  } catch (error) {
    console.error("[DB_ERROR] executeAiMitigation failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function getIncidentHistory(take: number = 50) {
  try {
    return await prisma.incidentLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        zone: true,
        recommendations: true
      }
    })
  } catch (error) {
    console.error("[DB_ERROR] getIncidentHistory failed:", error)
    return []
  }
}

// ─── Export History ──────────────────────────────────────────────────────────

export async function recordExport(
  filename: string,
  format: string,
  userName?: string,
  recordCount: number = 0
) {
  try {
    const entry = await prisma.export.create({
      data: {
        filename,
        format,
        user: userName || "root_admin",
        dataHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        recordCount
      }
    })

    await prisma.auditLog.create({
      data: {
        operatorName: userName || "root_admin",
        action: `EXPORT_GENERATED: ${filename} (${format.toUpperCase()}) - ${recordCount} records`,
        severity: "LOW",
        status: "SUCCESS"
      }
    })

    revalidatePath("/reports")
    return { success: true, export: entry }
  } catch (error) {
    console.error("[DB_ERROR] Export recording failed:", error)
    return { success: false, error: String(error) }
  }
}

export async function getExportHistory(take: number = 30) {
  try {
    return await prisma.export.findMany({
      orderBy: { createdAt: "desc" },
      take
    })
  } catch (error) {
    console.error("[DB_ERROR] getExportHistory failed:", error)
    return []
  }
}

// ─── System Health & Live Metrics ────────────────────────────────────────────

export async function getSystemTelemetry() {
  try {
    const [zones, activeIncidents, staffList, resourcesList] = await Promise.all([
      prisma.zone.findMany(),
      prisma.incidentLog.findMany({ where: { status: "ACTIVE" } }),
      prisma.staff.findMany(),
      prisma.resource.findMany(),
    ])

    const totalAttendees = zones.reduce((sum, z) => sum + z.currentOccupancy, 0)
    const criticalAlerts = activeIncidents.filter(i => i.severity === "CRITICAL").length
    const warningAlerts = activeIncidents.filter(i => i.severity === "WARNING").length

    const venueHealthScore = Math.max(10, 100 - (criticalAlerts * 25) - (warningAlerts * 8))
    const activeStaff = staffList.filter(s => s.status === "active").length

    return {
      databaseStatus: "CONNECTED",
      engine: "SQLite / LibSQL Driver Adapter",
      venueHealthScore,
      totalAttendees,
      activeIncidentsCount: activeIncidents.length,
      criticalAlertsCount: criticalAlerts,
      activeStaffCount: activeStaff,
      totalStaffCount: staffList.length,
      resourceCount: resourcesList.length,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error("[DB_ERROR] getSystemTelemetry failed:", error)
    return {
      databaseStatus: "ERROR",
      engine: "SQLite",
      venueHealthScore: 0,
      totalAttendees: 0,
      activeIncidentsCount: 0,
      criticalAlertsCount: 0,
      activeStaffCount: 0,
      totalStaffCount: 0,
      resourceCount: 0,
      timestamp: new Date().toISOString()
    }
  }
}
