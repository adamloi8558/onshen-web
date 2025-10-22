import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'กรุณาระบุ URL ของวิดีโอ' },
        { status: 400 }
      );
    }

    // Test HLS manifest loading
    const response = await fetch(videoUrl, {
      headers: {
        'Accept': 'application/vnd.apple.mpegurl, application/x-mpegurl, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; HLS-Test/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถโหลด HLS manifest ได้',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const manifestContent = await response.text();
    
    // Parse HLS manifest
    const lines = manifestContent.split('\n');
    const streamInfos: any[] = [];
    let currentStreamInfo: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        currentStreamInfo = {
          line: line,
          bandwidth: null,
          resolution: null,
          name: null,
          url: null
        };
        
        // Parse bandwidth
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        if (bandwidthMatch) {
          currentStreamInfo.bandwidth = parseInt(bandwidthMatch[1]);
        }
        
        // Parse resolution
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
        if (resolutionMatch) {
          currentStreamInfo.resolution = resolutionMatch[1];
        }
        
        // Parse name
        const nameMatch = line.match(/NAME="([^"]+)"/);
        if (nameMatch) {
          currentStreamInfo.name = nameMatch[1];
        }
      } else if (line && !line.startsWith('#') && currentStreamInfo) {
        currentStreamInfo.url = line;
        streamInfos.push(currentStreamInfo);
        currentStreamInfo = null;
      }
    }

    // Test segment accessibility
    const segmentTests = await Promise.allSettled(
      streamInfos.slice(0, 2).map(async (streamInfo) => {
        if (!streamInfo.url) return null;
        
        const fullUrl = videoUrl.includes('/') ? 
          videoUrl.substring(0, videoUrl.lastIndexOf('/') + 1) + streamInfo.url :
          streamInfo.url;
        
        const segmentResponse = await fetch(fullUrl, {
          method: 'HEAD',
          headers: {
            'Accept': 'application/vnd.apple.mpegurl, application/x-mpegurl, */*',
          },
        });
        
        return {
          quality: streamInfo.name || streamInfo.resolution,
          url: fullUrl,
          accessible: segmentResponse.ok,
          status: segmentResponse.status
        };
      })
    );

    const segmentResults = segmentTests
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      manifest: {
        url: videoUrl,
        accessible: true,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      },
      streams: streamInfos,
      segmentTests: segmentResults,
      recommendations: {
        totalStreams: streamInfos.length,
        hasMultipleQualities: streamInfos.length > 1,
        accessibleStreams: segmentResults.filter(s => s.accessible).length,
        optimalForMobile: streamInfos.some(s => s.bandwidth && s.bandwidth <= 1000000),
        optimalForDesktop: streamInfos.some(s => s.bandwidth && s.bandwidth >= 2000000),
      }
    });

  } catch (error) {
    console.error('HLS test error:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการทดสอบ HLS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
