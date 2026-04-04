// components/map/MapContainer.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCategory, getCategoryColor } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const OTM_API_KEY = "5ae2e3f221c38a28845f05b6353ea2b640b23d596280ed55e36941d6";
// Venice Bounding Box
const BBOX = "lon_min=12.31&lat_min=45.42&lon_max=12.36&lat_max=45.45";

export default function MapContainer({
    activeCategories,
    onMarkerClick
}: {
    activeCategories: string[],
    onMarkerClick: (xid: string) => void
}) {
    const [places, setPlaces] = useState<any[]>([]);

    // Fetch initial markers on load
    useEffect(() => {
        fetch(`https://api.opentripmap.com/0.1/en/places/bbox?${BBOX}&kinds=historic_architecture,churches,palaces,museums,bridges&format=json&apikey=${OTM_API_KEY}`)
            .then(res => res.json())
            .then(data => {
                console.log('data', data)
                /// 1. Log the raw response to see what the API is actually sending back
                console.log("Raw OpenTripMap Response:", data);

                // 2. Defensive Check: Ensure data is an array before mapping
                if (!Array.isArray(data)) {
                    console.error("API Error: Expected an array but received an object. Check your API key status.");
                    return; // Exit early to prevent the crash
                }

                // Normalize the data with our custom categories
                const normalizedData = data.map((place: any) => ({
                    ...place,
                    internal_category: getCategory(place.kinds)
                }));
                setPlaces(normalizedData);
            })
            .catch(console.error);
    }, []);

    // Filter places based on active checkboxes
    const filteredPlaces = places.filter(place => activeCategories.includes(place.internal_category));

    // Custom Icon Generator
    const createCustomIcon = (category: string) => {
        const color = getCategoryColor(category);
        return L.divIcon({
            className: 'custom-leaflet-icon',
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    };

    return (
        <LeafletMap
            center={[45.4371, 12.3327]}
            zoom={14}
            zoomControl={false}
            className="w-full h-full"
        >
            {/* Dark/Antique Tile Layer for Professional LBS Look */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {filteredPlaces.map((place) => (
                <Marker
                    key={place.xid}
                    position={[place.point.lat, place.point.lon]}
                    icon={createCustomIcon(place.internal_category)}
                    eventHandlers={{
                        click: () => onMarkerClick(place.xid),
                    }}
                />
            ))}
        </LeafletMap>
    );
}