import crypto from "node:crypto";

export type RobokassaEnv = {
  merchantLogin: string;
  password1: string;
  password2: string;
  isTest: boolean;
  isConfigured: boolean;
};

export function getRobokassaEnv(): RobokassaEnv {
  return {
    merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN ?? "",
    password1: process.env.ROBOKASSA_PASSWORD1 ?? "",
    password2: process.env.ROBOKASSA_PASSWORD2 ?? "",
    isTest: process.env.ROBOKASSA_IS_TEST !== "0",
    isConfigured: Boolean(
      process.env.ROBOKASSA_MERCHANT_LOGIN &&
        process.env.ROBOKASSA_PASSWORD1 &&
        process.env.ROBOKASSA_PASSWORD2
    ),
  };
}

function md5Hex(input: string) {
  return crypto.createHash("md5").update(input, "utf8").digest("hex");
}

export type BuildPaymentUrl = {
  outSum: number;
  invId: number;
  description: string;
  shpUserId: string;
  shpPlanId: string;
};

export function buildPaymentUrl(env: RobokassaEnv, args: BuildPaymentUrl): string {
  if (!env.isConfigured) {
    throw new Error("Robokassa не настроен (нет ROBOKASSA_MERCHANT_LOGIN / PASSWORD1 / PASSWORD2)");
  }
  const outSum = args.outSum.toFixed(2);
  const shp = `Shp_planId=${args.shpPlanId}:Shp_userId=${args.shpUserId}`;
  const signature = md5Hex(
    `${env.merchantLogin}:${outSum}:${args.invId}:${env.password1}:${shp}`
  );

  const url = new URL("https://auth.robokassa.ru/Merchant/Index.aspx");
  url.searchParams.set("MerchantLogin", env.merchantLogin);
  url.searchParams.set("OutSum", outSum);
  url.searchParams.set("InvId", String(args.invId));
  url.searchParams.set("Description", args.description);
  url.searchParams.set("SignatureValue", signature);
  url.searchParams.set("Shp_planId", args.shpPlanId);
  url.searchParams.set("Shp_userId", args.shpUserId);
  url.searchParams.set("Encoding", "utf-8");
  url.searchParams.set("Culture", "ru");
  if (env.isTest) url.searchParams.set("IsTest", "1");
  return url.toString();
}

export type ResultArgs = {
  outSum: string;
  invId: string;
  signature: string;
  shpPlanId: string;
  shpUserId: string;
};

/**
 * Проверяет подпись ResultURL.
 * Robokassa формирует MD5(OutSum:InvId:Password2:Shp_planId=...:Shp_userId=...).
 * Shp_-параметры включаются в подпись в алфавитном порядке имён.
 */
export function verifyResultSignature(env: RobokassaEnv, args: ResultArgs): boolean {
  const shp = `Shp_planId=${args.shpPlanId}:Shp_userId=${args.shpUserId}`;
  const expected = md5Hex(`${args.outSum}:${args.invId}:${env.password2}:${shp}`).toUpperCase();
  return expected === args.signature.toUpperCase();
}
