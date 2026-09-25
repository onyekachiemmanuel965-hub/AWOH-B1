import { Injectable } from '@nestjs/common';
import {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from './payment-provider';
import { fromMinorUnits } from '../common/money';

/**
 * Development/test Paystack stand-in. Never used when PAYSTACK_SECRET_KEY is set
 * unless PAYSTACK_MODE=mock.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  private readonly store = new Map<
    string,
    { amountMinor: bigint; currency: string; status: 'success' | 'failed' | 'pending' }
  >();

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    this.store.set(input.reference, {
      amountMinor: input.amountMinor,
      currency: input.currency,
      status: 'pending',
    });
    return {
      reference: input.reference,
      accessCode: `mock_access_${input.reference}`,
      authorizationUrl: `${input.callbackUrl}?reference=${encodeURIComponent(input.reference)}&mock=1`,
    };
  }

  /** Test helper — mark a mock transaction successful. */
  markSuccess(reference: string) {
    const row = this.store.get(reference);
    if (row) row.status = 'success';
  }

  markFailed(reference: string) {
    const row = this.store.get(reference);
    if (row) row.status = 'failed';
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const row = this.store.get(reference);
    if (!row) {
      return {
        reference,
        status: 'failed',
        amountMinor: 0n,
        currency: 'NGN',
        paidAt: null,
        rawStatus: 'not_found',
      };
    }
    return {
      reference,
      status: row.status === 'pending' ? 'success' : row.status,
      amountMinor: row.amountMinor,
      currency: row.currency,
      paidAt: row.status !== 'failed' ? new Date() : null,
      rawStatus: row.status,
    };
  }

  describeAmount(amountMinor: bigint) {
    return fromMinorUnits(amountMinor);
  }
}
