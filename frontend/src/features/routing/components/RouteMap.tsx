import { useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngTuple } from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Box } from '@mui/material';
import type { RouteGeometry } from '../../../api/routePlans';

export interface MapStop {
  index: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteMapProps {
  stops: MapStop[];
  totalStops: number;
  geometry: RouteGeometry | null;
  onMapClick?: (latitude: number, longitude: number) => void;
  height?: { xs: number; md: number };
}

const ISTANBUL: LatLngTuple = [41.015, 29.0];

// Leaflet'in varsayılan işaretçisi resim dosyası ister (Vite ile yolu bozulur). Bunun yerine
// HTML işaretçi: sıra numarası yazılı olduğu için durak sırası yalnız renkle anlatılmaz.
function stopIcon(label: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;font:700 13px system-ui;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function markerStyle(index: number, total: number) {
  if (index === 0) return { label: 'B', color: '#2e7d32' }; // Başlangıç
  if (index === total - 1) return { label: 'S', color: '#c62828' }; // Son durak
  return { label: String(index), color: '#0d47a1' };
}

// Duraklar değişince harita hepsini gösterecek şekilde yakınlaşır.
function FitToStops({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function ClickToAdd({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function RouteMap({ stops, totalStops, geometry, onMapClick, height = { xs: 300, md: 460 } }: RouteMapProps) {
  const points = useMemo(() => stops.map((s) => [s.latitude, s.longitude] as LatLngTuple), [stops]);
  // GeoJSON [boylam, enlem] sırasındadır; Leaflet [enlem, boylam] bekler.
  const line = useMemo(
    () => geometry?.coordinates.map(([lng, lat]) => [lat, lng] as LatLngTuple) ?? [],
    [geometry],
  );

  return (
    <Box
      role="region"
      aria-label="Rota haritası. Duraklar listeden de eklenip düzenlenebilir."
      sx={{ height, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', '& .leaflet-container': { height: '100%' } }}
    >
      <MapContainer center={ISTANBUL} zoom={11} scrollWheelZoom={false}>
        {/* OpenStreetMap karoları ücretsizdir ve anahtar gerektirmez; atıf zorunludur. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToStops points={points} />
        {onMapClick && <ClickToAdd onClick={onMapClick} />}
        {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#0d47a1', weight: 5, opacity: 0.8 }} />}
        {stops.map((s) => {
          const { label, color } = markerStyle(s.index, totalStops);
          return (
            <Marker key={`${s.index}-${s.latitude}-${s.longitude}`} position={[s.latitude, s.longitude]} icon={stopIcon(label, color)}>
              <Tooltip>{s.name || 'İsimsiz durak'}</Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
}
