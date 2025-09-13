// Mock Payment Service for Development
export interface MockPaymentTransaction {
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

export interface MockCreateTransactionResponse {
  message: string;
  qrcode: string;
  ref: string;
  amount: string;
}

export interface MockUserInfo {
  username: string;
  balance: string;
  fee_percentage: string;
  webhook_url: string;
}

export class MockPaymentService {
  static async getUserInfo(): Promise<MockUserInfo> {
    // Mock user info
    return {
      username: 'ronglakorn',
      balance: '10000.00',
      fee_percentage: '2.5',
      webhook_url: process.env.NEXT_PUBLIC_APP_URL + '/api/payment/webhook' || ''
    };
  }

  static async createTransaction(amount: number, type: 'qrcode_tg' | 'qrcode_slip' = 'qrcode_slip'): Promise<MockCreateTransactionResponse> {
    // Generate mock transaction
    const ref = `MOCK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Generate mock QR code data (PromptPay format)
    const qrData = this.generateMockQRCode(amount, ref, type);
    
    return {
      message: 'Transaction created successfully',
      qrcode: qrData,
      ref: ref,
      amount: amount.toString()
    };
  }

  static async getTransaction(ref: string): Promise<MockPaymentTransaction> {
    // Mock transaction data
    return {
      id: Math.floor(Math.random() * 100000),
      ref: ref,
      amount: '100.00',
      status: 'pending',
      created_at: new Date().toISOString(),
      paid_at: null,
      expired_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      transfer_qrcode: this.generateMockQRCode(100, ref, 'qrcode_slip'),
      uuid: `uuid-${ref}`,
      method: {
        id: 1,
        name: 'PromptPay',
        type: 'qrcode_slip'
      }
    };
  }

  static async updateWebhookUrl(webhookUrl: string): Promise<{ message: string; user: MockUserInfo }> {
    const user = await this.getUserInfo();
    return {
      message: 'Webhook URL updated successfully',
      user: {
        ...user,
        webhook_url: webhookUrl
      }
    };
  }

  private static generateMockQRCode(amount: number, ref: string, type: string): string {
    // Generate mock PromptPay QR code data
    // This is a simplified version - real QR codes have more complex structure
    const typePrefix = type === 'qrcode_tg' ? 'TG' : 'PP';
    const mockQR = `00020101021230610016A000000677010112011501075360003745302101112221112030414225303764540${amount.toFixed(2).padStart(6, '0')}5802TH5908RONGLAKORN6304${typePrefix}${ref.substring(0, 2).toUpperCase()}`;
    return mockQR;
  }

  // Mock method to simulate payment completion (for testing)
  static async simulatePayment(ref: string, success: boolean = true): Promise<boolean> {
    console.log(`Mock: Simulating payment ${success ? 'success' : 'failure'} for ref: ${ref}`);
    
    // In real scenario, this would be called by payment gateway webhook
    // For now, we'll just return the result
    return success;
  }
}