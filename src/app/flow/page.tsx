"use client";

import { useState, useEffect } from "react";
import { FlowStep } from "@/components/flow-step";
import { PaymentReceipt } from "@/ap2/types";

export default function FlowPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] =
    useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch("/api/receipts");
      const data = await res.json();
      setReceipts(data.receipts || []);
      if (data.receipts?.length > 0) {
        setSelectedReceipt(data.receipts[0]);
      }
    } catch {
      // No receipts yet
    }
    setLoading(false);
  };

  const getStepData = (receipt: PaymentReceipt, stepName: string) => {
    return receipt.auditTrail.find((e) => e.step === stepName)?.data;
  };

  const getStepStatus = (receipt: PaymentReceipt, stepName: string) => {
    const entry = receipt.auditTrail.find((e) => e.step === stepName);
    if (!entry) return "pending" as const;
    if (entry.step.includes("fail")) return "failed" as const;
    return "completed" as const;
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-subtle">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-white mb-1">
            AP2 Flow Tracker
          </h1>
          <p className="text-[14px] text-[#5e5e5e]">
            Intent &rarr; Cart &rarr; Payment &rarr; Receipt
          </p>
        </div>

        {/* No Transactions */}
        {receipts.length === 0 && !loading && (
          <div className="uni-card-lg">
            <div className="text-center py-6">
              <p className="text-[15px] text-[#9b9b9b] mb-6">
                No transactions yet. Here is a preview of the AP2 flow:
              </p>
            </div>

            <FlowStep
              number={1}
              title="IntentMandate"
              agent="Shopping Agent"
              status="completed"
              color="#3b82f6"
              data={{
                intentId: "intent_demo_abc123",
                description: "Real-time weather data API access",
                maxBudget: { currency: "USD", value: 10 },
              }}
            />
            <FlowStep
              number={2}
              title="CartMandate (Signed)"
              agent="Merchant Agent"
              status="completed"
              color="#10b981"
              data={{
                cartId: "cart_demo_xyz789",
                merchant: "DataFlow Inc.",
                service: "WeatherPro API",
                total: "$0.05",
                signed: true,
              }}
            />
            <FlowStep
              number={3}
              title="PaymentMandate"
              agent="Credentials Provider"
              status="completed"
              color="#8b5cf6"
              data={{
                mandateId: "pm_demo_def456",
                method: "x402",
                network: "SKALE Base Sepolia",
                verified: true,
              }}
            />
            <FlowStep
              number={4}
              title="Receipt"
              agent="Payment Processor"
              status="completed"
              color="#f59e0b"
              isLast
              data={{
                status: "success",
                txHash: "0xabc...def",
                amount: "$0.05",
              }}
            />
          </div>
        )}

        {/* Transaction Selector */}
        {receipts.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {receipts.map((r, i) => (
              <button
                key={r.paymentId}
                onClick={() => setSelectedReceipt(r)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                style={{
                  background:
                    selectedReceipt?.paymentId === r.paymentId
                      ? "var(--accent-soft)"
                      : "var(--surface)",
                  color:
                    selectedReceipt?.paymentId === r.paymentId
                      ? "var(--accent)"
                      : "#9b9b9b",
                  border: `1px solid ${
                    selectedReceipt?.paymentId === r.paymentId
                      ? "var(--accent)"
                      : "var(--border)"
                  }`,
                }}
              >
                #{i + 1} &middot;{" "}
                {r.status === "success" ? "Success" : "Failed"} &middot; $
                {r.amount.value.toFixed(2)}
              </button>
            ))}
          </div>
        )}

        {/* Active Flow */}
        {selectedReceipt && (
          <div className="uni-card-lg">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[15px] font-medium text-white">
                Transaction Flow
              </span>
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{
                  background:
                    selectedReceipt.status === "success"
                      ? "var(--accent-soft)"
                      : "var(--danger-soft)",
                  color:
                    selectedReceipt.status === "success"
                      ? "var(--accent)"
                      : "var(--danger)",
                }}
              >
                {selectedReceipt.status}
              </span>
            </div>

            <FlowStep
              number={1}
              title="IntentMandate Created"
              agent="Shopping Agent"
              status={getStepStatus(selectedReceipt, "intent_created")}
              color="#3b82f6"
              data={
                getStepData(selectedReceipt, "intent_created") as Record<
                  string,
                  unknown
                >
              }
            />
            <FlowStep
              number={2}
              title="CartMandate Signed"
              agent="Merchant Agent"
              status={getStepStatus(selectedReceipt, "cart_signed")}
              color="#10b981"
              data={
                getStepData(selectedReceipt, "cart_signed") as Record<
                  string,
                  unknown
                >
              }
            />
            <FlowStep
              number={3}
              title="PaymentMandate Authorized"
              agent="Credentials Provider"
              status={
                getStepStatus(selectedReceipt, "payment_authorized") ===
                "pending"
                  ? getStepStatus(
                      selectedReceipt,
                      "payment_authorization_failed"
                    )
                  : getStepStatus(selectedReceipt, "payment_authorized")
              }
              color="#8b5cf6"
              data={
                (getStepData(selectedReceipt, "payment_authorized") ||
                  getStepData(
                    selectedReceipt,
                    "payment_authorization_failed"
                  )) as Record<string, unknown>
              }
            />
            <FlowStep
              number={4}
              title={
                selectedReceipt.status === "success"
                  ? "Settlement Complete"
                  : "Settlement Failed"
              }
              agent="Payment Processor"
              status={
                selectedReceipt.status === "success" ? "completed" : "failed"
              }
              color={
                selectedReceipt.status === "success" ? "#f59e0b" : "#ef4444"
              }
              isLast
              data={
                (getStepData(selectedReceipt, "settled_on_chain") ||
                  getStepData(selectedReceipt, "settlement_failed") ||
                  getStepData(
                    selectedReceipt,
                    "mandate_validation_failed"
                  )) as Record<string, unknown>
              }
            />

            <details className="mt-4">
              <summary className="text-[12px] text-[#5e5e5e] cursor-pointer hover:text-[#9b9b9b]">
                View full receipt JSON
              </summary>
              <pre className="json-block p-4 mt-2 text-[11px]">
                {JSON.stringify(selectedReceipt, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-[#5e5e5e] text-[14px]">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
