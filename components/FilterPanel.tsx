// components/FilterPanel.tsx
'use client';

const CATEGORIES = ['Palaces', 'Churches', 'Living Heritage', 'Infrastructure'];

export default function FilterPanel({
    activeCategories,
    setActiveCategories
}: {
    activeCategories: string[],
    setActiveCategories: (cats: string[]) => void
}) {

    const toggleCategory = (category: string) => {
        if (activeCategories.includes(category)) {
            setActiveCategories(activeCategories.filter(c => c !== category));
        } else {
            setActiveCategories([...activeCategories, category]);
        }
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 w-64">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Map Filters</h2>
            <div className="space-y-2">
                {CATEGORIES.map(category => (
                    <label key={category} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <input
                            type="checkbox"
                            checked={activeCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-700 font-medium text-sm">{category}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}