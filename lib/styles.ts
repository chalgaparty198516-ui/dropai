export type Style = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  emoji: string;
};

export const STYLES: Style[] = [
  {
    id: "studio-white",
    label: "Студия — белый фон",
    description: "Классическая карточка для маркетплейса",
    emoji: "◻",
    prompt:
      "Place the product on a clean pure-white seamless studio background, soft even lighting from front-top, subtle realistic contact shadow beneath, photorealistic product photography for an e-commerce marketplace listing, sharp focus, high detail, no text, no watermarks.",
  },
  {
    id: "studio-gradient",
    label: "Студия — градиент",
    description: "Светлый градиентный фон, премиум",
    emoji: "◐",
    prompt:
      "Place the product on a soft light gradient background blending warm beige to pale lavender, gentle directional studio lighting, soft long shadow, premium product photography, no text, no watermarks.",
  },
  {
    id: "lifestyle",
    label: "Интерьер / lifestyle",
    description: "Товар в реальной обстановке",
    emoji: "🏠",
    prompt:
      "Place the product naturally inside a tasteful modern home interior scene appropriate to the product category, warm natural window light, shallow depth of field, lifestyle marketplace photography, photorealistic, no text, no watermarks.",
  },
  {
    id: "infographic",
    label: "Инфографика",
    description: "С выносками и характеристиками",
    emoji: "📊",
    prompt:
      "Place the product on a clean off-white background and add minimalist tasteful infographic annotations highlighting 3-4 key product features with thin lines and small icons, professional e-commerce design, modern sans-serif typography, no fake claims, photorealistic product.",
  },
  {
    id: "nature",
    label: "Природа / органика",
    description: "Зелёный, древесина, текстуры",
    emoji: "🌿",
    prompt:
      "Place the product on a natural surface with soft greenery and warm wood tones, gentle sunlight, organic eco-friendly mood, photorealistic, no text, no watermarks.",
  },
  {
    id: "dark-premium",
    label: "Тёмный премиум",
    description: "Чёрный фон, контрастный свет",
    emoji: "◼",
    prompt:
      "Place the product on a deep matte black backdrop with dramatic rim lighting and a subtle reflective surface beneath, premium luxury product photography, sharp focus, no text, no watermarks.",
  },
  {
    id: "luxury-card",
    label: "Премиум карточка",
    description: "Заголовок + преимущества + мрамор",
    emoji: "✨",
    prompt:
      "Re-photograph the EXACT product from the reference image — preserve its identity, shape, colors, pattern and key details with high fidelity. Place it on the LEFT HALF of the frame on polished veined marble, against a deep dark velvet background with soft warm vignette, dramatic three-point lighting (warm key, cool fill) and faint golden bokeh in the far background. The RIGHT HALF of the frame must stay clean and empty — just the velvet+bokeh background, NO text, NO labels, NO objects, NO graphics. Editorial fine-art product photography for a premium brand, exquisite material detail, sharp focus, gentle film grain, no watermarks.",
  },
];

export const DEFAULT_STYLE_ID = "studio-white";
export const CLICK_COST = 3;
