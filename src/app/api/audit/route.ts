import { NextResponse } from "next/server"
import { getAuditLogs, logAuditAction } from "@/actions/dbActions"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const take = Number(searchParams.get("take")) || 50
  const logs = await getAuditLogs(take)
  return NextResponse.json({ logs })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { operatorName, action, severity } = body
    if (!action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 })
    }
    const result = await logAuditAction(operatorName || "root_admin", action, severity || "LOW")
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
