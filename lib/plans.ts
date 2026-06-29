export type Plan = {
  id: string;
  name: string;
  tagline: string;
  priceRub: number;
  clicks: number;
  highlight?: boolean;
  badge?: string;
};

export const PLANS: Plan[] = [
  { id: "start", name: "Старт", tagline: "Для пробы сервиса", priceRub: 390, clicks: 36 },
  { id: "creator", name: "Креатор", tagline: "Для серии товаров", priceRub: 990, clicks: 105 },
  {
    id: "studio",
    name: "Студия",
    tagline: "Оптимальный выбор",
    priceRub: 2490,
    clicks: 300,
    highlight: true,
    badge: "Выбирают 67%",
  },
  { id: "business", name: "Бизнес", tagline: "Максимум возможностей", priceRub: 6490, clicks: 900 },
];

export function findPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
