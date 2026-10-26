import { NextResponse } from "next/server"
import { getIncidentHistory, recordIncident } from "@/actions/dbActions"

export async function GET() {
  const incidents = await getIncidentHistory()
  return NextResponse.json({ incidents })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { zoneName, type, message, severity, predictedImpact, mitigation } = body

    if (!zoneName || !type || !message) {
      return NextResponse.json({ success: false, error: "zoneName, type, and message required" }, { status: 400 })
    }

    const incident = await recordIncident(
      zoneName,
      type,
      message,
      severity || "CRITICAL",
      predictedImpact,
      mitigation
    )

    return NextResponse.json({ success: true, incident })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
