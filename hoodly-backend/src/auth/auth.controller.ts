/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtGuard } from './guards/jwt.guard';
import { UserResponseDto } from './dto/user-response.dto';
import type { Request } from 'express';

// Namespace des claims custom injectés par l'Action Auth0 Post-Login
const AUTH0_NAMESPACE = 'https://api.hoodly.fr';

interface IAuth0JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

@Controller('auth')
@UseGuards(JwtGuard)
export class AuthController {
  constructor(private usersService: UsersService) {}

  /**
   * POST /api/auth/me
   * Appelé par le frontend juste après le login Auth0.
   * Délègue la logique métier au UsersService.
   */
  @Post('me')
  async syncUser(@Req() req: Request): Promise<UserResponseDto> {
    const payload = req.user as IAuth0JwtPayload;
    return await this.usersService.syncFromAuth0(payload.sub, {
      email:
        (payload[`${AUTH0_NAMESPACE}/email`] as string) ||
        payload.email ||
        payload.sub,
      name: (payload[`${AUTH0_NAMESPACE}/name`] as string) || payload.name,
      picture:
        (payload[`${AUTH0_NAMESPACE}/picture`] as string) || payload.picture,
    });
  }

  /**
   * GET /api/auth/me
   * Retourne le profil du user connecté depuis MongoDB.
   */
  @Get('me')
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const payload = req.user as IAuth0JwtPayload;
    return await this.usersService.getProfileByAuth0Id(payload.sub);
  }
}
