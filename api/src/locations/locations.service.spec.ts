import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';

describe('LocationsService hierarchy validation', () => {
  it('resolves matching state/lga/town', async () => {
    const prisma = {
      nigTown: {
        findFirst: jest.fn().mockResolvedValue({
          id: 't1',
          lgaId: 'l1',
          name: 'Awka',
          active: true,
          lga: {
            id: 'l1',
            stateId: 's1',
            name: 'Awka South',
            active: true,
            state: { id: 's1', name: 'Anambra', active: true },
          },
        }),
      },
    };
    const service = new LocationsService(prisma as never);
    const resolved = await service.resolveValidatedAddress({
      stateId: 's1',
      lgaId: 'l1',
      townId: 't1',
      address: '12 Zik Avenue',
      deliveryInstructions: 'Blue gate',
    });
    expect(resolved.shippingState).toBe('Anambra');
    expect(resolved.shippingLga).toBe('Awka South');
    expect(resolved.shippingCity).toBe('Awka');
    expect(resolved.shippingLine1).toBe('12 Zik Avenue');
    expect(resolved.shippingNotes).toBe('Blue gate');
  });

  it('rejects town that does not belong to LGA', async () => {
    const prisma = {
      nigTown: {
        findFirst: jest.fn().mockResolvedValue({
          id: 't1',
          lgaId: 'other-lga',
          name: 'Awka',
          active: true,
          lga: {
            id: 'other-lga',
            stateId: 's1',
            name: 'Awka South',
            active: true,
            state: { id: 's1', name: 'Anambra', active: true },
          },
        }),
      },
    };
    const service = new LocationsService(prisma as never);
    await expect(
      service.resolveValidatedAddress({
        stateId: 's1',
        lgaId: 'l1',
        townId: 't1',
        address: '12 Zik Avenue',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects LGA that does not belong to State', async () => {
    const prisma = {
      nigTown: {
        findFirst: jest.fn().mockResolvedValue({
          id: 't1',
          lgaId: 'l1',
          name: 'Ikeja',
          active: true,
          lga: {
            id: 'l1',
            stateId: 'lagos',
            name: 'Ikeja',
            active: true,
            state: { id: 'lagos', name: 'Lagos', active: true },
          },
        }),
      },
    };
    const service = new LocationsService(prisma as never);
    await expect(
      service.resolveValidatedAddress({
        stateId: 'anambra',
        lgaId: 'l1',
        townId: 't1',
        address: '12 Road',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid street address characters', async () => {
    const prisma = {
      nigTown: {
        findFirst: jest.fn().mockResolvedValue({
          id: 't1',
          lgaId: 'l1',
          name: 'Awka',
          active: true,
          lga: {
            id: 'l1',
            stateId: 's1',
            name: 'Awka South',
            active: true,
            state: { id: 's1', name: 'Anambra', active: true },
          },
        }),
      },
    };
    const service = new LocationsService(prisma as never);
    await expect(
      service.resolveValidatedAddress({
        stateId: 's1',
        lgaId: 'l1',
        townId: 't1',
        address: '<script>alert(1)</script>',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
