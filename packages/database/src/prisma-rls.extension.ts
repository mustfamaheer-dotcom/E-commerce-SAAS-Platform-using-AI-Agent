// packages/database/src/prisma-rls.extension.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export const rlsExtension = Prisma.defineExtension((client) =>
  client.$extends({
    query: {
      $allOperations({ args, query }) {
        const context = tenantStorage.getStore();
        if (context?.tenantId) {
          return client.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(
              `SET LOCAL app.current_tenant_id = '${context.tenantId}'`
            );
            return query(args);
          });
        }
        return query(args);
      },
    },
  })
);

export function getExtendedPrismaClient(prisma: PrismaClient) {
  return prisma.$extends(rlsExtension);
}

export type ExtendedPrismaClient = ReturnType<typeof getExtendedPrismaClient>;
