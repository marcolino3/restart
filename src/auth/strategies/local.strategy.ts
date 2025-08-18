import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SafeUser } from '../interfaces/safe-user.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<SafeUser> {
    const user: SafeUser = await this.authService.verifyUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
