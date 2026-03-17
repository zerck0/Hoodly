import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // URL où Auth0 expose ses clés publiques
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Domaine Auth0 à vérifier dans le token
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      audience: configService.get('AUTH0_AUDIENCE'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: Record<string, unknown>): Record<string, unknown> {
    return payload;
  }
}
