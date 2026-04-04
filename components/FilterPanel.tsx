// components/FilterPanel.tsx
'use client';
import { CATEGORIES, VENETIAN_ERAS, VENICE_DISTRICTS } from '@/lib/utils';

export default function FilterPanel({
    activeCategories, setActiveCategories,
    activeEras, setActiveEras,
    activeDistrict, setActiveDistrict
}: {
    activeCategories: string[],
    setActiveCategories: (cats: string[]) => void,
    activeEras: string[],
    setActiveEras: (cats: string[]) => void,
    activeDistrict: string,
    setActiveDistrict: (cats: string) => void
}) {

    const toggleItem = (item: string, list: string[], setList: Function) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg border border-slate-200 w-72">
            {/* District Dropdown */}
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2">District (Sestiere)</h2>
            <select
                value={activeDistrict}
                onChange={(e) => setActiveDistrict(e.target.value)}
                className="w-full mb-6 p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
                {VENICE_DISTRICTS.map(district => (
                    <option key={district.name} value={district.name}>
                        {district.name}
                    </option>
                ))}
            </select>

            {/* Category Filter */}
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Heritage Type</h2>
            <div className="space-y-2 mb-6">
                {CATEGORIES.map(category => (
                    <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                            type="checkbox" checked={activeCategories.includes(category)}
                            onChange={() => toggleItem(category, activeCategories, setActiveCategories)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-slate-700 font-medium text-sm group-hover:text-blue-600 transition-colors">{category}</span>
                    </label>
                ))}
            </div>

            {/* Temporal Filter */}
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Historical Era</h2>
            <div className="space-y-2">
                {VENETIAN_ERAS.map(era => (
                    <label key={era} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                            type="checkbox" checked={activeEras.includes(era)}
                            onChange={() => toggleItem(era, activeEras, setActiveEras)}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-slate-700 font-medium text-sm group-hover:text-amber-600 transition-colors">{era}</span>
                    </label>
                ))}
            </div>

        </div>
    );
}