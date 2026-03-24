import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from '../../modules/users/services/users.service';
import { JwtGuard } from './guards/jwt.guard';
import { UserResponseDto } from '../../modules/users/dto/user-response.dto';
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

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(JwtGuard)
export class AuthController {
  constructor(private usersService: UsersService) {}

  @Post('me')
  @ApiOperation({ summary: 'Synchroniser le profil depuis Auth0' })
  @ApiResponse({
    status: 201,
    description: 'Profil synchronisé',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
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

  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil du user connecté' })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const payload = req.user as IAuth0JwtPayload;
    return await this.usersService.getProfileByAuth0Id(payload.sub);
  }
}
