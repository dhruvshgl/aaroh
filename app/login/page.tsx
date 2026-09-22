import { AuthScreen } from "@/components/auth/auth-screen";
import { configuredOAuthProviders } from "@/auth";

export default function LoginPage() {
  return <AuthScreen mode="login" providers={configuredOAuthProviders()} />;
}
