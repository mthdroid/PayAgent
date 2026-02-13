// Claude API wrapper for Shopping Agent intelligence
// In production, this would use @anthropic-ai/sdk for real AI analysis

export interface AIAnalysis {
  description: string;
  category: string;
  suggestedServices: string[];
  confidence: number;
}

export async function analyzeUserIntent(
  userMessage: string
): Promise<AIAnalysis> {
  // If ANTHROPIC_API_KEY is available, use Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: `You are a Shopping Agent in an AP2 commerce system.
Analyze the user's request and extract what digital service they need.
Return ONLY valid JSON with this structure:
{
  "description": "clear description of what they need",
  "category": "data-api" | "ai-service" | "general",
  "suggestedServices": ["weather-pro", "ai-image-gen", "sentiment-api", "translate-pro", "geo-data"],
  "confidence": 0.0 to 1.0
}
Available services: weather-pro (weather data), ai-image-gen (image generation), sentiment-api (text analysis), translate-pro (translation), geo-data (geolocation).`,
        messages: [{ role: "user", content: userMessage }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AIAnalysis;
      }
    } catch {
      // Fall through to local analysis
    }
  }

  // Fallback: local analysis
  return localAnalyze(userMessage);
}

function localAnalyze(message: string): AIAnalysis {
  const lower = message.toLowerCase();

  if (lower.includes("weather") || lower.includes("forecast")) {
    return {
      description: "Real-time weather data API access",
      category: "data-api",
      suggestedServices: ["weather-pro"],
      confidence: 0.95,
    };
  }

  if (lower.includes("image") || lower.includes("picture") || lower.includes("generate")) {
    return {
      description: "AI image generation service",
      category: "ai-service",
      suggestedServices: ["ai-image-gen"],
      confidence: 0.9,
    };
  }

  if (lower.includes("sentiment") || lower.includes("analyze text")) {
    return {
      description: "Text sentiment analysis",
      category: "ai-service",
      suggestedServices: ["sentiment-api"],
      confidence: 0.92,
    };
  }

  if (lower.includes("translat")) {
    return {
      description: "Neural machine translation",
      category: "ai-service",
      suggestedServices: ["translate-pro"],
      confidence: 0.93,
    };
  }

  if (lower.includes("location") || lower.includes("geo")) {
    return {
      description: "Geolocation data service",
      category: "data-api",
      suggestedServices: ["geo-data"],
      confidence: 0.88,
    };
  }

  return {
    description: `Digital service: ${message}`,
    category: "general",
    suggestedServices: ["weather-pro", "ai-image-gen", "sentiment-api"],
    confidence: 0.5,
  };
}
