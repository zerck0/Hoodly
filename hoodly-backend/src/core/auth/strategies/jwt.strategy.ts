import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../modules/users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      audience: configService.get('AUTH0_AUDIENCE'),
      algorithms: ['RS256'],
    });
  }

  async validate(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const auth0Id = payload.sub as string;

    try {
      // Récupérer le user depuis MongoDB pour avoir son rôle
      const user = await this.usersService.getProfileByAuth0Id(auth0Id);

      // Retourner le payload enrichi avec le rôle
      return {
        ...payload,
        role: user.role,
        userId: user.id,
      };
    } catch {
      return payload;
    }
  }
}
