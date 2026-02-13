import { NextRequest, NextResponse } from "next/server";
import { ShoppingAgent } from "@/agents/shopping-agent";
import { MerchantAgent } from "@/agents/merchant-agent";
import { CredentialsProvider } from "@/agents/credentials-provider";
import { AuditEntry } from "@/ap2/types";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userMessage,
      walletAddress,
      maxBudget,
    }: {
      userMessage: string;
      walletAddress: string;
      maxBudget?: number;
    } = body;

    if (!userMessage || !walletAddress) {
      return NextResponse.json(
        { error: "Missing userMessage or walletAddress", auditTrail: [] },
        { status: 400 }
      );
    }

    const auditTrail: AuditEntry[] = [];

    // Step 1: Shopping Agent creates IntentMandate
    const shoppingAgent = new ShoppingAgent();
    const { intent, auditEntry: intentAudit } =
      await shoppingAgent.processRequest({
        userMessage,
        walletAddress,
        maxBudget,
      });
    auditTrail.push(intentAudit);

    // Step 2: Merchant Agent searches services and creates CartMandate
    const merchantAgent = new MerchantAgent();
    const services = merchantAgent.searchServices(intent);

    if (services.length === 0) {
      auditTrail.push({
        step: "no_services_found",
        timestamp: new Date().toISOString(),
        agent: "MerchantAgent",
        data: {
          intentId: intent.intentId,
          reason: "No matching services in catalog",
        },
      });

      return NextResponse.json({
        status: "error",
        error: "No matching services found for your request",
        intent,
        auditTrail,
      });
    }

    // Select the best service (first match for demo)
    const selectedService = services[0];
    const { cart, auditEntry: cartAudit } =
      await merchantAgent.createCartMandate(intent, selectedService.id);
    auditTrail.push(cartAudit);

    // Step 3: Get payment methods
    const credProvider = new CredentialsProvider();
    const paymentMethods =
      await credProvider.getPaymentMethods(walletAddress);

    // Save transaction state for confirmation step
    const txId = intent.intentId;
    store.saveTransaction({
      id: txId,
      intent,
      cart,
      createdAt: new Date().toISOString(),
    });

    // Return cart for user confirmation
    return NextResponse.json({
      status: "awaiting_confirmation",
      transactionId: txId,
      intent,
      cart,
      paymentMethods,
      services,
      selectedService,
      auditTrail,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: (error as Error).message,
        auditTrail: [],
      },
      { status: 500 }
    );
  }
}
