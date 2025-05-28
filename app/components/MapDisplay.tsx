"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapDisplay({
  userLocation,
  sensors = [],
}: {
  userLocation: [number, number];
  sensors?: Array<{
    id: string;
    parameter: string;
    coordinates: { latitude: number; longitude: number } | null;
  }>;
}) {
  const mapRef = useRef<L.Map | null>(null);

  const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  const sensorIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  useEffect(() => {
    return () => {
      // Cleanup function to remove map instance
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!userLocation) return null;

  return (
    <MapContainer
      center={userLocation}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "2.5rem" }}
      dragging={true}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        attribution={
          '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      />
      <Marker position={userLocation} icon={markerIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {sensors &&
        sensors.map((sensor) =>
          sensor.coordinates ? (
            <Marker
              key={sensor.id}
              position={[
                sensor.coordinates.latitude,
                sensor.coordinates.longitude,
              ]}
              icon={sensorIcon}
            >
              <Popup>Sensor: {sensor.parameter}</Popup>
            </Marker>
          ) : null
        )}
    </MapContainer>
  );
}
