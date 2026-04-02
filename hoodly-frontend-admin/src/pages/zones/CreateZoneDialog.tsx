import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapPicker from '@/components/MapPicker';
import { zonesApi } from '@/services/api/zones';

interface CreateZoneDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateZoneDialog({ open, onClose }: Readonly<CreateZoneDialogProps>) {
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [polygon, setPolygon] = useState<GeoJSON.FeatureCollection | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: zonesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      handleClose();
    },
    onError: () => {
      setErrorMessage(
        "Impossible de créer votre zone, veuillez vérifier les champs et réessayer.",
      );
    },
  });

  const handleClose = () => {
    setNom('');
    setVille('');
    setPolygon(null);
    onClose();
    setErrorMessage(null);
  };

  const handleSubmit = () => {
    if (!nom.trim() || !ville.trim() || !polygon) return;

    const polygone = polygon?.features?.[0]?.geometry;

    setErrorMessage(null);
    createMutation.mutate({
      nom: nom.trim(),
      ville: ville.trim(),
      polygone: polygone as never,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5" />
            Créer une zone
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Nom du quartier
            </label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Bastille, République..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Ville
            </label>
            <Input
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex: Paris"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Périmètre du quartier
            </label>
            <MapPicker
              onChange={(geojson) => setPolygon(geojson)}
              center={[2.3522, 48.8566]}
              zoom={12}
            />
            <p className="text-xs text-gray-500">
              Dessinez le périmètre sur la carte.
            </p>
          </div>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-400">{errorMessage}</p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !nom.trim() || !ville.trim() || !polygon}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}