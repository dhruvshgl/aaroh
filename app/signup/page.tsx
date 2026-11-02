import { AuthScreen } from "@/components/auth/auth-screen";
import { configuredOAuthProviders } from "@/auth";
import { testLoginMode } from "@/lib/test-mode";

export default function SignupPage() {
  return <AuthScreen mode="signup" providers={configuredOAuthProviders()} testMode={testLoginMode} />;
}
