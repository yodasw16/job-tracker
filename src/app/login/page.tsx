import { configured } from "@/lib/supabase/server";
import LoginForm from "./login-form";
export default function LoginPage() {
  return <LoginForm ready={configured()} />;
}
