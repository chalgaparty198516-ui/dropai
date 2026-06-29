export type LegalEntity = {
  type: string;
  fullName: string;
  inn: string;
  city: string;
  email: string;
  website: string;
};

export function getLegalEntity(): LegalEntity {
  return {
    type: process.env.DROPAI_LEGAL_TYPE || "Самозанятый (плательщик НПД)",
    fullName: process.env.DROPAI_LEGAL_NAME || "ФИО владельца",
    inn: process.env.DROPAI_LEGAL_INN || "000000000000",
    city: process.env.DROPAI_LEGAL_CITY || "Москва",
    email: process.env.DROPAI_LEGAL_EMAIL || "hello@drop.ai",
    website: process.env.DROPAI_LEGAL_WEBSITE || "https://drop.ai",
  };
}

export const SERVICE_NAME = "DROP.AI";
export const SERVICE_TAGLINE = "AI-сервис генерации карточек товаров для маркетплейсов";
