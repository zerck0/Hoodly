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
  dateFin: string;
  zoneId: string;
  createurId: string;
  statut: 'actif' | 'clos';
  createdAt: string;
}
