// In-memory store for receipts and flow state (demo purposes)
// In production, use a database

import {
  PaymentReceipt,
  IntentMandate,
  CartMandate,
  PaymentMandate,
} from "@/ap2/types";

interface TransactionRecord {
  id: string;
  intent: IntentMandate;
  cart: CartMandate;
  paymentMandate?: PaymentMandate;
  receipt?: PaymentReceipt;
  createdAt: string;
}

class Store {
  private transactions: Map<string, TransactionRecord> = new Map();
  private receipts: PaymentReceipt[] = [];

  saveTransaction(record: TransactionRecord): void {
    this.transactions.set(record.id, record);
  }

  getTransaction(id: string): TransactionRecord | undefined {
    return this.transactions.get(id);
  }

  updateTransaction(
    id: string,
    update: Partial<TransactionRecord>
  ): void {
    const existing = this.transactions.get(id);
    if (existing) {
      this.transactions.set(id, { ...existing, ...update });
    }
  }

  addReceipt(receipt: PaymentReceipt): void {
    this.receipts.push(receipt);
  }

  getReceipts(): PaymentReceipt[] {
    return [...this.receipts].reverse(); // newest first
  }

  getReceiptById(paymentId: string): PaymentReceipt | undefined {
    return this.receipts.find((r) => r.paymentId === paymentId);
  }

  getReceiptByMandateId(mandateId: string): PaymentReceipt | undefined {
    return this.receipts.find((r) => r.paymentMandateId === mandateId);
  }

  getAllTransactions(): TransactionRecord[] {
    return Array.from(this.transactions.values()).reverse();
  }
}

// Singleton
export const store = new Store();
