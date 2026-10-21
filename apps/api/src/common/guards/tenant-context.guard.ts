// apps/api/src/common/guards/tenant-context.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { tenantStorage, TenantContext } from '@techzone/database';

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Look for verified JWT user attached by Auth Guard / Passport
    // Or fallback to service-to-service header for internal agent requests
    const user = request.user;
    const internalTenantId = request.headers['x-tenant-id'];

    const tenantId = user?.tenant_id || user?.tenantId || internalTenantId;
    const userId = user?.user_id || user?.sub || user?.id;
    const role = user?.role || (internalTenantId ? 'internal_service' : 'customer');

    if (!tenantId) {
      throw new ForbiddenException('Strict isolation: Missing tenant context');
    }

    const tenantContext: TenantContext = {
      tenantId: String(tenantId),
      userId: userId ? String(userId) : undefined,
      role: String(role),
    };

    // Attach to request
    request.tenantContext = tenantContext;

    // Run within AsyncLocalStorage context for automatic Prisma RLS injection
    tenantStorage.enterWith(tenantContext);

    return true;
  }
}
