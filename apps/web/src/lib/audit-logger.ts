import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
  username?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * 创建审计日志记录
 * 用于在关键操作处记录审计日志
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        userId: data.userId ?? null,
        username: data.username ?? null,
        metadata: data.metadata ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  } catch (error) {
    // 审计日志记录失败不应该影响主流程
    console.error('Failed to create audit log:', error);
  }
}

/**
 * 从请求中提取 IP 地址
 */
export function extractIpAddress(headers: Headers): string | null {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || null;
}

/**
 * 从请求中提取 User Agent
 */
export function extractUserAgent(headers: Headers): string | null {
  return headers.get('user-agent') || null;
}
