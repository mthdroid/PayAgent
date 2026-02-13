// Client-side store using localStorage
// Persists receipts across page navigations (works on Vercel serverless)

import { PaymentReceipt } from "@/ap2/types";

const RECEIPTS_KEY = "payagent_receipts";

export function saveReceipt(receipt: PaymentReceipt): void {
  const existing = getReceipts();
  // Avoid duplicates
  const filtered = existing.filter((r) => r.paymentId !== receipt.paymentId);
  filtered.unshift(receipt); // newest first
  if (typeof window !== "undefined") {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(filtered));
  }
}

export function getReceipts(): PaymentReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RECEIPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearReceipts(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(RECEIPTS_KEY);
  }
}
