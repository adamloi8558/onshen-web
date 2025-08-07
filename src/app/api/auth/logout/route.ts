import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    // Remove auth cookie
    await removeAuthCookie();

    return NextResponse.json(
      { message: 'ออกจากระบบสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
}