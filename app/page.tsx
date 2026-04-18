// app/page.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import FilterPanel from '@/components/FilterPanel';
import Sidebar from '@/components/Sidebar';
import ProjectedWaterLevelWidget from '@/components/widgets/ProjectedWaterLevelWidget';

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
  const [currentSeaLevel, setCurrentSeaLevel] = useState<number>(0);
  const [visibleSiteCount, setVisibleSiteCount] = useState<number>(0);
  const [underwaterSiteCount, setUnderwaterSiteCount] = useState<number>(0);

  console.log('Global Sea Level:', currentSeaLevel);

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-slate-50 font-sans">
      <div className="absolute top-4 left-4 z-1000 flex flex-col gap-4 w-72 pointer-events-auto">
        <FilterPanel
          activeCategories={activeCategories} setActiveCategories={setActiveCategories}
          activeEras={activeEras} setActiveEras={setActiveEras}
          activeDistrict={activeDistrict}           // PASS IT DOWN
          setActiveDistrict={setActiveDistrict}     // PASS IT DOWN
        />
        <ProjectedWaterLevelWidget
          lat={45.4371}
          lon={12.3327}
          currentSeaLevel={currentSeaLevel}
          onSeaLevelChange={setCurrentSeaLevel}
          totalVisibleSites={visibleSiteCount}
          underwaterSiteCount={underwaterSiteCount}
        />
      </div>
      <Map
        activeCategories={activeCategories} activeEras={activeEras}
        activeDistrict={activeDistrict}           // PASS IT DOWN
        currentSeaLevel={currentSeaLevel}
        onMarkerClick={setSelectedXid}
        onVisibleCountsChange={({ total, underwater }) => {
          setVisibleSiteCount(total);
          setUnderwaterSiteCount(underwater);
        }}
      />
      <Sidebar
        selectedXid={selectedXid}
        onClose={() => setSelectedXid(null)}
        currentSeaLevel={currentSeaLevel}
        onSeaLevelChange={setCurrentSeaLevel}
      />
    </main>
  );
}