import { toPublicProduct } from '../catalog/catalog.mapper';
import { toPublicOrder } from '../orders/orders.mapper';
import { toCustomerDeliveryDto } from '../delivery/delivery.calculator';
import { toPublicUser } from '../auth/auth.mapper';
import {
  CUSTOMER_FORBIDDEN_FIELDS,
  containsCustomerForbiddenField,
} from './customer-privacy';
import {
  CatalogStatus,
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductAvailability,
  UserStatus,
} from '@prisma/client';

describe('Stage 09 customer privacy regression', () => {
  it('exports a non-empty forbidden field contract', () => {
    expect(CUSTOMER_FORBIDDEN_FIELDS.length).toBeGreaterThan(5);
  });

  it('public product omits weight and stock internals', () => {
    const dto = toPublicProduct({
      id: 'p1',
      subcategoryId: 's1',
      name: 'Tile',
      slug: 'tile',
      description: 'd',
      price: { toString: () => '1000.00' } as never,
      currency: 'NGN',
      status: CatalogStatus.ACTIVE,
      availability: ProductAvailability.AVAILABLE,
      stockQuantity: 99,
      weightPerCartonKg: { toString: () => '32' } as never,
      specsJson: null,
      featured: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
      subcategory: {
        id: 's1',
        categoryId: 'c1',
        name: 'Sub',
        slug: 'sub',
        description: null,
        imageUrl: null,
        status: CatalogStatus.ACTIVE,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'c1',
          name: 'Cat',
          slug: 'cat',
          description: null,
          imageUrl: null,
          status: CatalogStatus.ACTIVE,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
    expect(containsCustomerForbiddenField(dto)).toBeNull();
  });

  it('public order + delivery DTOs omit calculation internals', () => {
    const order = toPublicOrder({
      id: 'o1',
      orderNumber: 'AWOH-1',
      userId: 'u1',
      status: OrderStatus.AWAITING_DELIVERY_CONFIRMATION,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
      deliveryFee: null,
      deliveryQuoteExpiresAt: null,
      deliveryInternalJson: JSON.stringify({
        totalWeightKg: 100,
        distanceKm: 12,
        ratePerKm: 500,
        weightFactorPerKg: 0,
        surcharge: 1,
        negotiationThreshold: 999,
      }),
      deliveryConfigId: 'cfg',
      subtotal: { toString: () => '1000.00' },
      total: { toString: () => '1000.00' },
      currency: 'NGN',
      contactEmail: 'a@example.com',
      contactPhone: null,
      shippingLine1: '1 St',
      shippingCity: 'Lagos',
      shippingState: 'LA',
      shippingNotes: null,
      idempotencyKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      payments: [
        {
          id: 'pay1',
          orderId: 'o1',
          method: PaymentMethod.PAYSTACK,
          provider: 'mock',
          providerReference: 'ref',
          amount: { toString: () => '1000.00' },
          currency: 'NGN',
          status: PaymentStatus.PENDING,
          accessCode: null,
          authorizationUrl: null,
          paidAt: null,
          metadataJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      receipt: null,
    } as never);

    const delivery = toCustomerDeliveryDto(
      DeliveryFeeStatus.NEEDS_NEGOTIATION,
      null,
      'NGN',
      'Please contact the sales team',
    );

    expect(containsCustomerForbiddenField(order)).toBeNull();
    expect(containsCustomerForbiddenField(delivery)).toBeNull();
  });

  it('public user never includes passwordHash', () => {
    const user = toPublicUser({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      status: UserStatus.ACTIVE,
      role: { code: 'CUSTOMER' },
    });
    expect(containsCustomerForbiddenField(user)).toBeNull();
    expect(user).not.toHaveProperty('passwordHash');
  });
});
