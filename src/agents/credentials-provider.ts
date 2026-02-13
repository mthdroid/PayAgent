import {
  CartMandate,
  PaymentMandate,
  PaymentMethod,
  AuditEntry,
} from "@/ap2/types";
import { verifyCartSignature, generateUserAuthorization } from "@/ap2/signing";
import { validateCartMandate } from "@/ap2/validation";

const SKALE_NETWORK = "eip155:324705682";
const AXIOS_USD_ADDRESS = "0x61a26022927096f444994dA1e53F0FD9487EAfcf";

export class CredentialsProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPaymentMethods(walletAddress: string): Promise<PaymentMethod[]> {
    return [
      {
        type: "x402",
        network: SKALE_NETWORK,
        asset: AXIOS_USD_ADDRESS,
        balance: "100.00", // Simulated balance
      },
    ];
  }

  async createPaymentMandate(
    cart: CartMandate,
    walletAddress: string
  ): Promise<{ mandate: PaymentMandate; auditEntry: AuditEntry }> {
    // 1. Validate cart mandate structure
    validateCartMandate(cart);

    // 2. Verify merchant signature
    const sigResult = await verifyCartSignature(cart);
    if (!sigResult.valid) {
      throw new Error(
        `Merchant signature verification failed: ${sigResult.error}`
      );
    }

    // 3. Check sufficient balance
    const methods = await this.getPaymentMethods(walletAddress);
    const x402Method = methods.find((m) => m.type === "x402");
    if (!x402Method) {
      throw new Error("No x402 payment method available");
    }

    const total = cart.contents.paymentRequest.details.total.amount.value;
    if (parseFloat(x402Method.balance) < total) {
      throw new Error(
        `Insufficient balance: ${x402Method.balance} < ${total}`
      );
    }

    // 4. Generate user authorization (simulated wallet signature)
    const userAuth = generateUserAuthorization(
      walletAddress,
      cart.contents.id,
      total
    );

    const mandate: PaymentMandate = {
      paymentMandateContents: {
        paymentMandateId: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        paymentDetailsId: cart.contents.id,
        paymentDetailsTotal: cart.contents.paymentRequest.details.total,
        paymentResponse: {
          requestId: cart.contents.id,
          methodName: "x402",
          details: {
            network: SKALE_NETWORK,
            asset: AXIOS_USD_ADDRESS,
            payerAddress: walletAddress,
          },
        },
        merchantAgent: cart.contents.merchantName,
        timestamp: new Date().toISOString(),
      },
      userAuthorization: userAuth,
    };

    const auditEntry: AuditEntry = {
      step: "payment_authorized",
      timestamp: mandate.paymentMandateContents.timestamp,
      agent: "CredentialsProvider",
      data: {
        paymentMandateId: mandate.paymentMandateContents.paymentMandateId,
        payerAddress: walletAddress,
        amount: total,
        method: "x402",
        network: SKALE_NETWORK,
        merchantSignatureVerified: true,
      },
    };

    return { mandate, auditEntry };
  }
}
