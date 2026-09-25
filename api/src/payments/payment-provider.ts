export type InitializePaymentInput = {
  email: string;
  amountMinor: bigint;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
};

export type InitializePaymentResult = {
  reference: string;
  accessCode: string;
  authorizationUrl: string;
};

export type VerifyPaymentResult = {
  reference: string;
  status: 'success' | 'failed' | 'abandoned' | 'pending';
  amountMinor: bigint;
  currency: string;
  paidAt: Date | null;
  rawStatus: string;
};

export interface PaymentProvider {
  readonly name: string;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifyPaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
