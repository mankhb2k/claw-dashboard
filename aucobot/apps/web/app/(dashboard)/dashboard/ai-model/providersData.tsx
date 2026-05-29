import {
  GEMINI_OPENCLAW_PROVIDER,
  geminiModelsToProviderModels,
} from "@/lib/ai-models/gemini-models";
import { openAiModelsToProviderModels } from "@/lib/ai-models/openai-models";

export type ModelTier = "stable" | "preview" | "deprecated";

export interface ModelDef {
  id: string;
  name: string;
  /** OpenClaw full id, ví dụ google/gemini-2.5-flash */
  openclawId?: string;
  tier?: ModelTier;
  description?: string;
  recommended?: boolean;
  isFree?: boolean;
}

export interface CatalogSource {
  href: string;
  label: string;
  note: string;
}

export interface ProviderData {
  id: string;
  name: string;
  icon: string;
  color: string;
  envKey?: string;
  iconSrc?: string;
  /** OpenClaw provider prefix (Gemini → google). */
  openclawProviderId?: string;
  models?: ModelDef[];
  /** Link tham chiếu catalog model chính thức của provider. */
  catalogSource?: CatalogSource;
  /** Trang tạo / quản lý API key của provider. */
  apiKeyUrl?: string;
  /** Nhãn link lấy API key (mặc định: "Get API key"). */
  apiKeyLabel?: string;
}

export const APIKEY_PROVIDERS: ProviderData[] = [
  {
    id: "openai",
    name: "OpenAI",
    icon: "auto_awesome",
    iconSrc: "/models-provider-icon/ChatGPT-icon.svg",
    color: "#10A37F",
    envKey: "OPENAI_API_KEY",
    models: openAiModelsToProviderModels(),
    catalogSource: {
      href: "https://developers.openai.com/api/docs/models",
      label: "OpenAI API",
      note: "GPT-5 frontier chat/agent models (excludes image, realtime, TTS).",
    },
    apiKeyUrl: "https://platform.openai.com/api-keys",
    apiKeyLabel: "Get OpenAI API key",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "smart_toy",
    iconSrc: "/models-provider-icon/Claude-icon.svg",
    color: "#D97757",
    envKey: "ANTHROPIC_API_KEY",
    models: [
      { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
      { id: "claude-haiku-3-5", name: "Claude Haiku 3.5" },
    ],
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    apiKeyLabel: "Get Anthropic API key",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "diamond",
    color: "#4285F4",
    envKey: "GEMINI_API_KEY",
    openclawProviderId: GEMINI_OPENCLAW_PROVIDER,
    models: geminiModelsToProviderModels(),
    catalogSource: {
      href: "https://ai.google.dev/gemini-api/docs/models",
      label: "Google Gemini API",
      note: "Chat/agent models only (excludes TTS, image, video, Live).",
    },
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "bolt",
    color: "#4D6BFE",
    envKey: "DEEPSEEK_API_KEY",
    models: [
      { id: "deepseek-v3", name: "DeepSeek V3" },
      { id: "deepseek-r1", name: "DeepSeek R1" },
    ],
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    apiKeyLabel: "Get DeepSeek API key",
  },
  {
    id: "groq",
    name: "Groq",
    icon: "speed",
    color: "#F55036",
    envKey: "GROQ_API_KEY",
    models: [
      { id: "llama-3.1-70b", name: "Llama 3.1 70B" },
      { id: "mixtral-8x7b", name: "Mixtral 8x7B" },
    ],
    apiKeyUrl: "https://console.groq.com/keys",
    apiKeyLabel: "Get Groq API key",
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: "air",
    color: "#FF7000",
    envKey: "MISTRAL_API_KEY",
    models: [
      { id: "mistral-large", name: "Mistral Large" },
      { id: "codestral", name: "Codestral" },
    ],
    apiKeyUrl: "https://console.mistral.ai/api-keys/",
    apiKeyLabel: "Get Mistral API key",
  },
];

export function getProviderById(providerId: string): ProviderData | undefined {
  return APIKEY_PROVIDERS.find((p) => p.id === providerId);
}

export function getCatalogSource(
  providerId: string,
): CatalogSource | undefined {
  return getProviderById(providerId)?.catalogSource;
}
