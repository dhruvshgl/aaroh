import { AuthScreen } from "@/components/auth/auth-screen";
import { configuredOAuthProviders } from "@/auth";
import { testLoginMode } from "@/lib/test-mode";

export default function LoginPage() {
  return <AuthScreen mode="login" providers={configuredOAuthProviders()} testMode={testLoginMode} />;
}
