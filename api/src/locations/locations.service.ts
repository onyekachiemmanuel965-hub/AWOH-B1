import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Street address: letters, digits, spaces, and common punctuation. */
const ADDRESS_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s.,'#/\-()&+]{1,199}$/u;

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  listStates() {
    return this.prisma.nigState.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    });
  }

  async listLgas(stateId: string) {
    const state = await this.prisma.nigState.findFirst({
      where: { id: stateId, active: true },
    });
    if (!state) throw new NotFoundException('State not found.');
    return this.prisma.nigLga.findMany({
      where: { stateId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, stateId: true },
    });
  }

  async listTowns(lgaId: string) {
    const lga = await this.prisma.nigLga.findFirst({
      where: { id: lgaId, active: true },
    });
    if (!lga) throw new NotFoundException('LGA not found.');
    return this.prisma.nigTown.findMany({
      where: { lgaId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, lgaId: true },
    });
  }

  /**
   * Authoritative hierarchy check for checkout/order address.
   * Rejects mismatched State / LGA / Town combinations.
   */
  async resolveValidatedAddress(input: {
    stateId: string;
    lgaId: string;
    townId: string;
    address: string;
    deliveryInstructions?: string | null;
  }) {
    const town = await this.prisma.nigTown.findFirst({
      where: { id: input.townId, active: true },
      include: {
        lga: {
          include: { state: true },
        },
      },
    });
    if (!town || !town.lga.active || !town.lga.state.active) {
      throw new NotFoundException('Town / city not found.');
    }
    if (town.lgaId !== input.lgaId) {
      throw new NotFoundException('Town / city does not belong to the selected LGA.');
    }
    if (town.lga.stateId !== input.stateId) {
      throw new NotFoundException('LGA does not belong to the selected State.');
    }

    const address = input.address.trim();
    if (address.length < 3 || address.length > 200) {
      throw new BadRequestException(
        'Street address must be between 3 and 200 characters.',
      );
    }
    if (!ADDRESS_PATTERN.test(address)) {
      throw new BadRequestException(
        'Street address contains invalid characters.',
      );
    }
    const instructions = input.deliveryInstructions?.trim() || null;
    if (instructions && instructions.length > 500) {
      throw new BadRequestException(
        'Delivery instructions must be at most 500 characters.',
      );
    }

    return {
      shippingStateId: town.lga.state.id,
      shippingLgaId: town.lga.id,
      shippingTownId: town.id,
      shippingState: town.lga.state.name,
      shippingLga: town.lga.name,
      shippingCity: town.name,
      shippingLine1: address,
      shippingNotes: instructions,
    };
  }
}
