import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const output: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const child = spawn('npm', ['run', 'db:migrate'], { cwd: process.cwd(), shell: true });
      child.stdout.on('data', (d) => output.push(d.toString()))
      child.stderr.on('data', (d) => output.push(d.toString()))
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Migration failed with code ' + code + '\n' + output.join('')));
      });
    });
    return NextResponse.json({ success: true, output: output.join('') });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


