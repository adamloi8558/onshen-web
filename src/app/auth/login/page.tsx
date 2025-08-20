import { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบ โรงละคร เพื่อดูหนังและซีรี่ย์คุณภาพ HD",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-slate-600">
            ยินดีต้อนรับกลับสู่ โรงละคร
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>


      </div>
    </div>
  );
}