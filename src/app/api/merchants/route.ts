import { NextResponse } from "next/server";
import { MerchantAgent } from "@/agents/merchant-agent";

export async function GET() {
  const merchantAgent = new MerchantAgent();
  const catalog = merchantAgent.getCatalog();

  return NextResponse.json({
    services: catalog,
    count: catalog.length,
  });
}
