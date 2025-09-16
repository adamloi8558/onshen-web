'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeCanvas({ value, size = 200, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('QRCodeCanvas useEffect:', { value: value?.substring(0, 20) + '...', size, hasCanvas: !!canvasRef.current });
    
    if (!canvasRef.current || !value) {
      console.log('QRCodeCanvas: Missing canvas or value');
      return;
    }

    const generateQR = async () => {
      try {
        console.log('QRCodeCanvas: Generating QR Code...');
        await QRCode.toCanvas(canvasRef.current!, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        console.log('QRCodeCanvas: QR Code generated successfully');
      } catch (error) {
        console.error('QR Code generation error:', error);
      }
    };

    generateQR();
  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}

export function QRCodeDataURL({ value, size = 200, className }: QRCodeProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    console.log('QRCodeDataURL useEffect:', { value: value?.substring(0, 20) + '...', size, hasImg: !!imgRef.current });
    
    if (!imgRef.current || !value) {
      console.log('QRCodeDataURL: Missing img or value');
      return;
    }

    const generateQR = async () => {
      try {
        console.log('QRCodeDataURL: Generating QR Code...');
        const dataURL = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        console.log('QRCodeDataURL: QR Code generated, dataURL length:', dataURL.length);
        
        if (imgRef.current) {
          imgRef.current.src = dataURL;
          console.log('QRCodeDataURL: Image src set');
        }
      } catch (error) {
        console.error('QRCodeDataURL generation error:', error);
      }
    };

    generateQR();
  }, [value, size]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      ref={imgRef}
      className={className}
      alt="QR Code"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
