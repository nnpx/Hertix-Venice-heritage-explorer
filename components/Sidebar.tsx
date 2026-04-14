'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Info, Star, TrendingUp, Hash, Waves, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Replace with your free key from opentripmap.io
const OTM_API_KEY = "5ae2e3f221c38a28845f05b6353ea2b640b23d596280ed55e36941d6";

// A simple mathematical function to find the distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const dx = lat1 - lat2;
    const dy = lon1 - lon2;
    return Math.sqrt(dx * dx + dy * dy);
}

export default function Sidebar({
    selectedXid,
    onClose
}: {
    selectedXid: string | null,
    onClose: () => void
}) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // State to hold the live Venice tide data
    const [tideStations, setTideStations] = useState<any[]>([]);

    // Fetch the live tide data using our Next.js Proxy Route
    useEffect(() => {
        fetch('/api/tide')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                setTideStations(data);
            })
            .catch(err => console.error("Failed to load Venice Tide API:", err));
    }, []);

    // Fetch detailed info when a new marker is clicked
    useEffect(() => {
        if (!selectedXid) return;
        setLoading(true);
        fetch(`https://api.opentripmap.com/0.1/en/places/xid/${selectedXid}?apikey=${OTM_API_KEY}`)
            .then(res => res.json())
            .then(data => {
                setDetails(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedXid]);

    // ==========================================
    // MOCK DATA GENERATORS (For the Prototype)
    // ==========================================

    // 1. Mock Sentiment Tags based on the OTM 'kinds'
    const getSentimentTags = (kinds: string) => {
        if (!kinds) return ['#HiddenGem', '#Quiet'];
        if (kinds.includes('churches')) return ['#Peaceful', '#Frescoes', '#Historic'];
        if (kinds.includes('palaces')) return ['#Photogenic', '#Opulent', '#Architecture'];
        if (kinds.includes('bridges')) return ['#Crowded', '#Views', '#MustSee'];
        return ['#Authentic', '#Walking', '#Culture'];
    };

    // 2. Mock Trend Score based on OTM popularity rate
    const getTrendLevel = (rate: number) => {
        if (rate >= 3) return { label: 'High Traffic', color: 'text-red-600 bg-red-100', icon: <TrendingUp className="w-4 h-4 mr-1" /> };
        if (rate === 2) return { label: 'Moderate', color: 'text-amber-600 bg-amber-100', icon: <TrendingUp className="w-4 h-4 mr-1" /> };
        return { label: 'Quiet', color: 'text-emerald-600 bg-emerald-100', icon: <TrendingUp className="w-4 h-4 mr-1" /> };
    };

    // Real-Time Spatial Matching Engine
    const getRealWaterLevel = (siteLat: number, siteLon: number) => {
        if (tideStations.length === 0) return null; // API not loaded yet

        // 1. Find the nearest station
        let closestStation = tideStations[0];
        let minDistance = Infinity;

        tideStations.forEach(station => {
            // The API sometimes has stations that are offline (missing 'valore')
            if (!station.valore) return;

            const statLat = parseFloat(station.latDDN);
            const statLon = parseFloat(station.lonDDE);
            const distance = getDistance(siteLat, siteLon, statLat, statLon);

            if (distance < minDistance) {
                minDistance = distance;
                closestStation = station;
            }
        });

        if (!closestStation || !closestStation.valore) return null;

        // 2. Parse the string "0.44 m" into the number 44
        const meters = parseFloat(closestStation.valore.replace(' m', ''));
        const currentTideCm = Math.round(meters * 100);

        // Venice Thresholds: > 110 is Flooding, < 80 is Normal
        const isFlooding = currentTideCm >= 110;
        const isWarning = currentTideCm >= 90 && currentTideCm < 110;

        return {
            level: currentTideCm,
            stationName: closestStation.nome_abbr, // So we can show the user which station we are using
            status: isFlooding ? 'Flooding (Acqua Alta)' : isWarning ? 'Rising Tide' : 'Safe / Normal',
            color: isFlooding ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600',
            bgColor: isFlooding ? 'bg-red-50 border-red-200' : isWarning ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200',
            icon: isWarning ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
        };
    };

    return (
        <AnimatePresence>
            {selectedXid && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 right-0 h-full w-140 bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">Heritage Identity</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
                                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-200 rounded w-full"></div>
                            </div>
                        ) : details ? (
                            <>
                                {/* Photo */}
                                {details.preview?.source && (
                                    <img
                                        src={details.preview.source}
                                        alt={details.name}
                                        className="w-full h-48 object-cover rounded-xl shadow-sm"
                                    />
                                )}

                                {/* Title & Basics */}
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 mb-2">{details.name || "Unknown Site"}</h1>
                                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                                        <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500" /> Popularity: {details.rate}/3</span>
                                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> Venice</span>
                                    </div>
                                </div>

                                {/* History Section */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h3 className="flex items-center text-sm font-bold text-slate-700 mb-2">
                                        Historical Context
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {details.wikipedia_extracts?.text || "Historical details are currently being updated by our curation team."}
                                    </p>
                                </div>

                                {/* THE UPDATED LIVE ENVIRONMENT WIDGET */}
                                {(() => {
                                    // Pass the exact coordinates of the clicked heritage site
                                    const tide = getRealWaterLevel(details.point.lat, details.point.lon);

                                    if (!tide) return (
                                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold text-center">
                                            Connecting to Venice Tide API...
                                        </div>
                                    );

                                    return (
                                        <div className={`p-4 rounded-xl border ${tide.bgColor} transition-colors`}>
                                            <div className="flex justify-between items-start mb-2">
                                                {/* Added 'group relative' wrapper for the tooltip hover effect */}
                                                <div className="relative group flex items-center">
                                                    <h3 className={`flex items-center text-sm font-bold ${tide.color}`}>
                                                        <Waves className="w-4 h-4 mr-2" /> Live Water Level
                                                    </h3>
                                                    <Info className={`w-4 h-4 ml-2 opacity-50 cursor-help transition-opacity hover:opacity-100 ${tide.color}`} />

                                                    {/* The Tooltip Box (Hidden by default, shows on hover) */}
                                                    <div className="absolute left-0 top-7 w-80 p-3 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                                        <p className="font-bold text-white mb-2 border-b border-slate-600 pb-1">Tide Thresholds:</p>
                                                        <ul className="space-y-1.5 font-medium">
                                                            <li><span className="text-blue-400 font-bold inline-block w-24">&lt; 90 cm:</span> Normal / City Dry</li>
                                                            <li><span className="text-amber-400 font-bold inline-block w-24">90-109 cm:</span> Walkways Flooded</li>
                                                            <li><span className="text-red-400 font-bold inline-block w-24">&ge; 110 cm:</span> Flooding / MOSE Active</li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <span className={tide.color}>{tide.icon}</span>
                                            </div>
                                            <div className="flex items-end space-x-2">
                                                <span className={`text-3xl font-black ${tide.color}`}>+{tide.level}</span>
                                                <span className={`text-sm font-bold mb-1 ${tide.color} opacity-80`}>cm</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className={`text-xs font-semibold ${tide.color} opacity-80 uppercase tracking-wider`}>
                                                    Status: {tide.status}
                                                </p>
                                                {/* Show the user which station is providing the data! */}
                                                <p className={`text-[10px] font-bold ${tide.color} opacity-60 uppercase`}>
                                                    Station: {tide.stationName}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Social Pulse Widget */}
                                {(() => {
                                    const trend = getTrendLevel(details.rate);
                                    const tags = getSentimentTags(details.kinds);
                                    return (
                                        <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="flex items-center text-sm font-bold text-fuchsia-900">
                                                    <Hash className="w-4 h-4 mr-2 text-fuchsia-700" /> Social Pulse
                                                </h3>
                                                {/* Trend Badge */}
                                                <span className={`flex items-center px-2 py-1 rounded-md text-xs font-bold ${trend.color}`}>
                                                    {trend.icon} {trend.label}
                                                </span>
                                            </div>

                                            {/* Sentiment Tags */}
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-full shadow-sm">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <p className="text-slate-500">Failed to load data.</p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}