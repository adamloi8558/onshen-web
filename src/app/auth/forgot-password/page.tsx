import { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน",
  description: "รีเซ็ตรหัสผ่าน Ronglakorn ของคุณ",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">ลืมรหัสผ่าน</h1>
          <p className="mt-2 text-slate-600">
            กรอกเบอร์โทรศัพท์เพื่อรีเซ็ตรหัสผ่าน
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <ForgotPasswordForm />
        </div>

        <div className="text-center text-sm text-slate-600">
          จำรหัสผ่านได้แล้ว?{" "}
          <Link 
            href="/auth/login" 
            className="font-medium text-primary hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}