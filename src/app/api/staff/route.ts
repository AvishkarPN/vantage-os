import { NextResponse } from "next/server"
import {
  getStaffRoster,
  assignStaffToZone,
  updateStaffStatusAction,
  swapStaffAssignmentsAction
} from "@/actions/dbActions"

export async function GET() {
  const staff = await getStaffRoster()
  return NextResponse.json({ staff })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, staffId, zoneName, status, targetStaffId } = body

    if (action === "assign") {
      const res = await assignStaffToZone(staffId, zoneName)
      return NextResponse.json(res)
    }

    if (action === "status") {
      const res = await updateStaffStatusAction(staffId, status)
      return NextResponse.json(res)
    }

    if (action === "swap") {
      const res = await swapStaffAssignmentsAction(staffId, targetStaffId)
      return NextResponse.json(res)
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
