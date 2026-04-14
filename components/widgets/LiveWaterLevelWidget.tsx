'use client';

import { useEffect, useState } from 'react';
import { Waves, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

// A simple mathematical function to find the distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const dx = lat1 - lat2;
    const dy = lon1 - lon2;
    return Math.sqrt(dx * dx + dy * dy);
}

export default function LiveWaterLevelWidget({ lat, lon }: { lat: number, lon: number }) {
    const [tideStations, setTideStations] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/tide')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setTideStations(data);
            })
            .catch(err => console.error("Failed to load Venice Tide API:", err));
    }, []);

    if (tideStations.length === 0) {
        return (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold text-center">
                Connecting to Venice Tide API...
            </div>
        );
    }

    // 1. Find the nearest station
    let closestStation = tideStations[0];
    let minDistance = Infinity;

    tideStations.forEach(station => {
        if (!station.valore) return;

        const statLat = parseFloat(station.latDDN);
        const statLon = parseFloat(station.lonDDE);
        const distance = getDistance(lat, lon, statLat, statLon);

        if (distance < minDistance) {
            minDistance = distance;
            closestStation = station;
        }
    });

    if (!closestStation || !closestStation.valore) return null;

    // 2. Parse and evaluate
    const meters = parseFloat(closestStation.valore.replace(' m', ''));
    const currentTideCm = Math.round(meters * 100);

    const isFlooding = currentTideCm >= 110;
    const isWarning = currentTideCm >= 90 && currentTideCm < 110;

    const tide = {
        level: currentTideCm,
        stationName: closestStation.nome_abbr,
        status: isFlooding ? 'Flooding (Acqua Alta)' : isWarning ? 'Rising Tide' : 'Safe / Normal',
        color: isFlooding ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600',
        bgColor: isFlooding ? 'bg-red-50 border-red-200' : isWarning ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200',
        icon: isFlooding || isWarning ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
    };

    return (
        <div className={`p-4 rounded-xl border ${tide.bgColor} transition-colors`}>
            <div className="flex justify-between items-start mb-2">
                <div className="relative group flex items-center">
                    <h3 className={`flex items-center text-sm font-bold ${tide.color}`}>
                        <Waves className="w-4 h-4 mr-2" /> Live Water Level
                    </h3>
                    <Info className={`w-4 h-4 ml-2 opacity-50 cursor-help transition-opacity hover:opacity-100 ${tide.color}`} />
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
                <p className={`text-[10px] font-bold ${tide.color} opacity-60 uppercase`}>
                    Station: {tide.stationName}
                </p>
            </div>
        </div>
    );
}