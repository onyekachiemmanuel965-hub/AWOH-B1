import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from './payment-provider';
import { toMinorUnits } from '../common/money';

const NETWORK_RETRIES = 3;
const RETRY_BASE_MS = 400;

@Injectable()
export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = 'paystack';
  private readonly logger = new Logger(PaystackPaymentProvider.name);

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

  private networkDetail(err: unknown): string {
    if (!(err instanceof Error)) return 'unknown network error';
    if (err.cause instanceof Error) return err.cause.message;
    // Node undici often puts code on cause as a plain object
    const cause = err.cause as { code?: string; message?: string } | undefined;
    if (cause?.code) return cause.code;
    if (cause?.message) return cause.message;
    return err.message;
  }

  private async sleep(ms: number) {
    await new Promise((r) => setTimeout(r, ms));
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    label: string,
  ): Promise<Response> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= NETWORK_RETRIES; attempt++) {
      try {
        return await fetch(url, init);
      } catch (err) {
        lastErr = err;
        const detail = this.networkDetail(err);
        this.logger.warn(
          `Paystack ${label} network error (attempt ${attempt}/${NETWORK_RETRIES}): ${detail}`,
        );
        if (attempt < NETWORK_RETRIES) {
          await this.sleep(RETRY_BASE_MS * attempt);
        }
      }
    }
    throw lastErr;
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    let res: Response;
    try {
      res = await this.fetchWithRetry(
        `${this.baseUrl()}/transaction/initialize`,
        {
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
        },
        'initialize',
      );
    } catch (err) {
      throw new BadGatewayException(
        `Unable to reach Paystack (${this.networkDetail(err)}). Check your internet connection and try again.`,
      );
    }
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
        json.message || 'Unable to initialize payment with Paystack.',
      );
    }
    return {
      reference: json.data.reference || input.reference,
      accessCode: json.data.access_code || '',
      authorizationUrl: json.data.authorization_url,
    };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    let res: Response;
    try {
      res = await this.fetchWithRetry(
        `${this.baseUrl()}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${this.secret()}` },
        },
        'verify',
      );
    } catch (err) {
      throw new BadGatewayException(
        `Unable to reach Paystack to verify payment (${this.networkDetail(err)}). Try again.`,
      );
    }
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
        json.message || 'Unable to verify payment with Paystack.',
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
