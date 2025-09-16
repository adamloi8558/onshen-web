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
    if (!canvasRef.current || !value) return;

    const generateQR = async () => {
      try {
        await QRCode.toCanvas(canvasRef.current!, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
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
    if (!imgRef.current || !value) return;

    const generateQR = async () => {
      try {
        const dataURL = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        if (imgRef.current) {
          imgRef.current.src = dataURL;
        }
      } catch (error) {
        console.error('QR Code generation error:', error);
      }
    };

    generateQR();
  }, [value, size]);

  return (
    <img 
      ref={imgRef}
      className={className}
      alt="QR Code"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
