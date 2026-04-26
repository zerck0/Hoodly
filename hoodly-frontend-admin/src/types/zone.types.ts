export interface IZoneResponse {
  id: string;
  nom: string;
  ville: string;
  polygone?: {
    type: string;
    coordinates: number[][][];
  };
  createdPar?: string;
  statut: 'active' | 'inactive';
  membresCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IZonesListResponse {
  zones: IZoneResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ICreateZoneDto {
  nom: string;
  ville: string;
  polygone: {
    type: string;
    coordinates: number[][][];
  };
}

export interface IUpdateZoneDto {
  nom?: string;
  ville?: string;
  polygone?: {
    type: string;
    coordinates: number[][][];
  };
  statut?: string;
}

export interface IZoneRequestResponse {
  id: string;
  userId: {
    _id: string;
    name?: string;
    nom?: string;
    prenom?: string;
    email: string;
    location?: {
      type: string;
      coordinates: number[];
    };
  };
  nomQuartier: string;
  ville: string;
  codePostal: string;
  description: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  statut: 'en_attente' | 'accepte' | 'refuse';
  commentaireAdmin?: string;
  traitePar?: string;
  traiteLe?: string;
  createdAt: string;
}

export interface IZoneMembershipResponse {
  id: string;
  userId: {
    _id: string;
    nom?: string;
    prenom?: string;
    email: string;
  };
  zoneId: {
    _id: string;
    nom: string;
    ville: string;
  };
  justificatifUrl: string;
  pieceIdentiteUrl: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  commentaireAdmin?: string;
  traitePar?: string;
  traiteLe?: string;
  createdAt: string;
}

export interface IZoneStatsResponse {
  zone: IZoneResponse;
  membersCount: number;
  incidentsCount: number;
  activeIncidentsCount: number;
  eventsCount: number;
  servicesCount: number;
}