import { BadRequestException } from '@nestjs/common';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

export function requireOrg(user?: TokenPayload): string {
  if (!user?.orgId) {
    throw new BadRequestException('Keine aktive Organisation gewaehlt');
  }
  return user.orgId;
}
