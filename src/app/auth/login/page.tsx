import { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบ Ronglakorn เพื่อดูหนังและซีรี่ย์คุณภาพ HD",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-muted-foreground">
            ยินดีต้อนรับกลับสู่ Ronglakorn
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <LoginForm />
        </div>


      </div>
    </div>
  );
}