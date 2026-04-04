// app/page.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import FilterPanel from '@/components/FilterPanel';
import Sidebar from '@/components/Sidebar';

import { VENETIAN_ERAS } from '@/lib/utils';

// Dynamically import the Map so Next.js doesn't crash from Leaflet's 'window' dependency
const Map = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function AppDashboard() {
  // Global State
  const [activeCategories, setActiveCategories] = useState<string[]>([
    'Palaces', 'Churches', 'Living Heritage', 'Infrastructure'
  ]);
  const [activeEras, setActiveEras] = useState<string[]>(VENETIAN_ERAS);
  const [activeDistrict, setActiveDistrict] = useState<string>('All Venice');

  const [selectedXid, setSelectedXid] = useState<string | null>(null);

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-slate-50 font-sans">
      <FilterPanel
        activeCategories={activeCategories} setActiveCategories={setActiveCategories}
        activeEras={activeEras} setActiveEras={setActiveEras}
        activeDistrict={activeDistrict}           // PASS IT DOWN
        setActiveDistrict={setActiveDistrict}     // PASS IT DOWN
      />
      <Map
        activeCategories={activeCategories} activeEras={activeEras}
        activeDistrict={activeDistrict}           // PASS IT DOWN
        onMarkerClick={setSelectedXid}
      />
      <Sidebar selectedXid={selectedXid} onClose={() => setSelectedXid(null)} />
    </main>
  );
}