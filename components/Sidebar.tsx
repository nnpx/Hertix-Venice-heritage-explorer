'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import LiveWaterLevelWidget from './widgets/LiveWaterLevelWidget';
import SocialPulseWidget from './widgets/SocialPulseWidget';

const OTM_API_KEY = "5ae2e3f221c38a28845f05b6353ea2b640b23d596280ed55e36941d6";

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
    return 70 + (hash % 81);
};

export default function Sidebar({
    selectedXid,
    onClose,
    currentSeaLevel,
    onSeaLevelChange,
}: {
    selectedXid: string | null,
    onClose: () => void,
    currentSeaLevel: number,
    onSeaLevelChange: (level: number) => void,
}) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [localSites, setLocalSites] = useState<any[]>([]);

    useEffect(() => {
        fetch('/data/heritage_sites.json')
            .then(res => res.json())
            .then(data => setLocalSites(Array.isArray(data) ? data : []))
            .catch(() => setLocalSites([]));
    }, []);

    useEffect(() => {
        if (!selectedXid) return;
        setLoading(true);

        if (selectedXid.startsWith('heritage-')) {
            const local = localSites.find(site => site.xid === selectedXid);
            setDetails(local ? { ...local, localOnly: true } : null);
            setLoading(false);
            return;
        }

        fetch(`https://api.opentripmap.com/0.1/en/places/xid/${selectedXid}?apikey=${OTM_API_KEY}`)
            .then(res => res.json())
            .then(data => {
                setDetails(data);
                setLoading(false);
            })
            .catch(() => {
                const local = localSites.find(site => site.xid === selectedXid);
                setDetails(local ? { ...local, localOnly: true } : null);
                setLoading(false);
            });
    }, [selectedXid, localSites]);

    const getValidImageUrl = (details: any) => {
        if (!details) return null;

        // If the image points to a Wikimedia File page, extract the name and use Special:FilePath
        if (details.image && details.image.includes('File:')) {
            const filename = details.image.split('File:')[1];
            // Correct template literal without Markdown artifacts
            return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=400`;
        }

        // Fallback to preview.source if it's not a broken Wikimedia link
        if (details.preview?.source && !details.preview.source.includes('wikimedia')) {
            return details.preview.source;
        }

        return null;
    };

    return (
        <AnimatePresence>
            {selectedXid && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 right-0 h-full w-125 max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-white shadow-2xl z-1000 border-l border-slate-200 flex flex-col"
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
                                {getValidImageUrl(details) && (
                                    <img
                                        src={getValidImageUrl(details)!}
                                        alt={details.name}
                                        className="w-full h-48 object-cover rounded-xl shadow-sm bg-slate-100"
                                        onError={(e) => {
                                            // Failsafe: hide the image completely if Wikimedia still rejects it
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                )}

                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 mb-2">{details.name || "Unknown Site"}</h1>
                                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                                        <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500" /> Popularity: {details.rate}/3</span>
                                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> Venice</span>
                                    </div>
                                </div>

                                {details && (() => {
                                    const rawElevation = details.elevation_cm;
                                    const elevation = typeof rawElevation === 'number' && Number.isFinite(rawElevation)
                                        ? clampElevation(rawElevation)
                                        : stableElevationFromId(details.xid ?? `${details.point?.lat}-${details.point?.lon}`);
                                    const floodedDepth = currentSeaLevel > elevation
                                        ? ((currentSeaLevel - elevation) / 100).toFixed(2)
                                        : null;

                                    return (
                                        <div className="rounded-2xl border p-4 mb-4 text-sm" style={{ borderColor: floodedDepth ? '#fee2e2' : '#d1fae5', backgroundColor: floodedDepth ? '#fff1f2' : '#ecfdf5' }}>
                                            {floodedDepth ? (
                                                <p className="font-semibold text-red-700">
                                                    Warning: At this water level, this site will be flooded by {floodedDepth}m
                                                </p>
                                            ) : (
                                                <p className="font-semibold text-emerald-700">
                                                    This site remains above the current water level.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* THE EXTRACTED WIDGETS */}
                                <LiveWaterLevelWidget
                                    lat={details.point?.lat ?? details.lat}
                                    lon={details.point?.lon ?? details.lon}
                                />
                                <SocialPulseWidget rate={details.rate} kinds={details.kinds} />

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h3 className="flex items-center text-sm font-bold text-slate-700 mb-2">
                                        Historical Context
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {details.wikipedia_extracts?.text || "Historical details are currently being updated by our curation team."}
                                    </p>
                                </div>
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