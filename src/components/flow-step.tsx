"use client";

import { useState } from "react";

interface FlowStepProps {
  number: number;
  title: string;
  agent: string;
  status: "pending" | "active" | "completed" | "failed";
  color: string;
  data?: Record<string, unknown>;
  isLast?: boolean;
}

export function FlowStep({
  number,
  title,
  agent,
  status,
  color,
  data,
  isLast,
}: FlowStepProps) {
  const [expanded, setExpanded] = useState(false);

  const dotColor =
    status === "completed"
      ? "#10b981"
      : status === "failed"
        ? "#ef4444"
        : status === "active"
          ? "#f59e0b"
          : "#303030";

  return (
    <div className="flex gap-4">
      {/* Timeline dot + connector */}
      <div className="flex flex-col items-center pt-1">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: dotColor }}
        />
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[32px]"
            style={{
              background:
                status === "completed"
                  ? "var(--accent)"
                  : status === "failed"
                    ? "#ef4444"
                    : "var(--border)",
              opacity: 0.3,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${!isLast ? "pb-4" : ""}`}>
        <div
          className="uni-row cursor-pointer transition-all"
          onClick={() => data && setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold"
                style={{ background: `${color}18`, color }}
              >
                {number}
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">{title}</p>
                <p className="text-[12px] text-[#5e5e5e]">{agent}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{
                  background:
                    status === "completed"
                      ? "var(--accent-soft)"
                      : status === "failed"
                        ? "var(--danger-soft)"
                        : "var(--surface-3)",
                  color:
                    status === "completed"
                      ? "var(--accent)"
                      : status === "failed"
                        ? "var(--danger)"
                        : "#5e5e5e",
                }}
              >
                {status}
              </span>
              {data && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  fill="none"
                >
                  <path
                    d="M3 4.5l3 3 3-3"
                    stroke="#5e5e5e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>

          {expanded && data && (
            <pre className="json-block p-3 mt-3 text-[11px] whitespace-pre-wrap break-all">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
