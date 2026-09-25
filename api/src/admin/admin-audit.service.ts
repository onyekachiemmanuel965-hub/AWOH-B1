import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 30, 100);
    const where: {
      action?: string;
      entityType?: string;
    } = {};
    if (query.action?.trim()) where.action = query.action.trim();
    if (query.entityType?.trim()) where.entityType = query.entityType.trim();

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actorUserId: a.actorUserId,
        ip: a.ip,
        createdAt: a.createdAt.toISOString(),
        metadata: sanitizeMetadata(a.metadataJson),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

function sanitizeMetadata(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const blocked = [
      'password',
      'passwordhash',
      'token',
      'refreshtoken',
      'secret',
      'apikey',
      'webhook',
      'authorization',
    ];
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (blocked.some((b) => k.toLowerCase().includes(b))) continue;
      out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}
