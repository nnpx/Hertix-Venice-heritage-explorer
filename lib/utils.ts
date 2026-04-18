// lib/utils.ts

// Maps OTM 'kinds' to our 4 main categories
export function getCategory(kinds: string): string {
    if (kinds.includes('palaces') || kinds.includes('fortifications')) return 'Palaces';
    if (kinds.includes('churches') || kinds.includes('monasteries') || kinds.includes('religion')) return 'Churches';
    if (
        kinds.includes('museums') ||
        kinds.includes('historic_architecture') ||
        kinds.includes('historic') ||
        kinds.includes('architecture') ||
        kinds.includes('cultural') ||
        kinds.includes('museum')
    ) return 'Living Heritage';
    if (kinds.includes('bridges') || kinds.includes('squares') || kinds.includes('infrastructure')) return 'Infrastructure';
    return 'Living Heritage'; // Fallback to keep unknown API sites visible
}

// Assigns a color based on the category
export function getCategoryColor(category: string): string {
    switch (category) {
        case 'Palaces': return '#FFAB00'; // Gold
        case 'Churches': return '#7c3aed'; // Red (deep violet)
        case 'Living Heritage': return '#A0522D'; // Sienna
        case 'Infrastructure': return '#0082FF'; // Blue
        default: return '#808080'; // Gray
    }
}

export const CATEGORIES = ['Palaces', 'Churches', 'Living Heritage', 'Infrastructure'];


// The 4 main architectural eras of Venice
export const VENETIAN_ERAS = [
    'Byzantine (Pre-1300)',
    'Gothic (1300-1400s)',
    'Renaissance (1500s)',
    'Baroque (1600s+)'
];

// A utility to assign an era based on famous names, with a fallback
export function getVenetianEra(name: string = "", xid: string): string {
    const lowerName = name.toLowerCase();

    // 1. Hardcode the "Hero" sites for historical accuracy
    if (lowerName.includes("marco") || lowerName.includes("murano")) return 'Byzantine (Pre-1300)';
    if (lowerName.includes("ducale") || lowerName.includes("d'oro") || lowerName.includes("frari")) return 'Gothic (1300-1400s)';
    if (lowerName.includes("rialto") || lowerName.includes("giorgio")) return 'Renaissance (1500s)';
    if (lowerName.includes("salute") || lowerName.includes("rezzonico")) return 'Baroque (1600s+)';

    // 2. Deterministic Fallback: Use the XID string length and characters to assign a consistent era
    const hash = xid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return VENETIAN_ERAS[hash % VENETIAN_ERAS.length];
}

// export const VENICE_DISTRICTS = [
//     { name: 'All Venice', center: [45.4371, 12.3327], zoom: 14 },
//     { name: 'San Marco', center: [45.4336, 12.3372], zoom: 16 },
//     { name: 'San Polo', center: [45.4381, 12.3311], zoom: 16 },
//     { name: 'Santa Croce', center: [45.4393, 12.3216], zoom: 16 },
//     { name: 'Dorsoduro', center: [45.4312, 12.3243], zoom: 15 },
//     { name: 'Cannaregio', center: [45.4432, 12.3310], zoom: 15 },
//     { name: 'Castello', center: [45.4361, 12.3512], zoom: 15 },
//     { name: 'Murano (Glass)', center: [45.4578, 12.3547], zoom: 15 }
// ];


export const VENICE_DISTRICTS = [
    { name: 'All Venice', center: [45.4371, 12.3327], zoom: 14 },

    // These exact ugly strings match the "properties.name" in the boundaries.json
    { name: 'S. Marco, Castello, S. Elena, Cannaregio', center: [45.4385, 12.3412], zoom: 15 },
    { name: 'Dorsoduro, S. Polo, S. Croce, Giudecca, Sacca Fisola', center: [45.4321, 12.3256], zoom: 15 },
    // { name: 'Murano, S. Erasmo', center: [45.4578, 12.3547], zoom: 15 },
    // { name: 'Favaro Veneto', center: [45.5000, 12.2800], zoom: 13 },
    // { name: 'Mestre Centro', center: [45.4900, 12.2400], zoom: 13 },
    // { name: 'Marghera, Catene, Malcontenta', center: [45.4600, 12.2200], zoom: 13 }
];