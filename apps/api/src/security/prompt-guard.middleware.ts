// apps/api/src/security/prompt-guard.middleware.ts
/**
 * Prompt Injection & Security Firewall Middleware (Roaa Ashraf - Vertical Slice 06).
 * Defends against prompt injections, jailbreaks, DML/tenant manipulation, and XML data pollution.
 */
import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const FORBIDDEN_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /set\s+local\s+app\.current_tenant_id/i,
  /current_setting\s*\(\s*['"]app\.current_tenant_id/i,
  /exec\s+xp_cmdshell/i,
  /drop\s+table/i,
  /truncate\s+table/i,
  /alter\s+table/i,
  /union\s+select/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
];

@Injectable()
export class PromptGuardMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PromptGuardMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const promptCandidate = req.body?.prompt || req.body?.message || req.body?.query || '';

      if (typeof promptCandidate === 'string' && promptCandidate.trim().length > 0) {
        for (const pattern of FORBIDDEN_INJECTION_PATTERNS) {
          if (pattern.test(promptCandidate)) {
            this.logger.warn(`Prompt injection pattern detected and blocked: ${pattern.source}`);
            throw new BadRequestException({
              statusCode: 400,
              error: 'SecurityGuardrailTriggered',
              message: 'Prompt contains unauthorized injection or privilege escalation instructions.',
            });
          }
        }

        // Sanitize external supplier/user text by wrapping with XML boundaries if flagged
        if (req.body?.external_data && typeof req.body.external_data === 'string') {
          req.body.external_data = `<untrusted_data>${req.body.external_data.replace(/<\/?[^>]+(>|$)/g, '')}</untrusted_data>`;
        }
      }
    }

    next();
  }
}
