import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useTurnstile() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleTurnstileSuccess = (event: CustomEvent) => {
      console.log('Turnstile success:', event.detail);
      setTurnstileToken(event.detail);
      setIsLoading(false);
    };

    const handleTurnstileError = (event: CustomEvent) => {
      console.error('Turnstile error:', event.detail);
      toast.error("การยืนยันไม่สำเร็จ กรุณาลองใหม่");
      setTurnstileToken("");
      setIsLoading(false);
    };

    const handleTurnstileExpired = () => {
      console.warn('Turnstile expired');
      toast.warning("การยืนยันหมดอายุ กรุณาลองใหม่");
      setTurnstileToken("");
      setIsLoading(false);
    };

    const handleTurnstileTimeout = () => {
      console.warn('Turnstile timeout');
      toast.error("การยืนยันใช้เวลานานเกินไป กรุณาลองใหม่");
      setTurnstileToken("");
      setIsLoading(false);
    };

    document.addEventListener('turnstileSuccess', handleTurnstileSuccess as EventListener);
    document.addEventListener('turnstileError', handleTurnstileError as EventListener);
    document.addEventListener('turnstileExpired', handleTurnstileExpired as EventListener);
    document.addEventListener('turnstileTimeout', handleTurnstileTimeout as EventListener);
    
    return () => {
      document.removeEventListener('turnstileSuccess', handleTurnstileSuccess as EventListener);
      document.removeEventListener('turnstileError', handleTurnstileError as EventListener);
      document.removeEventListener('turnstileExpired', handleTurnstileExpired as EventListener);
      document.removeEventListener('turnstileTimeout', handleTurnstileTimeout as EventListener);
    };
  }, []);

  const resetTurnstile = () => {
    if (typeof window !== 'undefined' && window.turnstile) {
      try {
        window.turnstile.reset();
        setTurnstileToken("");
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to reset Turnstile:', error);
      }
    }
  };

  return {
    turnstileToken,
    isLoading,
    resetTurnstile,
    setTurnstileToken
  };
}