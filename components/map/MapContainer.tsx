"use client";

import { useEffect, useState } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import {
  getCategory,
  getCategoryColor,
  getVenetianEra,
  VENICE_DISTRICTS,
} from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import { renderToString } from "react-dom/server";
import { Landmark, Church, Home, Route, MapPin } from "lucide-react";

type ApiSite = {
  kinds: string;
  point: {
    lat: number;
    lon: number;
  };
  source: "api";
};

const OTM_API_KEY = "5ae2e3f221c38a28845f05b6353ea2b640b23d596280ed55e36941d6";
// Venice Bounding Box
const BBOX = "lon_min=12.32&lat_min=45.43&lon_max=12.36&lat_max=45.45";

const clampElevation = (value: number): number => {
  if (!Number.isFinite(value)) return 100;
  if (value < 30) return 30;
  return value > 180 ? 180 : value;
};

const stableElevationFromId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 40 + (hash % 121); // 40-160 inclusive - includes low elevations for flooding
};

// This invisible component sits inside the map and controls the "Camera"
function MapController({ activeDistrict }: { activeDistrict: string }) {
  const map = useMap(); // Hooks into the parent Leaflet map

  useEffect(() => {
    // Find the coordinates for the selected district
    const districtData = VENICE_DISTRICTS.find(
      (d) => d.name === activeDistrict,
    );

    if (districtData) {
      // Use Leaflet's flyTo for a smooth, cinematic drone-like camera movement
      map.flyTo(
        districtData.center as [number, number],
        districtData.zoom,
        { duration: 1.5 }, // 1.5 second smooth animation
      );
    }
  }, [activeDistrict, map]);

  return null; // It renders nothing visually
}

