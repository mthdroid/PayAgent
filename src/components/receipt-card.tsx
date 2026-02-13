"use client";

import { useState } from "react";
import { PaymentReceipt } from "@/ap2/types";

interface ReceiptCardProps {
  receipt: PaymentReceipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isSuccess = receipt.status === "success";

  return (
    <div
      className="uni-card cursor-pointer transition-all"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: isSuccess ? "var(--accent-soft)" : "var(--danger-soft)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {isSuccess ? (
                <path
                  d="M4 8l3 3 5-5"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-medium text-white">
              ${receipt.amount.value.toFixed(2)}{" "}
              <span className="text-[#5e5e5e] text-[13px] font-normal">
                {receipt.amount.currency}
              </span>
            </p>
            <p className="text-[12px] text-[#5e5e5e]">
              {new Date(receipt.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
            style={{
              background: isSuccess ? "var(--accent-soft)" : "var(--danger-soft)",
              color: isSuccess ? "var(--accent)" : "var(--danger)",
            }}
          >
            {receipt.status}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
          >
            <path
              d="M3.5 5.25l3.5 3.5 3.5-3.5"
              stroke="#5e5e5e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Details Row */}
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 text-[12px]"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div>
          <span className="text-[#5e5e5e]">Payment ID</span>
          <p className="text-[#9b9b9b] font-mono truncate">{receipt.paymentId}</p>
        </div>
        <div>
          <span className="text-[#5e5e5e]">Mandate ID</span>
          <p className="text-[#9b9b9b] font-mono truncate">
            {receipt.paymentMandateId}
          </p>
        </div>
        {receipt.transactionHash && (
          <div className="col-span-2">
            <span className="text-[#5e5e5e]">Transaction Hash</span>
            <a
              href={`https://base-sepolia-testnet-explorer.skalenodes.com/tx/${receipt.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono truncate block text-[12px]"
              onClick={(e) => e.stopPropagation()}
            >
              {receipt.transactionHash}
            </a>
          </div>
        )}
      </div>

      {/* Expanded: Audit Trail */}
      {expanded && receipt.auditTrail.length > 0 && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-[12px] font-medium text-emerald-400 mb-2">
            Audit Trail
          </p>
          <div className="space-y-1.5">
            {receipt.auditTrail.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[11px] p-2.5 rounded-lg"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background: entry.step.includes("fail")
                      ? "#ef4444"
                      : "#10b981",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{entry.step}</span>
                    <span className="text-[#5e5e5e]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[#5e5e5e]">{entry.agent}</p>
                  <pre className="json-block p-2 mt-1.5 text-[10px]">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          <details className="mt-3">
            <summary className="text-[11px] text-[#5e5e5e] cursor-pointer hover:text-[#9b9b9b]">
              Full Receipt JSON
            </summary>
            <pre className="json-block p-3 mt-1.5 text-[10px]">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
