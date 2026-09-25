import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { PaystackWebhookVerifier } from './paystack-webhook.verifier';
import { MockPaymentProvider } from './mock-payment.provider';
import { toMinorUnits } from '../common/money';

describe('Payments security helpers', () => {
  it('rejects invalid webhook signatures', () => {
    const verifier = new PaystackWebhookVerifier({
      get: () => 'whsec_test',
    } as never);
    const body = Buffer.from('{"event":"charge.success"}');
    expect(() => verifier.verifySignature(body, 'bad')).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts valid Paystack HMAC signature', () => {
    const secret = 'whsec_test';
    const verifier = new PaystackWebhookVerifier({
      get: () => secret,
    } as never);
    const body = Buffer.from('{"event":"charge.success","data":{"reference":"r1"}}');
    const sig = createHmac('sha512', secret).update(body).digest('hex');
    expect(() => verifier.verifySignature(body, sig)).not.toThrow();
  });

  it('mock provider initializes with backend amount only', async () => {
    const mock = new MockPaymentProvider();
    const amountMinor = toMinorUnits('2500.00');
    const init = await mock.initialize({
      email: 'a@example.com',
      amountMinor,
      currency: 'NGN',
      reference: 'ref_1',
      callbackUrl: 'http://localhost:3000/cb',
    });
    expect(init.reference).toBe('ref_1');
    mock.markSuccess('ref_1');
    const verified = await mock.verify('ref_1');
    expect(verified.amountMinor).toBe(amountMinor);
    expect(verified.currency).toBe('NGN');
    expect(verified.status).toBe('success');
  });

  it('rejects empty webhook signature', () => {
    const verifier = new PaystackWebhookVerifier({
      get: () => 'whsec_test',
    } as never);
    expect(() =>
      verifier.verifySignature(Buffer.from('{}'), undefined),
    ).toThrow(UnauthorizedException);
  });
});