export default function MapContainer({
  activeCategories,
  activeEras,
  activeDistrict,
  currentSeaLevel,
  onMarkerClick,
  onVisibleCountsChange,
  onDistrictClick,
}: {
  activeCategories: string[];
  activeEras: string[];
  activeDistrict: string;
  currentSeaLevel: number;
  onMarkerClick: (xid: string) => void;
  onVisibleCountsChange: ({
    total,
    underwater,
  }: {
    total: number;
    underwater: number;
  }) => void;
  onDistrictClick: (district: string) => void;
}) {
  const [apiPlaces, setApiPlaces] = useState<any[]>([]);
  const [boundaries, setBoundaries] = useState<any>(null);
  const [veniceOutline, setVeniceOutline] = useState<any>(null);

  const isValidVeniceSite = (site: any) => {
    const latitude = Number(site.lat || site.point?.lat);
    const longitude = Number(site.lon || site.point?.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

    // STRICT BOUNDS: Only the historical islands
    return (
      latitude >= 45.425 && // Southern cutoff
      latitude <= 45.455 && // Northern cutoff
      longitude >= 12.32 && // Western cutoff (this removes the Mestre/Mirano ghosts)
      longitude <= 12.37 // Eastern cutoff
    );
  };

  useEffect(() => {
    fetch("/data/venice.geojson")
      .then((res) => res.json())
      .then((data) => setVeniceOutline(data))
      .catch(console.error);

    fetch("/data/boundaries.json")
      .then((res) => res.json())
      .then((data) => setBoundaries(data))
      .catch(console.error);

    async function loadApiPlaces() {
      try {
        const response = await fetch(
          `https://api.opentripmap.com/0.1/en/places/bbox?${BBOX}&kinds=interesting_places,cultural,architecture&rate=2&format=json&apikey=${OTM_API_KEY}`,
        );
        const data = await response.json();

        if (!Array.isArray(data)) {
          setApiPlaces([]);
          return;
        }

        const initialApiPlaces = data.map((place: any) => {
          const idSeed = place.xid || `${place.point?.lat}-${place.point?.lon}`;
          const elevation_cm = stableElevationFromId(String(idSeed));

          return {
            ...place,
            elevation_cm,
            elevationSource: "api" as const,
          };
        });

        setApiPlaces(initialApiPlaces);
      } catch {
        setApiPlaces([]);
      }
    }

    loadApiPlaces();
  }, []);

  const getElevationForPlace = (place: any) => {
    const elevation =
      typeof place.elevation_cm === "number"
        ? place.elevation_cm
        : Number(place.elevation_cm);

    return Number.isFinite(elevation) ? clampElevation(elevation) : 100;
  };

  const getApiPlaceCategory = (place: any) =>
    getCategory(place.kinds ?? place.name ?? "");
  const getApiPlaceEra = (place: any) =>
    getVenetianEra(place.name ?? "", place.xid);

  const filteredApiPlaces = apiPlaces.filter(
    (place) =>
      activeCategories.includes(getApiPlaceCategory(place)) &&
      activeEras.includes(getApiPlaceEra(place)),
  );

  const mergedPlaces = filteredApiPlaces.map((place) => ({
    ...place,
    source: "api",
    elevationSource: "api",
  }));

  console.log(
    "MapContainer currentSeaLevel:",
    currentSeaLevel,
    "mergedPlaces:",
    mergedPlaces.length,
  );

  useEffect(() => {
    const total = mergedPlaces.length;
    const underwater = mergedPlaces.reduce((count, place) => {
      return (
        count + (Number(currentSeaLevel) >= Number(place.elevation_cm) ? 1 : 0)
      );
    }, 0);
    onVisibleCountsChange({ total, underwater });
  }, [mergedPlaces.length, currentSeaLevel, onVisibleCountsChange]);

  // Icon mapping logic
  const getIconComponent = (category: string) => {
    // We pass size=16 and color=white to make the icon fit perfectly inside our circle
    const ICON_SIZE = 14;
    switch (category) {
      case "Palaces":
        return <Landmark size={ICON_SIZE} color="white" />;
      case "Churches":
        return <Church size={ICON_SIZE} color="white" />;
      case "Living Heritage":
        return <Home size={ICON_SIZE} color="white" />;
      case "Infrastructure":
        return <Route size={ICON_SIZE} color="white" />;
      default:
        return <MapPin size={ICON_SIZE} color="white" />;
    }
  };

  // Custom Icon Generator
  const createCustomIcon = (category: string, isFlooded: boolean) => {
    const baseColor = getCategoryColor(category);
    const color = isFlooded ? "#ef4444" : baseColor;

    // 1. Convert the React Component into a raw SVG string
    const iconHtmlString = renderToString(getIconComponent(category));

    // 2. Inject the SVG string into Leaflet's HTML wrapper
    // Remove the flooded-marker from the Leaflet wrapper
    return L.divIcon({
      className: "custom-leaflet-icon", // <-- Keep this clean
      html: `
        <div class="${isFlooded ? "flooded-marker" : ""}" style="
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
      iconAnchor: [16, 16], // Center anchor so the icon points exactly at the coordinate
    });
  };

  // The Dynamic Styling Logic
  const getBoundaryStyle = (feature: any) => {
    const isSelected = feature.properties.name === activeDistrict;

    if (activeDistrict === "All Venice") {
      return { opacity: 0, fillOpacity: 0 };
    }

    return {
      fillColor: isSelected ? "#55b2e0" : "transparent",
      fillOpacity: isSelected ? 0.3 : 0,
      color: isSelected ? "#55b2e0" : "transparent",
      weight: isSelected ? 2 : 0,
    };
  };

  const lagoonOverlayOpacity = Math.min(
    0.45,
    Math.max(0, (currentSeaLevel / 100) * 0.45),
  );

  return (
    <LeafletMap
      center={[45.4371, 12.3327]}
      zoom={14}
      zoomControl={false}
      className="w-full h-full"
    >
      {veniceOutline && (
        <GeoJSON
          data={veniceOutline}
          style={() => ({
            color: "transparent",
            fillColor: "#3b82f6",
            fillOpacity: lagoonOverlayOpacity,
          })}
          interactive={false}
          key={`flood-${currentSeaLevel}`}
        />
      )}
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

      {mergedPlaces.map((place) => {
        const isApiPlace = place.source === "api";
        const elevation = place.elevation_cm ?? 100;
        const category = isApiPlace
          ? getApiPlaceCategory(place)
          : place.category;
        const isFlooded = Number(currentSeaLevel) >= Number(elevation);
        const latitude = isApiPlace ? place.point?.lat : place.lat;
        const longitude = isApiPlace ? place.point?.lon : place.lon;

        // THE UNBREAKABLE GEOFENCE
        // If ANY site (API or Local) is outside the Venice islands, destroy it immediately.
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < 45.42 ||
          latitude > 45.46 ||
          longitude < 12.31 ||
          longitude > 12.38
        ) {
          return null;
        }

        const markerIcon = createCustomIcon(category, isFlooded);

        return (
          <Marker
            // CRITICAL FIX: Adding isFlooded to the key forces React to redraw
            // the marker from scratch, preventing the "teleport to top left" bug.
            key={`${place.xid}-${isFlooded}`}
            position={[latitude, longitude]}
            icon={markerIcon}
            zIndexOffset={isFlooded ? 1000 : 0}
            eventHandlers={{
              click: () => onMarkerClick(place.xid),
            }}
          >
            {/* REMOVED: autoClose={false} and closeOnClick={false} to stop orphan popups */}
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-bold text-slate-900">{place.name}</div>
                <div className="text-slate-600">Elevation: {elevation} cm</div>
                <div
                  className={
                    isFlooded
                      ? "text-red-600 font-bold uppercase"
                      : "text-emerald-600 font-semibold uppercase"
                  }
                >
                  {isFlooded ? "UNDERWATER" : "Protected"}
                </div>
                {isApiPlace && place.elevationSource === "fallback" && (
                  <div className="text-slate-500 text-xs">
                    Default elevation assumed for API site
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </LeafletMap>
  );
}
