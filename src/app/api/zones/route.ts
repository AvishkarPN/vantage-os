import { NextResponse } from "next/server"
import { getZones, syncRoomsToDatabase, updateZoneMetrics } from "@/actions/dbActions"

export async function GET() {
  const zones = await getZones()
  return NextResponse.json({ zones })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (Array.isArray(body.rooms)) {
      await syncRoomsToDatabase(body.rooms)
      return NextResponse.json({ success: true, message: "Rooms synchronized to database" })
    }
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { zoneId, ...metrics } = body
    if (!zoneId) {
      return NextResponse.json({ success: false, error: "zoneId required" }, { status: 400 })
    }
    const result = await updateZoneMetrics(zoneId, metrics)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
