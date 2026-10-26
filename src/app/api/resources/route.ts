import { NextResponse } from "next/server"
import {
  getResourcesList,
  allocateResourceAction,
  updateResourceSetupStatusAction
} from "@/actions/dbActions"

export async function GET() {
  const resources = await getResourcesList()
  return NextResponse.json({ resources })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, resourceId, amount, setupStatus } = body

    if (action === "allocate") {
      const res = await allocateResourceAction(resourceId, Number(amount))
      return NextResponse.json(res)
    }

    if (action === "setupStatus") {
      const res = await updateResourceSetupStatusAction(resourceId, setupStatus)
      return NextResponse.json(res)
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
