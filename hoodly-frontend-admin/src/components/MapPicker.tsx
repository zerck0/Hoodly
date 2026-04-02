import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Trash2, Loader2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

interface MapPickerProps {
  onChange: (geojson: GeoJSON.FeatureCollection | null) => void;
  initialGeojson?: GeoJSON.FeatureCollection;
  center?: [number, number];
  zoom?: number;
}

export default function MapPicker({
  onChange,
  initialGeojson,
  center = [2.3522, 48.8566],
  zoom = 10,
}: Readonly<MapPickerProps>) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const onPolygonChange = useCallback(() => {
    if (!draw.current) return;
    const data = draw.current.getAll() as GeoJSON.FeatureCollection;
    onChange(data.features.length > 0 ? data : null);
  }, [onChange]);

  useEffect(() => {
    if (!mapboxToken) return;
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center,
      zoom,
      pitch: 60,
      bearing: -17,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });

    map.current.addControl(draw.current, 'top-left');

    map.current.on('draw.create', onPolygonChange);
    map.current.on('draw.delete', onPolygonChange);
    map.current.on('draw.update', onPolygonChange);

    map.current.on('load', () => {
      setIsLoaded(true);

      if (initialGeojson) {
        draw.current?.add(initialGeojson);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
      setIsLoaded(false);
    };
  }, [mapboxToken, center, zoom, initialGeojson, onPolygonChange]);

  const clearDrawing = () => {
    draw.current?.deleteAll();
    onChange(null);
  };

  if (!mapboxToken) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
        Token Mapbox manquant (`VITE_MAPBOX_TOKEN`). Impossible d'afficher la carte.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full h-[400px] rounded-lg border border-gray-700"
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement de la carte...
          </span>
        </div>
      )}

      {isLoaded && (
        <button
          type="button"
          onClick={clearDrawing}
          className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Effacer le dessin
        </button>
      )}
    </div>
  );
}