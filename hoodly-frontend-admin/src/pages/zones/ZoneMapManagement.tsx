import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zonesApi } from '@/services/api/zones';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MousePointer2, Check, Loader2 } from 'lucide-react';
import type { IZoneRequestResponse } from '@/types/zone.types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function ZoneMapManagement() {
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCity, setNewZoneCity] = useState('');
  const [newZonePolygon, setNewZonePolygon] = useState<GeoJSON.Geometry | null>(null);

  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'all'],
    queryFn: () => zonesApi.getAll({ limit: 1000 })
  });
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['zone-requests'],
    queryFn: () => zonesApi.getRequests()
  });

  const bulkAcceptMutation = useMutation({
    mutationFn: (body: any) => zonesApi.bulkAcceptRequests(body),
    onSuccess: () => {
      toast.success('Quartier créé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zone-requests'] });
      setIsCreateDialogOpen(false);
      setSelectedRequestIds([]);
      draw.current?.deleteAll();
      setNewZonePolygon(null);
    },
    onError: () => toast.error('Erreur lors de la création du quartier'),
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN || '';

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.3522, 48.8566],
      zoom: 11,
    });

    m.on('load', () => {
      map.current = m;
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        defaultMode: 'draw_polygon'
      });
      m.addControl(draw.current as any);
      setMapReady(true);
    });

    m.on('draw.create', (e) => setNewZonePolygon(e.features[0].geometry));
    m.on('draw.update', (e) => setNewZonePolygon(e.features[0].geometry));
    m.on('draw.delete', () => setNewZonePolygon(null));

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    requestsData?.forEach((req: IZoneRequestResponse) => {
      const id = req.id || (req as any)._id;
      if (!req.location?.coordinates) return;

      const isSelected = selectedRequestIds.includes(id);
      const el = document.createElement('div');
      el.className = `w-7 h-7 rounded-full border-2 border-white shadow-2xl cursor-pointer flex items-center justify-center text-[12px] font-bold text-white transition-all ${
        isSelected ? 'bg-green-500 scale-110 z-50' : 'bg-red-600 z-10 hover:bg-red-500'
      }`;
      el.innerHTML = isSelected ? '✓' : '';

      el.onclick = (e) => {
        e.stopPropagation();
        setSelectedRequestIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      };

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(req.location.coordinates as [number, number])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(
          `<div class="p-2 text-gray-800 font-bold">${req.userId?.name || req.userId?.nom || 'Habitant'}</div>`
        ))
        .addTo(m);

      markersRef.current.push(marker);
    });

    if (requestsData?.length && !m.getLayer('zoom-done')) {
      const bounds = new mapboxgl.LngLatBounds();
      requestsData.forEach(r => r.location?.coordinates && bounds.extend(r.location.coordinates as [number, number]));
      m.fitBounds(bounds, { padding: 100, maxZoom: 14 });
      m.addLayer({ id: 'zoom-done', type: 'background', layout: { visibility: 'none' } });
    }
  }, [mapReady, requestsData, selectedRequestIds, zonesData]);

  const handleOpenCreate = () => {
    if (selectedRequestIds.length === 0) return toast.error('Veuillez sélectionner au moins un habitant.');
    if (!newZonePolygon) return toast.error('Veuillez tracer le périmètre du quartier.');
    setIsCreateDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Radar des Ouvertures</h1>
          <Button
            onClick={handleOpenCreate}
            disabled={bulkAcceptMutation.isPending || selectedRequestIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            {bulkAcceptMutation.isPending ? <Loader2 className="animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Créer le quartier ({selectedRequestIds.length})
          </Button>
        </div>

        <div className="flex-1 relative rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-inner">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

          {!mapReady && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Chargement du Radar...</p>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 z-10 p-4 bg-gray-950/90 border border-gray-800 rounded-xl backdrop-blur-md shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
              <MousePointer2 size={12}/> Guide de création
            </h3>
            <ul className="text-[11px] text-gray-300 space-y-3">
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">1.</span> Cliquez sur les points rouges</li>
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">2.</span> Dessinez le polygone</li>
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">3.</span> Cliquez sur "Créer"</li>
            </ul>
          </div>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white">
          <DialogHeader><DialogTitle>Valider l'ouverture du quartier</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2"><Label className="text-gray-400">Nom du quartier</Label><Input className="bg-gray-900 border-gray-800 focus:border-indigo-500" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Ex: Les Lilas" /></div>
            <div className="space-y-2"><Label className="text-gray-400">Ville</Label><Input className="bg-gray-900 border-gray-800 focus:border-indigo-500" value={newZoneCity} onChange={e => setNewZoneCity(e.target.value)} placeholder="Ex: Saint-Maur" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-gray-500 hover:text-white">Annuler</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => bulkAcceptMutation.mutate({ requestIds: selectedRequestIds, nomQuartier: newZoneName, ville: newZoneCity, polygone: newZonePolygon })} disabled={!newZoneName || !newZoneCity}>Confirmer la création</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
