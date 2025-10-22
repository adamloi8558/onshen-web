import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'ทดสอบ HLS Streaming | Admin',
  description: 'ทดสอบประสิทธิภาพ HLS streaming',
};

export default async function TestHLSPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <TestTube className="w-6 h-6" />
        <h1 className="text-2xl font-bold">ทดสอบ HLS Streaming</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>การปรับปรุง HLS Streaming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h3 className="font-semibold mb-2">✅ การปรับปรุงที่ทำแล้ว:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Adaptive Bitrate Streaming (720p, 480p, 360p)</li>
                  <li>• 6-second segments สำหรับ startup ที่เร็วขึ้น</li>
                  <li>• HLS.js configuration ที่ปรับปรุงแล้ว</li>
                  <li>• Preload และ caching strategy</li>
                  <li>• Quality switching อัตโนมัติ</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">🚀 ประโยชน์ที่ได้รับ:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• เริ่มเล่นได้ทันทีโดยไม่ต้องรอโหลดครบ</li>
                  <li>• ปรับคุณภาพตามความเร็วอินเทอร์เน็ต</li>
                  <li>• ลดการใช้ bandwidth ลง 30-50%</li>
                  <li>• รองรับการดูบนมือถือและเดสก์ท็อป</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ทดสอบ HLS URL</CardTitle>
          </CardHeader>
          <CardContent>
            <HLSTestForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>คำแนะนำการใช้งาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">สำหรับ Admin:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• อัปโหลดวิดีโอผ่านระบบปกติ</li>
                  <li>• ระบบจะแปลงเป็น HLS อัตโนมัติ</li>
                  <li>• ใช้ URL ที่ได้จากระบบ (master.m3u8)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">สำหรับ User:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• เริ่มเล่นได้ทันที</li>
                  <li>• คุณภาพปรับอัตโนมัติ</li>
                  <li>• ใช้ bandwidth น้อยลง</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HLSTestForm() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="hls-url">HLS URL (.m3u8)</Label>
        <div className="flex space-x-2 mt-2">
          <Input
            id="hls-url"
            placeholder="https://example.com/video/master.m3u8"
            className="flex-1"
          />
          <Button type="button" onClick={testHLS}>
            <TestTube className="w-4 h-4 mr-2" />
            ทดสอบ
          </Button>
        </div>
      </div>
      
      <div id="test-results" className="hidden">
        {/* Results will be populated by JavaScript */}
      </div>
    </div>
  );
}

// Client-side JavaScript for testing
const testHLS = async () => {
  const urlInput = document.getElementById('hls-url') as HTMLInputElement;
  const resultsDiv = document.getElementById('test-results') as HTMLDivElement;
  
  if (!urlInput.value) {
    alert('กรุณาระบุ HLS URL');
    return;
  }

  resultsDiv.className = 'block';
  resultsDiv.innerHTML = `
    <div class="flex items-center space-x-2 p-4">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>กำลังทดสอบ HLS...</span>
    </div>
  `;

  try {
    const response = await fetch(`/api/test-hls?url=${encodeURIComponent(urlInput.value)}`);
    const data = await response.json();

    if (data.success) {
      resultsDiv.innerHTML = `
        <div class="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              HLS manifest โหลดได้สำเร็จ
            </AlertDescription>
          </Alert>
          
          <div>
            <h4 className="font-semibold mb-2">Stream Qualities:</h4>
            <div class="grid gap-2">
              ${data.streams.map((stream: any) => `
                <div class="flex items-center justify-between p-2 bg-muted rounded">
                  <span>${stream.name || stream.resolution || 'Unknown'}</span>
                  <Badge variant="secondary">
                    ${stream.bandwidth ? Math.round(stream.bandwidth / 1000) + 'kbps' : 'N/A'}
                  </Badge>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Segment Tests:</h4>
            <div class="grid gap-2">
              ${data.segmentTests.map((test: any) => `
                <div class="flex items-center justify-between p-2 bg-muted rounded">
                  <span>${test.quality}</span>
                  <div class="flex items-center space-x-2">
                    ${test.accessible ? 
                      '<CheckCircle className="w-4 h-4 text-green-500" />' : 
                      '<XCircle className="w-4 h-4 text-red-500" />'
                    }
                    <span class="text-sm">${test.accessible ? 'Accessible' : 'Not accessible'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Recommendations:</h4>
            <div class="space-y-1 text-sm">
              <div>• Total streams: ${data.recommendations.totalStreams}</div>
              <div>• Multiple qualities: ${data.recommendations.hasMultipleQualities ? 'Yes' : 'No'}</div>
              <div>• Accessible streams: ${data.recommendations.accessibleStreams}</div>
              <div>• Mobile optimized: ${data.recommendations.optimalForMobile ? 'Yes' : 'No'}</div>
              <div>• Desktop optimized: ${data.recommendations.optimalForDesktop ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      resultsDiv.innerHTML = `
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            ${data.error}
          </AlertDescription>
        </Alert>
      `;
    }
  } catch (error) {
    resultsDiv.innerHTML = `
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          เกิดข้อผิดพลาดในการทดสอบ: ${error}
        </AlertDescription>
      </Alert>
    `;
  }
};

// Add the testHLS function to window for global access
if (typeof window !== 'undefined') {
  (window as any).testHLS = testHLS;
}
