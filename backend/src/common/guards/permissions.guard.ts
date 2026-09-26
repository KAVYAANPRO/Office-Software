import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { ForbiddenProblemException, UnauthenticatedException } from '../errors/problem.exception';

/**
 * Deny by default (AUTH-04, tech.md §9.2). A route that declares neither @RequirePermissions
 * nor @Public is refused at runtime here as a safety net, and refused at start-up by
 * assertAllRoutesDeclarePermissions() in main.ts so the gap is caught before it ships.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!required) {
      throw new ForbiddenProblemException(
        'This route has no declared permission (add @RequirePermissions or @Public). Access denied by default.',
      );
    }

    const user = req.user;
    if (!user) throw new UnauthenticatedException();
    if (user.isSuperAdmin) return true;

    const missing = required.filter((p) => !user.permissions.has(p));
    if (missing.length > 0) {
      throw new ForbiddenProblemException(`Missing permission(s): ${missing.join(', ')}`);
    }
    return true;
  }
}
