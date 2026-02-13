import * as jose from "jose";
import { CartContents, CartMandate } from "./types";
import { hashCartContents } from "./validation";

const MERCHANT_SECRET =
  process.env.MERCHANT_SIGNING_SECRET || "payagent-merchant-secret-key-2024";

function getSigningKey(): Uint8Array {
  return new TextEncoder().encode(MERCHANT_SECRET);
}

export async function signCartMandate(
  contents: CartContents
): Promise<CartMandate> {
  const cartHash = hashCartContents(contents);
  const key = getSigningKey();

  const jwt = await new jose.SignJWT({
    cart_hash: cartHash,
    cart_id: contents.id,
    merchant: contents.merchantName,
    total: contents.paymentRequest.details.total.amount.value,
    currency: contents.paymentRequest.details.total.amount.currency,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(contents.merchantName)
    .setExpirationTime("15m")
    .sign(key);

  return {
    contents,
    merchantAuthorization: jwt,
  };
}

export async function verifyCartSignature(
  cart: CartMandate
): Promise<{ valid: boolean; payload?: jose.JWTPayload; error?: string }> {
  try {
    const key = getSigningKey();
    const { payload } = await jose.jwtVerify(cart.merchantAuthorization, key);

    // Verify the cart hash matches
    const expectedHash = hashCartContents(cart.contents);
    if (payload.cart_hash !== expectedHash) {
      return { valid: false, error: "Cart hash mismatch — cart was tampered" };
    }

    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return { valid: false, error: "Merchant authorization JWT has expired" };
    }
    return {
      valid: false,
      error: `Invalid merchant signature: ${(error as Error).message}`,
    };
  }
}

export function generateUserAuthorization(
  walletAddress: string,
  cartId: string,
  amount: number
): string {
  // In production, this would be an actual wallet signature (EIP-712).
  // For the demo, we create a deterministic authorization string.
  const data = `${walletAddress}:${cartId}:${amount}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return `user_auth_0x${Math.abs(hash).toString(16).padStart(16, "0")}`;
}
