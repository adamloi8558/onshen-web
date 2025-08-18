"use client";

import { useEffect, useState } from 'react';
import Turnstile from 'react-turnstile';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

export default function TurnstileWidget({ onSuccess, onError }: TurnstileWidgetProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('TurnstileWidget mounting...');
    setIsClient(true);
  }, []);

  console.log('TurnstileWidget render - isClient:', isClient);

  if (!isClient) {
    return (
      <div className="h-16 w-full bg-muted animate-pulse rounded flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading Turnstile...</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Turnstile
        sitekey="1x00000000000000000000AA"
        onVerify={onSuccess}
        onError={onError}
        onExpire={() => {
          console.log('Turnstile expired');
        }}
        theme="light"
        size="normal"
        retry="auto"
        refreshExpired="auto"
      />
    </div>
  );
}