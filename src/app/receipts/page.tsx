"use client";

import { useState, useEffect } from "react";
import { PaymentReceipt } from "@/ap2/types";
import { ReceiptCard } from "@/components/receipt-card";
import { getReceipts } from "@/lib/client-store";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "failure">("all");

  useEffect(() => {
    const loadReceipts = () => {
      setReceipts(getReceipts());
      setLoading(false);
    };
    loadReceipts();
    const interval = setInterval(loadReceipts, 2000);
    return () => clearInterval(interval);
  }, []);

  const filtered = receipts.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const stats = {
    total: receipts.length,
    success: receipts.filter((r) => r.status === "success").length,
    failed: receipts.filter((r) => r.status !== "success").length,
    volume: receipts
      .filter((r) => r.status === "success")
      .reduce((sum, r) => sum + r.amount.value, 0),
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-subtle">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-semibold text-white mb-1">
              Receipts
            </h1>
            <p className="text-[14px] text-[#5e5e5e]">
              AP2 payment history with audit trails
            </p>
          </div>
          {receipts.length > 0 && (
            <button
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(receipts, null, 2)],
                  { type: "application/json" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `payagent-receipts-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#9b9b9b] transition-colors hover:text-white"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              Export JSON
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total },
            { label: "Success", value: stats.success },
            { label: "Failed", value: stats.failed },
            { label: "Volume", value: `$${stats.volume.toFixed(2)}` },
          ].map((stat) => (
            <div key={stat.label} className="uni-card text-center py-3">
              <p className="text-[18px] font-semibold text-white">
                {stat.value}
              </p>
              <p className="text-[11px] text-[#5e5e5e] mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {(["all", "success", "failure"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={{
                background:
                  filter === f ? "var(--accent-soft)" : "var(--surface)",
                color: filter === f ? "var(--accent)" : "#9b9b9b",
                border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Receipt List */}
        {loading ? (
          <div className="text-center py-12 text-[#5e5e5e] text-[14px]">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="uni-card-lg text-center py-10">
            <p className="text-[15px] text-[#9b9b9b]">
              {receipts.length === 0
                ? "No receipts yet. Complete a transaction to see them here."
                : "No matching receipts."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((receipt) => (
              <ReceiptCard key={receipt.paymentId} receipt={receipt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
