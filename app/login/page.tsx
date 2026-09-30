import { AuthScreen } from "@/components/auth-screen";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { reason } = await searchParams;
  return <AuthScreen mode="login" reason={Array.isArray(reason) ? reason[0] : reason} />;
}
