import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Вход — DROP.AI" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const isRegister = params.tab === "register";
  return <LoginForm initialMode={isRegister ? "register" : "login"} />;
}
