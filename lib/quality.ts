export type Quality = "eco" | "standard" | "premium";

export type QualityPreset = {
  id: Quality;
  label: string;
  description: string;
  size: number;
  costMultiplier: number;
  /** Дополнения к финальному промпту — детализация, освещение, чёткость. */
  promptBoost: string;
  /** Использовать ли «enhance» / большие модели у провайдеров. */
  enhance: boolean;
};

export const QUALITY_PRESETS: Record<Quality, QualityPreset> = {
  eco: {
    id: "eco",
    label: "Эконом",
    description: "Быстро · 768×768",
    size: 768,
    costMultiplier: 1,
    promptBoost: "",
    enhance: false,
  },
  standard: {
    id: "standard",
    label: "Стандарт",
    description: "Оптимально · 1024×1024",
    size: 1024,
    costMultiplier: 1,
    promptBoost: " High detail product photography, sharp focus, accurate colors.",
    enhance: true,
  },
  premium: {
    id: "premium",
    label: "Премиум",
    description: "Максимум · 1536×1536",
    size: 1536,
    costMultiplier: 2,
    promptBoost:
      " Ultra-detailed editorial product photography, razor-sharp focus, perfect studio lighting, " +
      "accurate material rendering (fabric weave, glass reflections, metallic specularity), " +
      "subtle film grain, marketplace hero shot, 8k quality.",
    enhance: true,
  },
};

export const DEFAULT_QUALITY: Quality = "standard";

export function getQualityPreset(id: string | undefined | null): QualityPreset {
  if (id && id in QUALITY_PRESETS) return QUALITY_PRESETS[id as Quality];
  return QUALITY_PRESETS[DEFAULT_QUALITY];
}
