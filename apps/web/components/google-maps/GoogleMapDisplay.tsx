"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface GoogleMapDisplayProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}

export const GoogleMapDisplay = ({
  latitude,
  longitude,
  zoom = 15,
  className,
}: GoogleMapDisplayProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return null;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: latitude, lng: longitude }}
        defaultZoom={zoom}
        gestureHandling="cooperative"
        className={className}
        mapId="organization-map"
      >
        <AdvancedMarker position={{ lat: latitude, lng: longitude }} />
      </Map>
    </APIProvider>
  );
};
