export interface IEventResponse {
  id: string;
  _id?: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  adresse: string;
  categorie: string;
  statut: 'planifie' | 'termine' | 'annule';
  zoneId: string;
  organisateurId: string;
  membresPresents: string[];
  createdAt: string;
}

export interface IEventsListResponse {
  events: IEventResponse[];
  total: number;
  page: number;
  totalPages: number;
}
