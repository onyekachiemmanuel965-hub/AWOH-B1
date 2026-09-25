import { Injectable, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from './payment-provider';
import { toMinorUnits } from '../common/money';

@Injectable()
export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = 'paystack';

  constructor(private readonly config: ConfigService) {}

  private baseUrl() {
    return (
      this.config.get<string>('PAYSTACK_BASE_URL')?.replace(/\/$/, '') ||
      'https://api.paystack.co'
    );
  }

  private secret() {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new BadGatewayException('Payment provider is not configured.');
    }
    return key;
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    const res = await fetch(`${this.baseUrl()}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: Number(input.amountMinor),
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata ?? {},
      }),
    });
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        authorization_url?: string;
        access_code?: string;
        reference?: string;
      };
    };
    if (!res.ok || !json.status || !json.data?.authorization_url) {
      throw new BadGatewayException(
        json.message || 'Unable to initialize payment.',
      );
    }
    return {
      reference: json.data.reference || input.reference,
      accessCode: json.data.access_code || '',
      authorizationUrl: json.data.authorization_url,
    };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const res = await fetch(
      `${this.baseUrl()}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${this.secret()}` },
      },
    );
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        paid_at?: string | null;
        reference?: string;
      };
    };
    if (!res.ok || !json.status || !json.data) {
      throw new BadGatewayException(
        json.message || 'Unable to verify payment.',
      );
    }
    const statusRaw = (json.data.status || '').toLowerCase();
    let status: VerifyPaymentResult['status'] = 'pending';
    if (statusRaw === 'success') status = 'success';
    else if (statusRaw === 'failed') status = 'failed';
    else if (statusRaw === 'abandoned') status = 'abandoned';

    return {
      reference: json.data.reference || reference,
      status,
      amountMinor: BigInt(json.data.amount ?? 0),
      currency: json.data.currency || 'NGN',
      paidAt: json.data.paid_at ? new Date(json.data.paid_at) : null,
      rawStatus: statusRaw,
    };
  }
}

/** Convert major-unit decimal string to Paystack minor units using shared helper. */
export function majorToPaystackMinor(amount: string): bigint {
  return toMinorUnits(amount);
}
