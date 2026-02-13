import {
  IntentMandate,
  MerchantService,
  CartContents,
  CartMandate,
  AuditEntry,
} from "@/ap2/types";
import { signCartMandate } from "@/ap2/signing";

const MERCHANT_CATALOG: MerchantService[] = [
  {
    id: "weather-pro",
    name: "WeatherPro API",
    description:
      "Real-time weather data for 200+ countries. Includes current conditions, 7-day forecast, and historical data.",
    price: { currency: "USD", value: 0.05 },
    merchant: "DataFlow Inc.",
    category: "data-api",
  },
  {
    id: "ai-image-gen",
    name: "AI Image Generation",
    description:
      "Generate high-quality images from text prompts. Supports multiple styles and resolutions up to 4K.",
    price: { currency: "USD", value: 0.1 },
    merchant: "CreativeAI Labs",
    category: "ai-service",
  },
  {
    id: "sentiment-api",
    name: "Sentiment Analysis API",
    description:
      "Analyze text sentiment with 95% accuracy. Returns positive/negative/neutral scores with confidence levels.",
    price: { currency: "USD", value: 0.02 },
    merchant: "NLP Cloud",
    category: "ai-service",
  },
  {
    id: "translate-pro",
    name: "Translation API Pro",
    description:
      "Neural machine translation for 100+ languages. Context-aware with domain specialization.",
    price: { currency: "USD", value: 0.03 },
    merchant: "LinguaAI",
    category: "ai-service",
  },
  {
    id: "geo-data",
    name: "Geolocation Data API",
    description:
      "IP-to-location, geocoding, and reverse geocoding. Accurate to city level with timezone data.",
    price: { currency: "USD", value: 0.01 },
    merchant: "DataFlow Inc.",
    category: "data-api",
  },
];

export class MerchantAgent {
  getCatalog(): MerchantService[] {
    return MERCHANT_CATALOG;
  }

  searchServices(intent: IntentMandate): MerchantService[] {
    return MERCHANT_CATALOG.filter((service) => {
      // Filter by merchant preference
      if (
        intent.merchants &&
        intent.merchants.length > 0 &&
        !intent.merchants.includes(service.merchant)
      ) {
        return false;
      }

      // Filter by SKU preference
      if (
        intent.skus &&
        intent.skus.length > 0 &&
        !intent.skus.includes(service.id)
      ) {
        return false;
      }

      // Filter by budget
      if (intent.maxBudget && service.price.value > intent.maxBudget.value) {
        return false;
      }

      return true;
    });
  }

  async createCartMandate(
    intent: IntentMandate,
    selectedServiceId: string
  ): Promise<{ cart: CartMandate; auditEntry: AuditEntry }> {
    const service = MERCHANT_CATALOG.find((s) => s.id === selectedServiceId);

    if (!service) {
      throw new Error(`Service not found: ${selectedServiceId}`);
    }

    // Verify budget constraint
    if (intent.maxBudget && service.price.value > intent.maxBudget.value) {
      throw new Error(
        `Service price ($${service.price.value}) exceeds budget ($${intent.maxBudget.value})`
      );
    }

    const cartContents: CartContents = {
      id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      merchantName: service.merchant,
      userCartConfirmationRequired: intent.userCartConfirmationRequired,
      paymentRequest: {
        methodData: [
          {
            supportedMethods: "x402",
            data: {
              network: "eip155:324705682",
              asset: "AxiosUSD",
              chainName: "SKALE Base Sepolia",
            },
          },
        ],
        details: {
          id: `order_${service.id}_${Date.now()}`,
          displayItems: [
            {
              label: service.name,
              amount: service.price,
            },
          ],
          total: {
            label: "Total",
            amount: service.price,
          },
        },
      },
      cartExpiry: new Date(Date.now() + 900000).toISOString(), // 15 minutes
    };

    // Sign the cart with merchant key (JWT)
    const cart = await signCartMandate(cartContents);

    const auditEntry: AuditEntry = {
      step: "cart_signed",
      timestamp: new Date().toISOString(),
      agent: "MerchantAgent",
      data: {
        cartId: cart.contents.id,
        merchantName: service.merchant,
        serviceName: service.name,
        total: service.price,
        expiry: cartContents.cartExpiry,
        signed: true,
      },
    };

    return { cart, auditEntry };
  }
}
