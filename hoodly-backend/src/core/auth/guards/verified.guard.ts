import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ZoneMembershipStatus } from '../../../modules/users/enums/zone-membership-status.enum';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // By-pass check for admin/moderator roles
    if (user?.role === 'admin' || user?.role === 'moderator') {
      return true;
    }

    if (user?.zoneStatut !== ZoneMembershipStatus.ACTIVE) {
      throw new ForbiddenException(
        "Votre compte n'a pas encore été vérifié. Veuillez transmettre vos justificatifs de domicile et pièce d'identité.",
      );
    }

    return true;
  }
}
