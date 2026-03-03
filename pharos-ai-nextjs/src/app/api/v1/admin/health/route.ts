import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return ok({ status: 'healthy', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    return err('DB_ERROR', 'Database connection failed', 503);
  }
}
