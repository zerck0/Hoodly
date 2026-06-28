import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Vote,
  Users,
  Clock,
  Trash2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Inbox,
  Lock,
  Plus,
  Loader2,
} from 'lucide-react';
import { votesApi } from '../../services/api/votes';
import { zonesApi } from '../../services/api/zones';
import { toast } from 'sonner';

const formatDateTimeLocal = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

export default function VotesPage() {
  const queryClient = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [newIsAnonymous, setNewIsAnonymous] = useState(true);
  const [newExpirationDate, setNewExpirationDate] = useState(() => {
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return formatDateTimeLocal(defaultDate);
  });

  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'all-for-votes'],
    queryFn: () => zonesApi.getAll({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (body: {
      zoneId: string;
      title: string;
      description?: string;
      options: string[];
      expirationDate?: string;
      isAnonymous?: boolean;
    }) => votesApi.create(body),
    onSuccess: () => {
      toast.success('Le scrutin a été créé et publié avec succès !');
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewOptions(['', '']);
      setNewIsAnonymous(true);
      setNewExpirationDate(() => {
        const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return formatDateTimeLocal(defaultDate);
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de la création du scrutin';
      toast.error(msg);
    },
  });

  const { data: votes, isLoading: loadingVotes, refetch } = useQuery({
    queryKey: ['votes', 'zone', selectedZoneId],
    queryFn: () => votesApi.getAllByZone(selectedZoneId),
    enabled: selectedZoneId !== 'all' && selectedZoneId !== '',
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => votesApi.close(id),
    onSuccess: () => {
      toast.success('Le scrutin a été clos avec succès !');
      queryClient.invalidateQueries({ queryKey: ['votes'] });
    },
    onError: () => {
      toast.error('Erreur lors de la clôture du vote');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => votesApi.delete(id),
    onSuccess: () => {
      toast.success('Le scrutin a été supprimé !');
      queryClient.invalidateQueries({ queryKey: ['votes'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du vote');
    },
  });

  const handleClose = (id: string) => {
    if (window.confirm('Voulez-vous clore manuellement ce scrutin ? Les habitants ne pourront plus voter.')) {
      closeMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce scrutin ?')) {
      deleteMutation.mutate(id);
    }
  };

  const zonesList = zonesData?.zones || [];

  const handleAddOption = () => {
    setNewOptions([...newOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (newOptions.length <= 2) {
      toast.error('Un scrutin nécessite au moins 2 options');
      return;
    }
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const opts = [...newOptions];
    opts[index] = value;
    setNewOptions(opts);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    const filteredOptions = newOptions.map((opt) => opt.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      toast.error('Veuillez fournir au moins 2 options valides');
      return;
    }

    const expirationDate = new Date(newExpirationDate).toISOString();

    createMutation.mutate({
      zoneId: selectedZoneId,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      options: filteredOptions,
      expirationDate,
      isAnonymous: newIsAnonymous,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Vote className="text-indigo-400" />
              Centre de Scrutin & Sondages
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Supervisez les consultations citoyennes, sondages et referendums organisés par quartiers
            </p>
          </div>
          {selectedZoneId !== 'all' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-4"
              >
                <Plus size={14} className="mr-1.5" />
                Lancer un scrutin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-gray-800 bg-gray-900 text-gray-300 hover:text-white h-9 text-xs px-4"
              >
                <RefreshCw size={14} className="mr-1.5" />
                Rafraîchir
              </Button>
            </div>
          )}
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Sélectionnez un quartier</p>
              <p className="text-xs text-gray-400">Les votes sont des consultations strictement locales rattachées à un périmètre</p>
            </div>
            <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
              <SelectTrigger className="w-full sm:w-[260px] bg-gray-950 border-gray-800 text-gray-200">
                <SelectValue placeholder="Choisir un quartier..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-gray-200">
                <SelectItem value="all">Choisir...</SelectItem>
                {zonesList.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.nom} ({zone.ville})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedZoneId === 'all' ? (
          <Card className="bg-gray-900/40 border-dashed border-gray-800 py-16 text-center text-gray-500">
            <Inbox size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm font-semibold">Veuillez sélectionner un quartier ci-dessus pour charger les scrutins.</p>
          </Card>
        ) : loadingVotes ? (
          <div className="text-center py-16 text-gray-500">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            Chargement des referendums locaux...
          </div>
        ) : !votes || votes.length === 0 ? (
          <div className="text-center py-16 text-gray-500 italic border-dashed border border-gray-800 rounded-xl bg-gray-900/30">
            <AlertCircle size={32} className="text-gray-600 mx-auto mb-3" />
            Aucun scrutin ou referendum n'est actuellement en cours dans ce quartier.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {votes.map((vote) => {
              const id = vote.id || vote._id;
              const isActive = vote.statut === 'actif';
              const totalVotes = vote.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

              return (
                <Card key={id} className="bg-gray-900 border-gray-800 overflow-hidden shadow-xl hover:border-gray-750 transition-all">
                  <div className="bg-gray-950/40 px-6 py-4 border-b border-gray-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-white text-base">{vote.titre}</h3>
                        <Badge className={`text-[9px] px-2 rounded ${
                          isActive ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {isActive ? 'Scrutin Actif' : 'Clôturé'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{vote.description}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {isActive && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="border-gray-850 hover:bg-gray-800 text-[10px] h-7 px-2.5 font-bold"
                          onClick={() => id && handleClose(id)}
                          disabled={closeMutation.isPending}
                        >
                          <Lock size={10} className="mr-1" />
                          Clore
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] h-7 px-2.5 font-bold"
                        onClick={() => id && handleDelete(id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={10} className="mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-4 text-xs text-gray-400 bg-gray-950/20 p-3 rounded-lg border border-gray-850/60 max-w-sm">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                        <Users size={13} className="text-indigo-400" />
                        <span>{totalVotes} participants</span>
                      </div>
                      <span className="text-gray-700">|</span>
                      <div className="flex items-center gap-1.5 font-semibold text-gray-300">
                        <Clock size={13} className="text-amber-400" />
                        <span>Fermeture le {new Date(vote.expirationDate).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}</span>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-indigo-400" /> Résultats partiels
                      </p>
                      {vote.options.map((option, idx) => {
                        const optVotes = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-gray-200">{option.texte}</span>
                              <span className="text-gray-400">{optVotes} voix ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-850">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Vote className="text-indigo-400" size={20} />
              Lancer une consultation locale
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs">
              Les résidents de ce quartier verront cette consultation immédiatement sur leur fil d'actualités et pourront voter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="vote-title" className="text-xs text-gray-400 font-bold uppercase">Question ou titre</Label>
              <Input
                id="vote-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ex: Souhaitez-vous installer des panneaux solaires ?"
                className="bg-gray-900 border-gray-800 focus:ring-indigo-500 text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vote-desc" className="text-xs text-gray-400 font-bold uppercase">Description / Contexte</Label>
              <textarea
                id="vote-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ajoutez des détails pour aider vos voisins à faire leur choix..."
                className="w-full min-h-[80px] rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-light text-gray-200 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vote-exp" className="text-xs text-gray-400 font-bold uppercase">Date & Heure de clôture du scrutin</Label>
              <Input
                id="vote-exp"
                type="datetime-local"
                value={newExpirationDate}
                onChange={(e) => setNewExpirationDate(e.target.value)}
                className="bg-gray-900 border-gray-800 focus:ring-indigo-500 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400 font-bold uppercase block">Options de réponse</Label>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {newOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="bg-gray-900 border-gray-800 focus:ring-indigo-500 text-white flex-1 h-9 text-xs"
                      required
                    />
                    {newOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-9 w-9 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold p-0 h-auto bg-transparent hover:bg-transparent"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter une option</span>
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-850">
              <input
                type="checkbox"
                id="vote-is-anon"
                checked={newIsAnonymous}
                onChange={(e) => setNewIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-gray-800 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer bg-gray-950"
              />
              <div className="flex-1">
                <Label htmlFor="vote-is-anon" className="block text-xs font-bold text-gray-200 cursor-pointer select-none">
                  Scrutin Anonyme
                </Label>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Les votes de chaque citoyen resteront confidentiels.
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-gray-850 pt-4 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-500 hover:text-white text-xs h-10 px-4"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 text-xs"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Création...
                  </>
                ) : (
                  'Lancer le scrutin'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
