import { NextResponse } from "next/server"
import { getAuditLogs, getIncidentHistory, getExportHistory, getZones, recordExport } from "@/actions/dbActions"

export async function GET() {
  const [auditLogs, incidents, exports, zones] = await Promise.all([
    getAuditLogs(100),
    getIncidentHistory(100),
    getExportHistory(50),
    getZones()
  ])

  return NextResponse.json({
    auditLogs,
    incidents,
    exports,
    zones
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { filename, format, userName, recordCount } = body
    if (!filename || !format) {
      return NextResponse.json({ success: false, error: "filename and format required" }, { status: 400 })
    }
    const result = await recordExport(filename, format, userName, recordCount)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
