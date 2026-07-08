import { Injectable, Logger } from '@nestjs/common';
import { AuditEntry, AuditLog } from '../../application/ports/audit-log';
import { PrismaService } from '../persistence/prisma/prisma.service';

/** Auditoría append-only sobre la tabla clinic_audit. */
@Injectable()
export class PrismaAuditLog implements AuditLog {
  private readonly logger = new Logger(PrismaAuditLog.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actor: entry.actor,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
      },
    });
    this.logger.log(`${entry.actor} ${entry.action} ${entry.entityType}:${entry.entityId}`);
  }
}
