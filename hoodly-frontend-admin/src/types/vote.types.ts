export interface IVoteOption {
  texte: string;
  votes: string[];
}

export interface IVoteResponse {
  id: string;
  _id?: string;
  titre: string;
  description: string;
  options: IVoteOption[];
  expirationDate: string;
  zoneId: string;
  createurId: string;
  statut: 'actif' | 'clos';
  createdAt: string;
}
