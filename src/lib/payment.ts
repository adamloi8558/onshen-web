const PAYMENT_API_BASE = 'https://barite.shengzhipay.com';
const PAYMENT_USERNAME = 'ronglakorn';
const PAYMENT_API_KEY = '3f17b5c0-7402-41cb-a2a2-dac94320dc22';

// Development mode flag - Force mock for debugging
const USE_MOCK_PAYMENT = true; // process.env.NODE_ENV === 'development';

// Create Basic Auth header
function createAuthHeader(): string {
  const credentials = `${PAYMENT_USERNAME}:${PAYMENT_API_KEY}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

export interface PaymentTransaction {
  id: number;
  ref: string;
  amount: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'error';
  created_at: string;
  paid_at: string | null;
  expired_at: string | null;
  transfer_qrcode: string;
  uuid: string;
  method: {
    id: number;
    name: string;
    type: string;
  };
}

export interface CreateTransactionResponse {
  message: string;
  qrcode: string;
  ref: string;
  amount: string;
}

export interface UserInfo {
  username: string;
  balance: string;
  fee_percentage: string;
  webhook_url: string;
}

// Import mock service
import { MockPaymentService } from './mock-payment';

export class PaymentService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${PAYMENT_API_BASE}${endpoint}`;
    
    try {
      console.log('Making payment API request:', { url, method: options.method || 'GET' });
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log('Payment API response status:', response.status);
      
      const responseData = await response.json();
      console.log('Payment API response data:', responseData);

      if (!response.ok) {
        throw new Error(`Payment API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
      }

      return responseData;
    } catch (error) {
      console.error('Payment API request failed:', error);
      throw error;
    }
  }

  static async getUserInfo(): Promise<UserInfo> {
    if (USE_MOCK_PAYMENT) {
      console.log('Using mock payment service for getUserInfo');
      return MockPaymentService.getUserInfo();
    }
    return this.makeRequest('/user/me');
  }

  static async createTransaction(amount: number, type: 'qrcode_tg' | 'qrcode_slip' = 'qrcode_slip'): Promise<CreateTransactionResponse> {
    console.log('PaymentService.createTransaction called with:', { amount, type, USE_MOCK_PAYMENT });
    
    if (USE_MOCK_PAYMENT) {
      console.log('🎭 Using MOCK payment service for createTransaction');
      const result = await MockPaymentService.createTransaction(amount, type);
      console.log('🎭 Mock payment result:', result);
      return result;
    }
    
    console.log('🌐 Using REAL payment service for createTransaction');
    return this.makeRequest('/transaction/create', {
      method: 'POST',
      body: JSON.stringify({ type, amount }),
    });
  }

  static async getTransaction(ref: string): Promise<PaymentTransaction> {
    if (USE_MOCK_PAYMENT) {
      console.log('Using mock payment service for getTransaction');
      const mockTransaction = await MockPaymentService.getTransaction(ref);
      // Convert mock to real interface
      return {
        ...mockTransaction,
        status: mockTransaction.status as 'pending' | 'paid' | 'expired' | 'cancelled' | 'error'
      };
    }
    return this.makeRequest(`/transaction/${ref}`);
  }

  static async updateWebhookUrl(webhookUrl: string): Promise<{ message: string; user: UserInfo }> {
    return this.makeRequest('/user/edit', {
      method: 'PUT',
      body: JSON.stringify({ webhook_url: webhookUrl }),
    });
  }

  static async withdraw(amount: number): Promise<{ message: string; withdrawal: { id: number; amount: string; status: string; created_at: string }; new_balance: string }> {
    return this.makeRequest('/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  static async getWithdrawHistory(page: number = 1, limit: number = 10): Promise<{ data: Array<{ id: number; amount: string; status: string; created_at: string }>; pagination: { current_page: number; per_page: number; total: number; total_pages: number; has_next: boolean; has_prev: boolean } }> {
    return this.makeRequest(`/withdraw?page=${page}&limit=${limit}`);
  }
}

// Webhook signature verification
export async function verifyWebhookSignature(ref: string, signature: string): Promise<boolean> {
  try {
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHash('sha256')
      .update(`${ref}:${PAYMENT_API_KEY}`)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function createWebhookSignature(ref: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto
    .createHash('sha256')
    .update(`${ref}:${PAYMENT_API_KEY}`)
    .digest('hex');
}