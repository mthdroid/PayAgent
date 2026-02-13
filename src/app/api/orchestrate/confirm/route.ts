import { NextRequest, NextResponse } from "next/server";
import { CredentialsProvider } from "@/agents/credentials-provider";
import { PaymentProcessor } from "@/agents/payment-processor";
import { AuditEntry, CartMandate } from "@/ap2/types";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transactionId,
      cart,
      walletAddress,
      simulateFailure,
    }: {
      transactionId: string;
      cart: CartMandate;
      walletAddress: string;
      simulateFailure?: boolean;
    } = body;

    if (!cart || !walletAddress) {
      return NextResponse.json(
        { status: "error", error: "Missing cart or walletAddress" },
        { status: 400 }
      );
    }

    const auditTrail: AuditEntry[] = [];

    // Simulate failure mode if requested (for demo)
    if (simulateFailure) {
      // Modify cart to be expired for failure demo
      const expiredCart: CartMandate = {
        ...cart,
        contents: {
          ...cart.contents,
          cartExpiry: new Date(Date.now() - 60000).toISOString(), // Already expired
        },
      };

      try {
        const credProvider = new CredentialsProvider();
        await credProvider.createPaymentMandate(
          expiredCart,
          walletAddress
        );
      } catch (error) {
        auditTrail.push({
          step: "payment_authorization_failed",
          timestamp: new Date().toISOString(),
          agent: "CredentialsProvider",
          data: {
            error: (error as Error).message,
            reason: "CartMandate expired before payment could be authorized",
            cartExpiry: expiredCart.contents.cartExpiry,
          },
        });

        const failedReceipt = {
          paymentMandateId: `pm_failed_${Date.now()}`,
          paymentId: `txn_failed_${Date.now()}`,
          amount: cart.contents.paymentRequest.details.total.amount,
          status: "failure" as const,
          timestamp: new Date().toISOString(),
          auditTrail,
        };

        store.addReceipt(failedReceipt);

        if (transactionId) {
          store.updateTransaction(transactionId, {
            receipt: failedReceipt,
          });
        }

        return NextResponse.json({
          status: "failure",
          error: "CartMandate has expired — payment could not be authorized",
          receipt: failedReceipt,
        });
      }
    }

    // Step 3b: Create PaymentMandate
    const credProvider = new CredentialsProvider();
    const { mandate, auditEntry: paymentAudit } =
      await credProvider.createPaymentMandate(cart, walletAddress);
    auditTrail.push(paymentAudit);

    // Step 4: Payment Processor settles
    const processor = new PaymentProcessor();
    const receipt = await processor.settle(mandate, auditTrail);

    // Save to store
    store.addReceipt(receipt);
    if (transactionId) {
      store.updateTransaction(transactionId, {
        paymentMandate: mandate,
        receipt,
      });
    }

    return NextResponse.json({
      status: receipt.status,
      receipt,
      paymentMandate: mandate,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;

    const failureAudit: AuditEntry = {
      step: "processing_error",
      timestamp: new Date().toISOString(),
      agent: "PaymentProcessor",
      data: { error: errorMessage },
    };

    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
        auditTrail: [failureAudit],
      },
      { status: 500 }
    );
  }
}
