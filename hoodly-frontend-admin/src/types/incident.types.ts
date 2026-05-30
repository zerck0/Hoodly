import type { IUserResponse } from './user.types';
import type { IZoneResponse } from './zone.types';

export interface IIncidentResponse {
  id: string;
  _id?: string;
  titre: string;
  description: string;
  statut: 'ouvert' | 'en_cours' | 'resolu';
  criticite: 'faible' | 'moyenne' | 'elevee';
  categorie: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  zoneId: string | IZoneResponse;
  signaledPar: string | IUserResponse;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateIncidentStatutDto {
  statut: 'ouvert' | 'en_cours' | 'resolu';
}
