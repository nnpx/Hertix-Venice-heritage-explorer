'use client';

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { getCategory, getCategoryColor, getVenetianEra, VENICE_DISTRICTS } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { Landmark, Church, Home, Route, MapPin } from 'lucide-react';

const OTM_API_KEY = "5ae2e3f221c38a28845f05b6353ea2b640b23d596280ed55e36941d6";
// Venice Bounding Box
const BBOX = "lon_min=12.31&lat_min=45.42&lon_max=12.36&lat_max=45.45";

// This invisible component sits inside the map and controls the "Camera"
function MapController({ activeDistrict }: { activeDistrict: string }) {
    const map = useMap(); // Hooks into the parent Leaflet map

    useEffect(() => {
        // Find the coordinates for the selected district
        const districtData = VENICE_DISTRICTS.find(d => d.name === activeDistrict);

        if (districtData) {
            // Use Leaflet's flyTo for a smooth, cinematic drone-like camera movement
            map.flyTo(
                districtData.center as [number, number],
                districtData.zoom,
                { duration: 1.5 } // 1.5 second smooth animation
            );
        }
    }, [activeDistrict, map]);

    return null; // It renders nothing visually
}


export default function MapContainer({
    activeCategories,
    activeEras,
    activeDistrict,
    onMarkerClick
}: {
    activeCategories: string[],
    activeEras: string[],
    activeDistrict: string,
    onMarkerClick: (xid: string) => void
}) {
    const [places, setPlaces] = useState<any[]>([]);

    const [boundaries, setBoundaries] = useState<any>(null);

    useEffect(() => {
        fetch('/data/boundaries.json')
            .then(res => res.json())
            .then(data => setBoundaries(data))
            .catch(console.error);
    }, []);

    // Fetch initial markers on load
    useEffect(() => {
        fetch(`https://api.opentripmap.com/0.1/en/places/bbox?${BBOX}&kinds=historic_architecture,churches,palaces,museums,bridges&format=json&apikey=${OTM_API_KEY}`)
            .then(res => res.json())
            .then(data => {
                // 1. Log the raw response to see what the API is actually sending back
                console.log("Raw OpenTripMap Response:", data);

                // 2. Defensive Check: Ensure data is an array before mapping
                if (!Array.isArray(data)) {
                    console.error("API Error: Expected an array but received an object. Check your API key status.");
                    return; // Exit early to prevent the crash
                }

                // Normalize the data with our custom categories
                const normalizedData = data.map((place: any) => ({
                    ...place,
                    internal_category: getCategory(place.kinds || place.kind || ""),
                    internal_era: getVenetianEra(place.name, place.xid)
                }));

                console.log('normalized data: ', normalizedData)

                setPlaces(normalizedData);
            })

            .catch(console.error);
    }, []);

    // Double-Filter Logic (Spatial + Temporal)
    const filteredPlaces = places.filter(place =>
        activeCategories.includes(place.internal_category) &&
        activeEras.includes(place.internal_era)
    );

    // Icon mapping logic
    const getIconComponent = (category: string) => {
        // We pass size=16 and color=white to make the icon fit perfectly inside our circle
        const ICON_SIZE = 14
        switch (category) {
            case 'Palaces': return <Landmark size={ICON_SIZE} color="white" />;
            case 'Churches': return <Church size={ICON_SIZE} color="white" />;
            case 'Living Heritage': return <Home size={ICON_SIZE} color="white" />;
            case 'Infrastructure': return <Route size={ICON_SIZE} color="white" />;
            default: return <MapPin size={ICON_SIZE} color="white" />;
        }
    };

    // Custom Icon Generator
    const createCustomIcon = (category: string) => {
        const color = getCategoryColor(category);

        // 1. Convert the React Component into a raw SVG string
        const iconHtmlString = renderToString(getIconComponent(category));

        // 2. Inject the SVG string into Leaflet's HTML wrapper
        return L.divIcon({
            className: 'custom-leaflet-icon',
            html: `
        <div style="
          background-color: ${color}; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${iconHtmlString}
        </div>
      `,
            iconSize: [32, 32],
            iconAnchor: [16, 16] // Center anchor so the icon points exactly at the coordinate
        });
    };

    // The Dynamic Styling Logic
    const getBoundaryStyle = (feature: any) => {
        // Check if this polygon's name matches the dropdown
        const isSelected = feature.properties.name === activeDistrict;

        // If it's the "All Venice" reset state, don't highlight anything
        if (activeDistrict === 'All Venice') {
            return { opacity: 0, fillOpacity: 0 };
        }

        return {
            fillColor: isSelected ? '#7fc7eb' : 'transparent', // Blue fill if active
            fillOpacity: isSelected ? 0.2 : 0,                 // Light tint (20%)
            color: isSelected ? '#55b2e0' : 'transparent',     // Solid blue border if active
            weight: isSelected ? 2 : 0,                        // Thicker border
        };
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

            {/* Handles the zooming/flying */}
            <MapController activeDistrict={activeDistrict} />

            {/* Handles the visual coloring/outlining */}
            {boundaries && (
                <GeoJSON
                    data={boundaries}
                    style={getBoundaryStyle}
                    // CRITICAL: The key forces React to redraw the shapes when the dropdown changes
                    key={`boundary-${activeDistrict}`}
                />
            )}

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