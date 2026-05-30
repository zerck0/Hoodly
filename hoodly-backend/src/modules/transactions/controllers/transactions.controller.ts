import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../../core/auth/guards/verified.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { TransactionsService } from '../services/transactions.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtGuard, VerifiedGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('me')
  @ApiOperation({
    summary: "Récupérer l'historique des transactions de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des transactions récupérée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMyTransactions(@CurrentUser() user: { userId: string }) {
    return this.transactionsService.findAllForUser(user.userId);
  }
}
