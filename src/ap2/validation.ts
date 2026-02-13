import {
  IntentMandate,
  CartMandate,
  PaymentMandate,
  CartContents,
} from "./types";

export class AP2ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AP2ValidationError";
  }
}

export function validateIntentMandate(intent: IntentMandate): void {
  if (!intent.intentId) {
    throw new AP2ValidationError("Missing intentId", "INVALID_INTENT");
  }
  if (!intent.naturalLanguageDescription) {
    throw new AP2ValidationError(
      "Missing naturalLanguageDescription",
      "INVALID_INTENT"
    );
  }
  if (!intent.intentExpiry) {
    throw new AP2ValidationError("Missing intentExpiry", "INVALID_INTENT");
  }

  // Check expiry
  const expiry = new Date(intent.intentExpiry);
  if (isNaN(expiry.getTime())) {
    throw new AP2ValidationError(
      "Invalid intentExpiry format",
      "INVALID_INTENT"
    );
  }
  if (expiry < new Date()) {
    throw new AP2ValidationError("IntentMandate has expired", "INTENT_EXPIRED");
  }
}

export function validateCartMandate(cart: CartMandate): void {
  const c = cart.contents;

  if (!c.id) {
    throw new AP2ValidationError("Missing cart id", "INVALID_CART");
  }
  if (!c.merchantName) {
    throw new AP2ValidationError("Missing merchantName", "INVALID_CART");
  }
  if (!c.paymentRequest?.details?.total) {
    throw new AP2ValidationError("Missing payment total", "INVALID_CART");
  }
  if (c.paymentRequest.details.total.amount.value <= 0) {
    throw new AP2ValidationError(
      "Total amount must be positive",
      "INVALID_CART"
    );
  }
  if (!cart.merchantAuthorization) {
    throw new AP2ValidationError(
      "Missing merchantAuthorization",
      "UNSIGNED_CART"
    );
  }

  // Check cart expiry
  const expiry = new Date(c.cartExpiry);
  if (isNaN(expiry.getTime())) {
    throw new AP2ValidationError(
      "Invalid cartExpiry format",
      "INVALID_CART"
    );
  }
  if (expiry < new Date()) {
    throw new AP2ValidationError("CartMandate has expired", "CART_EXPIRED");
  }
}

export function validatePaymentMandate(mandate: PaymentMandate): void {
  const m = mandate.paymentMandateContents;

  if (!m.paymentMandateId) {
    throw new AP2ValidationError(
      "Missing paymentMandateId",
      "INVALID_PAYMENT"
    );
  }
  if (!m.paymentDetailsId) {
    throw new AP2ValidationError(
      "Missing paymentDetailsId",
      "INVALID_PAYMENT"
    );
  }
  if (!m.paymentResponse?.details?.payerAddress) {
    throw new AP2ValidationError("Missing payer address", "INVALID_PAYMENT");
  }
  if (!mandate.userAuthorization) {
    throw new AP2ValidationError(
      "Missing userAuthorization",
      "UNAUTHORIZED_PAYMENT"
    );
  }
}

export function validateMandateChain(
  intent: IntentMandate,
  cart: CartMandate,
  mandate: PaymentMandate
): void {
  // Verify cart total is within intent budget
  if (intent.maxBudget) {
    const cartTotal = cart.contents.paymentRequest.details.total.amount.value;
    if (cartTotal > intent.maxBudget.value) {
      throw new AP2ValidationError(
        `Cart total ($${cartTotal}) exceeds budget ($${intent.maxBudget.value})`,
        "BUDGET_EXCEEDED"
      );
    }
  }

  // Verify payment mandate references the correct cart
  if (mandate.paymentMandateContents.paymentDetailsId !== cart.contents.id) {
    throw new AP2ValidationError(
      "PaymentMandate does not reference the correct CartMandate",
      "MANDATE_CHAIN_BROKEN"
    );
  }

  // Verify amounts match
  const cartAmount = cart.contents.paymentRequest.details.total.amount.value;
  const paymentAmount =
    mandate.paymentMandateContents.paymentDetailsTotal.amount.value;
  if (cartAmount !== paymentAmount) {
    throw new AP2ValidationError(
      "Payment amount does not match cart total",
      "AMOUNT_MISMATCH"
    );
  }
}

export function hashCartContents(cart: CartContents): string {
  const str = JSON.stringify({
    id: cart.id,
    merchantName: cart.merchantName,
    total: cart.paymentRequest.details.total,
    items: cart.paymentRequest.details.displayItems,
    expiry: cart.cartExpiry,
  });
  // Simple hash for demo — in production, use keccak256
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(16, "0");
}
