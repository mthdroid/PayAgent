// AP2 Protocol Types — Faithful implementation of Google's Agent-to-Payments spec

export interface IntentMandate {
  intentId: string;
  naturalLanguageDescription: string;
  merchants: string[] | null;
  skus: string[] | null;
  userCartConfirmationRequired: boolean;
  requiresRefundability: boolean;
  intentExpiry: string; // ISO 8601
  maxBudget?: { currency: string; value: number };
  timestamp: string;
}

export interface PaymentItem {
  label: string;
  amount: { currency: string; value: number };
}

export interface PaymentMethodData {
  supportedMethods: string; // "x402" | "CARD" | "crypto"
  data?: Record<string, unknown>;
}

export interface CartContents {
  id: string;
  merchantName: string;
  userCartConfirmationRequired: boolean;
  paymentRequest: {
    methodData: PaymentMethodData[];
    details: {
      id: string;
      displayItems: PaymentItem[];
      total: PaymentItem;
    };
  };
  cartExpiry: string; // ISO 8601
}

export interface CartMandate {
  contents: CartContents;
  merchantAuthorization: string; // JWT signature of cart hash
}

export interface PaymentMandate {
  paymentMandateContents: {
    paymentMandateId: string;
    paymentDetailsId: string; // links to CartMandate.contents.id
    paymentDetailsTotal: PaymentItem;
    paymentResponse: {
      requestId: string;
      methodName: string; // "x402"
      details: {
        network: string; // "eip155:324705682" (SKALE)
        asset: string; // USDC/AxiosUSD address
        payerAddress: string;
      };
    };
    merchantAgent: string;
    timestamp: string;
  };
  userAuthorization: string; // user's signature
}

export interface AuditEntry {
  step: string;
  timestamp: string;
  agent: string;
  data: Record<string, unknown>;
}

export interface PaymentReceipt {
  paymentMandateId: string;
  paymentId: string;
  amount: { currency: string; value: number };
  status: "success" | "error" | "failure";
  transactionHash?: string;
  network?: string;
  merchantConfirmationId?: string;
  timestamp: string;
  auditTrail: AuditEntry[];
}

// Merchant catalog service type
export interface MerchantService {
  id: string;
  name: string;
  description: string;
  price: { currency: string; value: number };
  merchant: string;
  category: string;
}

// Payment method available to user
export interface PaymentMethod {
  type: string;
  network: string;
  asset: string;
  balance: string;
}

// Flow state for the orchestrator
export type FlowStep = "intent" | "cart" | "payment" | "receipt";
export type FlowStatus = "pending" | "active" | "completed" | "failed";

export interface FlowState {
  currentStep: FlowStep;
  steps: {
    step: FlowStep;
    status: FlowStatus;
    data?: unknown;
    error?: string;
    timestamp?: string;
  }[];
}

// API response types
export interface OrchestrateResponse {
  status: "awaiting_confirmation" | "error";
  intent?: IntentMandate;
  cart?: CartMandate;
  paymentMethods?: PaymentMethod[];
  services?: MerchantService[];
  auditTrail: AuditEntry[];
  error?: string;
}

export interface ConfirmResponse {
  status: "success" | "failure" | "error";
  receipt?: PaymentReceipt;
  paymentMandate?: PaymentMandate;
  error?: string;
}
