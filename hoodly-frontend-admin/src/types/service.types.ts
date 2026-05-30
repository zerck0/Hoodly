export interface IServiceResponse {
  id: string;
  _id?: string;
  titre: string;
  description: string;
  type: 'offre' | 'demande';
  statut: 'ouvert' | 'en_attente' | 'en_cours' | 'termine' | 'valide';
  categorie: string;
  zoneId: string;
  createurId: string | { _id: string; name?: string; email: string };
  responderId?: string;
  createdAt: string;
}

export interface IServicesListResponse {
  services: IServiceResponse[];
  total: number;
  page: number;
  totalPages: number;
}
