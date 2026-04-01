import { ApiProperty } from '@nestjs/swagger';

export class ZoneResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  ville!: string;

  @ApiProperty({ required: false })
  polygone?: {
    type: string;
    coordinates: number[][][];
  };

  @ApiProperty()
  createdPar!: string;

  @ApiProperty()
  statut!: string;

  @ApiProperty()
  membresCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
