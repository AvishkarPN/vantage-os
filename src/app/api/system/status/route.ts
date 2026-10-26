import { NextResponse } from "next/server"
import { getSystemTelemetry } from "@/actions/dbActions"

export async function GET() {
  const telemetry = await getSystemTelemetry()
  return NextResponse.json({
    status: telemetry.databaseStatus === "CONNECTED" ? "HEALTHY" : "DEGRADED",
    telemetry
  })
}
