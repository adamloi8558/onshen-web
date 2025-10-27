'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function YouTubeDownloadPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeCookies, setYoutubeCookies] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Video info from YouTube
  const [videoInfo, setVideoInfo] = useState<any>(null);
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');

  const handleGetInfo = async () => {
    if (!youtubeUrl) {
      toast({
        variant: 'destructive',
        title: 'กรุณาใส่ URL YouTube',
      });
      return;
    }

    setIsLoadingInfo(true);
    setVideoInfo(null);

    try {
      const response = await fetch('/api/admin/youtube/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถดึงข้อมูลได้');
      }

      setVideoInfo(data);
      setTitle(data.title);
      setDescription(data.description);

      toast({
        title: 'ดึงข้อมูลสำเร็จ',
        description: 'ตรวจสอบและแก้ไขข้อมูลก่อนดาวน์โหลด',
      });

    } catch (error) {
      console.error('Get info error:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลได้',
      });
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo || !title) {
      toast({
        variant: 'destructive',
        title: 'กรุณาดึงข้อมูลวิดีโอก่อน',
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch('/api/admin/youtube/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          title,
          description,
          categoryId: categoryId || undefined,
          type: contentType,
          cookies: youtubeCookies || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถดาวน์โหลดได้');
      }

      toast({
        title: 'เริ่มดาวน์โหลดแล้ว!',
        description: 'ระบบกำลังดาวน์โหลดและแปลงเป็น HLS (ใช้เวลา 5-15 นาที)',
      });

      // Redirect to content edit page
      setTimeout(() => {
        router.push(`/admin/content/${data.contentId}/edit`);
      }, 2000);

    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถดาวน์โหลดได้',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Youtube className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold">ดาวน์โหลดจาก YouTube</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>หมายเหตุ:</strong> ระบบจะดาวน์โหลดวิดีโอและแปลงเป็น HLS อัตโนมัติ 
          (ใช้เวลาประมาณ 5-15 นาที) เนื้อหาจะถูกสร้างเป็นร่างให้ตรวจสอบก่อนเผยแพร่
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูล YouTube</CardTitle>
            <CardDescription>ใส่ URL วิดีโอจาก YouTube</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isLoadingInfo || isDownloading}
                />
                <Button 
                  onClick={handleGetInfo}
                  disabled={isLoadingInfo || isDownloading}
                >
                  {isLoadingInfo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      ดึงข้อมูล
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                รองรับ: youtube.com/watch, youtu.be, youtube.com/shorts
              </p>
            </div>

            <div>
              <Label htmlFor="cookies">YouTube Cookies (ไม่บังคับ แต่แนะนำ)</Label>
              <Textarea
                id="cookies"
                value={youtubeCookies}
                onChange={(e) => setYoutubeCookies(e.target.value)}
                placeholder="Paste cookies จาก Chrome DevTools (F12 > Application > Cookies)"
                rows={3}
                className="font-mono text-xs"
                disabled={isLoadingInfo || isDownloading}
              />
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:underline">
                  📝 วิธีดึง Cookies จาก YouTube
                </summary>
                <div className="mt-2 space-y-2 text-xs text-muted-foreground bg-muted p-3 rounded">
                  <p><strong>ขั้นตอน:</strong></p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>เปิด YouTube.com ใน Chrome (ต้อง login)</li>
                    <li>กด F12 → คลิก tab "Application"</li>
                    <li>ซ้ายมือ: Storage → Cookies → https://www.youtube.com</li>
                    <li>หา cookie ชื่อ <code>__Secure-1PSID</code></li>
                    <li>Copy ค่า (ทั้งหมด) มา paste ที่นี่</li>
                  </ol>
                  <p className="mt-2 text-yellow-600">
                    ⚠️ Cookies เป็นข้อมูลส่วนตัว ใช้ในระบบนี้เท่านั้น
                  </p>
                </div>
              </details>
            </div>

            {videoInfo && (
              <>
                <div>
                  <Label htmlFor="title">ชื่อเนื้อหา *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ชื่อภาพยนตร์/ซีรีส์"
                    disabled={isDownloading}
                  />
                </div>

                <div>
                  <Label htmlFor="description">คำอธิบาย</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เนื้อเรื่องย่อ..."
                    rows={4}
                    disabled={isDownloading}
                  />
                </div>

                <div>
                  <Label htmlFor="type">ประเภท</Label>
                  <Select
                    value={contentType}
                    onValueChange={(value: 'movie' | 'series') => setContentType(value)}
                    disabled={isDownloading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">ภาพยนตร์</SelectItem>
                      <SelectItem value="series">ซีรีส์</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">หมวดหมู่ (ไม่บังคับ)</Label>
                  <Input
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="Category ID"
                    disabled={isDownloading}
                  />
                </div>

                <Button 
                  onClick={handleDownload}
                  disabled={isDownloading || !title}
                  className="w-full"
                  size="lg"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังดาวน์โหลดและแปลง...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      ดาวน์โหลดและแปลงเป็น HLS
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card>
          <CardHeader>
            <CardTitle>ตัวอย่าง</CardTitle>
            <CardDescription>ข้อมูลที่จะถูกสร้าง</CardDescription>
          </CardHeader>
          <CardContent>
            {videoInfo ? (
              <div className="space-y-4">
                {/* Thumbnail */}
                {videoInfo.thumbnailUrl && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={videoInfo.thumbnailUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">ชื่อ:</p>
                    <p className="font-medium">{title || 'ไม่มีชื่อ'}</p>
                  </div>

                  {videoInfo.author && (
                    <div>
                      <p className="text-sm text-muted-foreground">ช่อง:</p>
                      <p className="font-medium">{videoInfo.author}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">Video ID:</p>
                    <p className="font-mono text-sm">{videoInfo.videoId}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">สถานะ:</p>
                    <p className="text-yellow-600 font-medium">ร่าง (Draft)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Youtube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ใส่ URL และคลิก "ดึงข้อมูล"</p>
                <p className="text-sm mt-2">เพื่อดูตัวอย่าง</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ขั้นตอนที่ 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ดึงข้อมูลจาก YouTube (ชื่อ, thumbnail, คำอธิบาย)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ขั้นตอนที่ 2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ดาวน์โหลดวิดีโอและแปลงเป็น HLS (5-15 นาที)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ขั้นตอนที่ 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ตรวจสอบเนื้อหาและเผยแพร่
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
