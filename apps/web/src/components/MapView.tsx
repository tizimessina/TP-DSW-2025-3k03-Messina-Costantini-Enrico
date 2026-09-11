import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { cn } from "../lib/cn";

// Ícono del marcador con el color de marca (evita el problema de assets de Leaflet en bundlers)
const icon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:9999px 9999px 9999px 0;transform:rotate(-45deg);background:#2E7D4F;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

type Point = { lat: number; lng: number };
const CENTRO_AR: Point = { lat: -33.0, lng: -61.5 };

function ClickHandler({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }) });
  return null;
}

function Recenter({ point }: { point: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView(point, Math.max(map.getZoom(), 11), { animate: true });
  }, [point?.lat, point?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * Mapa OpenStreetMap. Con `onPick` funciona como selector de ubicación (click para poner el marcador).
 */
export function MapView({ point, onPick, className, height = "h-64" }: { point: Point | null; onPick?: (p: Point) => void; className?: string; height?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800", height, className)}>
      <MapContainer center={point ?? CENTRO_AR} zoom={point ? 12 : 6} scrollWheelZoom={!!onPick} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {point && <Marker position={point} icon={icon} />}
        {onPick && <ClickHandler onPick={onPick} />}
        <Recenter point={point} />
      </MapContainer>
    </div>
  );
}
