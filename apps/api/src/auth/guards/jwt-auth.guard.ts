import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Bypassing authentication for development
  canActivate(
    context: import('@nestjs/common').ExecutionContext,
  ): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    console.log('--- JWT Auth Guard Bypassed ---');
    const request = context.switchToHttp().getRequest();

    // Attach a mock user to the request so controllers can access req.user.id
    request.user = {
      id: 'clmockuser12345678901234567',
      email: 'dev@test.com',
      role: 'ADMIN',
    };

    return true;
  }
}
