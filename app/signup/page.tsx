import { AuthScreen } from "@/components/auth/auth-screen";
import { configuredOAuthProviders } from "@/auth";

export default function SignupPage() {
  return <AuthScreen mode="signup" providers={configuredOAuthProviders()} />;
}
