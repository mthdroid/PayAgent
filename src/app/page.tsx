"use client";

import { useState, useRef, useEffect } from "react";
import {
  IntentMandate,
  CartMandate,
  MerchantService,
  PaymentMethod,
  PaymentReceipt,
  AuditEntry,
} from "@/ap2/types";

interface Message {
  role: "user" | "agent" | "system";
  content: string;
  data?: Record<string, unknown>;
}

interface FlowState {
  transactionId?: string;
  intent?: IntentMandate;
  cart?: CartMandate;
  services?: MerchantService[];
  selectedService?: MerchantService;
  paymentMethods?: PaymentMethod[];
  receipt?: PaymentReceipt;
  auditTrail: AuditEntry[];
  step:
    | "idle"
    | "processing"
    | "awaiting_confirmation"
    | "settling"
    | "complete"
    | "failed";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [flowState, setFlowState] = useState<FlowState>({
    auditTrail: [],
    step: "idle",
  });
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMessage });
    setLoading(true);
    setFlowState((prev) => ({ ...prev, step: "processing" }));

    addMessage({
      role: "system",
      content: "Shopping Agent analyzing your request...",
    });

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, walletAddress, maxBudget: 10 }),
      });

      const data = await res.json();

      if (data.status === "error") {
        addMessage({ role: "agent", content: data.error });
        setFlowState((prev) => ({ ...prev, step: "failed" }));
        setLoading(false);
        return;
      }

      setFlowState({
        transactionId: data.transactionId,
        intent: data.intent,
        cart: data.cart,
        services: data.services,
        selectedService: data.selectedService,
        paymentMethods: data.paymentMethods,
        auditTrail: data.auditTrail,
        step: "awaiting_confirmation",
      });

      addMessage({
        role: "agent",
        content: `Found a matching service.\n\n${data.selectedService.name} by ${data.selectedService.merchant}\n${data.selectedService.description}\n\nPrice: $${data.selectedService.price.value.toFixed(2)} ${data.selectedService.price.currency}\nPayment: x402 on SKALE\nIntent: ${data.intent.intentId}\nCart: ${data.cart.contents.id}`,
        data: { intent: data.intent, cart: data.cart },
      });
    } catch (error) {
      addMessage({
        role: "agent",
        content: `Connection error: ${(error as Error).message}`,
      });
      setFlowState((prev) => ({ ...prev, step: "failed" }));
    }

    setLoading(false);
  };

  const handleConfirm = async (simulateFailure = false) => {
    if (!flowState.cart) return;

    setLoading(true);
    setFlowState((prev) => ({ ...prev, step: "settling" }));

    addMessage({
      role: "system",
      content: simulateFailure
        ? "Simulating expired cart failure..."
        : "Settling payment via x402...",
    });

    try {
      const res = await fetch("/api/orchestrate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: flowState.transactionId,
          cart: flowState.cart,
          walletAddress,
          simulateFailure,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setFlowState((prev) => ({
          ...prev,
          receipt: data.receipt,
          step: "complete",
        }));

        addMessage({
          role: "agent",
          content: `Payment confirmed.\n\nTx: ${data.receipt.transactionHash}\nAmount: $${data.receipt.amount.value.toFixed(2)} ${data.receipt.amount.currency}\nMerchant: ${data.receipt.merchantConfirmationId}\n\nView details in Flow and Receipts tabs.`,
          data: { receipt: data.receipt },
        });
      } else {
        setFlowState((prev) => ({
          ...prev,
          receipt: data.receipt,
          step: "failed",
        }));

        const reason =
          data.receipt?.auditTrail?.slice(-1)[0]?.data?.error ||
          data.error ||
          "Unknown error";
        addMessage({
          role: "agent",
          content: `Payment failed.\n\nReason: ${reason}\n\nThe audit trail captures exactly where the transaction failed.`,
          data: { receipt: data.receipt },
        });
      }
    } catch (error) {
      addMessage({
        role: "agent",
        content: `Settlement error: ${(error as Error).message}`,
      });
      setFlowState((prev) => ({ ...prev, step: "failed" }));
    }

    setLoading(false);
  };

  const handleReset = () => {
    setMessages([]);
    setFlowState({ auditTrail: [], step: "idle" });
    setInput("");
  };

  // Idle state — show the centered swap-like card
  if (messages.length === 0) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex flex-col items-center bg-gradient-subtle">
        {/* Hero */}
        <div className="mt-16 mb-10 text-center">
          <h1 className="text-[40px] font-semibold text-white leading-tight mb-3">
            Buy any digital service
            <br />
            <span className="text-emerald-400">with one message</span>
          </h1>
          <p className="text-[#9b9b9b] text-[16px] max-w-md mx-auto">
            AI-powered commerce with AP2 authorization and x402 settlement on
            SKALE
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-[480px] px-4">
          <div className="uni-card-lg">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-medium text-white">
                What do you need?
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-[#5e5e5e]">
                  AP2 + x402
                </span>
              </div>
            </div>

            {/* Input Row */}
            <form onSubmit={handleSubmit}>
              <div className="uni-row mb-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="I need real-time weather data for my app..."
                  className="w-full bg-transparent text-white text-[16px] placeholder-[#5e5e5e] resize-none h-[72px]"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[12px] text-[#5e5e5e]">
                    Powered by AI Shopping Agent
                  </span>
                  <span className="text-[12px] text-[#5e5e5e]">
                    Budget: $10.00
                  </span>
                </div>
              </div>

              {/* AP2 Flow Preview */}
              <div className="flex items-center gap-2 mb-4 px-1">
                {["Intent", "Cart", "Pay", "Receipt"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                        }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[11px] text-[#5e5e5e]">
                        {step}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className="flex-1 h-px"
                        style={{ background: "var(--border)" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!input.trim()}
                className={`w-full py-4 rounded-2xl text-[16px] font-semibold transition-all ${
                  input.trim()
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.99]"
                    : "text-[#5e5e5e] cursor-not-allowed"
                }`}
                style={
                  !input.trim()
                    ? { background: "var(--surface-2)" }
                    : undefined
                }
              >
                {input.trim() ? "Find Service" : "Enter a request"}
              </button>
            </form>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {[
              "Weather data API",
              "AI image generation",
              "Sentiment analysis",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 rounded-full text-[13px] text-[#9b9b9b] transition-colors hover:text-white"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chat state — messages + actions
  return (
    <div className="min-h-[calc(100vh-72px)] flex flex-col max-w-[640px] mx-auto px-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                msg.role === "user"
                  ? "text-white"
                  : msg.role === "system"
                    ? "text-[#5e5e5e] text-[13px]"
                    : "text-[#e0e0e0]"
              }`}
              style={
                msg.role === "user"
                  ? { background: "var(--accent)" }
                  : msg.role === "system"
                    ? { background: "transparent" }
                    : {
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }
              }
            >
              {msg.role === "agent" && (
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-4 h-4 rounded-md flex items-center justify-center"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M3 5l1.5 1.5L7 3.5"
                        stroke="#10b981"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    PayAgent
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="pb-6">
        {flowState.step === "awaiting_confirmation" && !loading && (
          <div className="uni-card mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-[#9b9b9b]">
                Confirm purchase
              </span>
              <span className="text-[13px] font-medium text-white">
                $
                {flowState.cart?.contents.paymentRequest.details.total.amount.value.toFixed(
                  2
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors active:scale-[0.99]"
              >
                Confirm & Pay
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="px-4 py-3.5 rounded-2xl text-[13px] font-medium transition-colors"
                style={{
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                }}
              >
                Fail
              </button>
            </div>
          </div>
        )}

        {(flowState.step === "complete" || flowState.step === "failed") &&
          !loading && (
            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-colors mb-3"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "white",
              }}
            >
              New Transaction
            </button>
          )}

        {flowState.step !== "awaiting_confirmation" && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you need..."
              className="flex-1 px-4 py-3.5 rounded-2xl text-[14px] text-white placeholder-[#5e5e5e]"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3.5 rounded-2xl text-[14px] font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
