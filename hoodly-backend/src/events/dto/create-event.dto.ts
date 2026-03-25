export class CreateEventDto {
  titre!: string;
  categorie!: string;
  date!: Date;
  lieu!: {
    adresse?: string;
    ville?: string;
    codePostal?: string;
    latitude?: number;
    longitude?: number;
  };
  capacite!: number;
  statut?: string;
}
