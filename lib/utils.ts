// lib/utils.ts

// Maps OTM 'kinds' to our 4 main categories
export function getCategory(kinds: string): string {
    if (kinds.includes('palaces') || kinds.includes('fortifications')) return 'Palaces';
    if (kinds.includes('churches') || kinds.includes('monasteries') || kinds.includes('religion')) return 'Churches';
    if (kinds.includes('museums') || kinds.includes('historic_architecture')) return 'Living Heritage';
    if (kinds.includes('bridges') || kinds.includes('squares')) return 'Infrastructure';
    return 'Other'; // Fallback
}

// Assigns a color based on the category
export function getCategoryColor(category: string): string {
    switch (category) {
        case 'Palaces': return '#FFAB00'; // Gold
        case 'Churches': return '#E60000'; // Red
        case 'Living Heritage': return '#A0522D'; // Sienna
        case 'Infrastructure': return '#0082FF'; // Blue
        default: return '#808080'; // Gray
    }
}

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