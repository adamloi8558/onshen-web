import { Metadata } from "next";
import SignupForm from "@/components/auth/signup-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: "สมัครสมาชิก MovieFlix เพื่อดูหนังและซีรี่ย์คุณภาพ HD",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">สมัครสมาชิก</h1>
          <p className="mt-2 text-slate-600">
            เริ่มต้นใช้งาน MovieFlix วันนี้
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <SignupForm />
        </div>

        <div className="text-center text-sm text-slate-600">
          มีบัญชีอยู่แล้ว?{" "}
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