import { IntentMandate, AuditEntry } from "@/ap2/types";

interface ShoppingRequest {
  userMessage: string;
  walletAddress: string;
  maxBudget?: number;
}

interface IntentAnalysis {
  description: string;
  merchants: string[] | null;
  skus: string[] | null;
  maxBudget: number | null;
  requiresRefund: boolean;
  category: string;
}

export class ShoppingAgent {
  async processRequest(req: ShoppingRequest): Promise<{
    intent: IntentMandate;
    analysis: IntentAnalysis;
    auditEntry: AuditEntry;
  }> {
    // Analyze the user's request using AI-like intent parsing
    // In production, this calls Claude API. For demo, we use smart pattern matching.
    const analysis = this.analyzeIntent(req.userMessage, req.maxBudget);

    const intentId = `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const intent: IntentMandate = {
      intentId,
      naturalLanguageDescription: analysis.description,
      merchants: analysis.merchants,
      skus: analysis.skus,
      userCartConfirmationRequired: true,
      requiresRefundability: analysis.requiresRefund,
      intentExpiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      maxBudget: analysis.maxBudget
        ? { currency: "USD", value: analysis.maxBudget }
        : req.maxBudget
          ? { currency: "USD", value: req.maxBudget }
          : undefined,
      timestamp: new Date().toISOString(),
    };

    const auditEntry: AuditEntry = {
      step: "intent_created",
      timestamp: intent.timestamp,
      agent: "ShoppingAgent",
      data: {
        intentId: intent.intentId,
        description: intent.naturalLanguageDescription,
        maxBudget: intent.maxBudget,
        walletAddress: req.walletAddress,
      },
    };

    return { intent, analysis, auditEntry };
  }

  private analyzeIntent(message: string, maxBudget?: number): IntentAnalysis {
    const lower = message.toLowerCase();

    // Weather-related
    if (
      lower.includes("weather") ||
      lower.includes("forecast") ||
      lower.includes("temperature") ||
      lower.includes("climate")
    ) {
      return {
        description:
          "Real-time weather data API access for application integration",
        merchants: null,
        skus: ["weather-pro"],
        maxBudget: maxBudget || null,
        requiresRefund: false,
        category: "data-api",
      };
    }

    // Image generation
    if (
      lower.includes("image") ||
      lower.includes("picture") ||
      lower.includes("generate") ||
      lower.includes("art") ||
      lower.includes("visual")
    ) {
      return {
        description:
          "AI-powered image generation from text prompts",
        merchants: null,
        skus: ["ai-image-gen"],
        maxBudget: maxBudget || null,
        requiresRefund: false,
        category: "ai-service",
      };
    }

    // Sentiment / NLP / Analytics
    if (
      lower.includes("sentiment") ||
      lower.includes("analyze") ||
      lower.includes("analytics") ||
      lower.includes("nlp") ||
      lower.includes("text analysis")
    ) {
      return {
        description:
          "Text sentiment analysis API with high accuracy",
        merchants: null,
        skus: ["sentiment-api"],
        maxBudget: maxBudget || null,
        requiresRefund: false,
        category: "ai-service",
      };
    }

    // Data / API generic
    if (
      lower.includes("data") ||
      lower.includes("api") ||
      lower.includes("service")
    ) {
      return {
        description: `Digital service access: ${message}`,
        merchants: null,
        skus: null,
        maxBudget: maxBudget || null,
        requiresRefund: false,
        category: "data-api",
      };
    }

    // Default: generic service request
    return {
      description: `AI-assisted service procurement: ${message}`,
      merchants: null,
      skus: null,
      maxBudget: maxBudget || null,
      requiresRefund: false,
      category: "general",
    };
  }
}
