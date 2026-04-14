'use client';

import { TrendingUp, Hash } from 'lucide-react';

export default function SocialPulseWidget({ rate, kinds }: { rate: number, kinds: string }) {

    const getSentimentTags = (kinds: string) => {
        if (!kinds) return ['#HiddenGem', '#Quiet'];
        if (kinds.includes('churches')) return ['#Peaceful', '#Frescoes', '#Historic'];
        if (kinds.includes('palaces')) return ['#Photogenic', '#Opulent', '#Architecture'];
        if (kinds.includes('bridges')) return ['#Crowded', '#Views', '#MustSee'];
        return ['#Authentic', '#Walking', '#Culture'];
    };

    const getTrendLevel = (rate: number) => {
        if (rate >= 3) return { label: 'High Traffic', color: 'text-red-600 bg-red-100', icon: <TrendingUp className="w-4 h-4 mr-1" /> };
        if (rate === 2) return { label: 'Moderate', color: 'text-amber-600 bg-amber-100', icon: <TrendingUp className="w-4 h-4 mr-1" /> };
        return { label: 'Quiet', color: 'text-emerald-600 bg-emerald-100', icon: <TrendingUp className="w-4 h-4 mr-1" /> };
    };

    const trend = getTrendLevel(rate);
    const tags = getSentimentTags(kinds);

    return (
        <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-sm font-bold text-fuchsia-900">
                    <Hash className="w-4 h-4 mr-2 text-fuchsia-700" /> Social Pulse
                </h3>
                <span className={`flex items-center px-2 py-1 rounded-md text-xs font-bold ${trend.color}`}>
                    {trend.icon} {trend.label}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-full shadow-sm">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}