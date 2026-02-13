import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (id) {
    const receipt =
      store.getReceiptById(id) || store.getReceiptByMandateId(id);
    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ receipt });
  }

  const receipts = store.getReceipts();
  return NextResponse.json({
    receipts,
    count: receipts.length,
  });
}
