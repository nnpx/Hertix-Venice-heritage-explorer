'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import LiveWaterLevelWidget from './widgets/LiveWaterLevelWidget';
import SocialPulseWidget from './widgets/SocialPulseWidget';

const OTM_API_KEY = "5ae2e3f221c38a28845f05b6353ea2b640b23d596280ed55e36941d6";

export default function Sidebar({
    selectedXid,
    onClose
}: {
    selectedXid: string | null,
    onClose: () => void
}) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedXid) return;
        setLoading(true);
        fetch(`https://api.opentripmap.com/0.1/en/places/xid/${selectedXid}?apikey=${OTM_API_KEY}`)
            .then(res => res.json())
            .then(data => {
                console.log(data)
                setDetails(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedXid]);

    // 1. Add this helper function inside or above your component
    const getValidImageUrl = (details: any) => {
        if (!details) return null;

        // If the image points to a Wikimedia File page, extract the name and use Special:FilePath
        if (details.image && details.image.includes('File:')) {
            const filename = details.image.split('File:')[1];
            // Request a 400px wide image directly
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
                    className="absolute top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col"
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

                                {/* THE EXTRACTED WIDGETS */}
                                <LiveWaterLevelWidget lat={details.point.lat} lon={details.point.lon} />
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