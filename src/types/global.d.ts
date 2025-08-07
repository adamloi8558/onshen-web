// Global type definitions

declare global {
  interface Window {
    turnstile?: {
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        'timeout-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
        tabindex?: number;
        'response-field'?: boolean;
        'response-field-name'?: string;
        retry?: 'auto' | 'never';
        'retry-interval'?: number;
        'refresh-expired'?: 'auto' | 'manual' | 'never';
        language?: string;
        appearance?: 'always' | 'execute' | 'interaction-only';
        execution?: 'render' | 'execute';
      }) => string;
      execute: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
    turnstileConfig?: {
      siteKey: string;
    };
  }
}

export {};