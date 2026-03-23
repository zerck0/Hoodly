import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { MongoIdValidationPipe } from '../common/pipes/mongo-id-validation.pipe';

@UseGuards(JwtGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      role,
      isActive ? isActive === 'true' : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', MongoIdValidationPipe) id: string) {
    return this.usersService.deleteUser(id);
  }
}
