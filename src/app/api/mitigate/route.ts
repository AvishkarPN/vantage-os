import { NextResponse } from "next/server"
import { executeAiMitigation } from "@/actions/dbActions"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { incidentId, operatorName } = body

    if (!incidentId) {
      return NextResponse.json({ success: false, error: "incidentId is required" }, { status: 400 })
    }

    const result = await executeAiMitigation(incidentId, operatorName || "op_alpha")
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
