"use client";

import { useEffect, useState } from "react";
import { Waves, Info } from "lucide-react";

type ProjectionPoint = {
  year: number;
  levelCm: number;
  model?: string;
  scenario?: string;
};

type ProjectionFile =
  | {
    metadata?: {
      model?: string;
      scenario?: string;
      baseline_year?: number;
    };
    projections?: Array<{
      year: number | string;
      levelCm?: number | string;
      delta_cm?: number | string;
      model?: string;
      scenario?: string;
    }>;
  }
  | Array<any>;

const BASELINE_YEAR = 2026;

const fallbackProjections: ProjectionPoint[] = Array.from(
  { length: 2050 - BASELINE_YEAR + 1 },
  (_, index) => {
    const year = BASELINE_YEAR + index;
    const value = index * 1.05; // 2026 = 0 cm, then rises gradually
    return {
      year,
      levelCm: Math.round(value),
      model: "cmcc_esm2",
      scenario: "ssp5_8_5",
    };
  },
);

function normalizeProjectionData(raw: ProjectionFile): ProjectionPoint[] {
  const metadata =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw.metadata ?? {})
      : {};

  const rawPoints = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.projections)
      ? raw.projections
      : [];

  const points = rawPoints
    .map((point: any) => {
      const year = Number(point.year);
      const model = point.model || metadata.model || "cmcc_esm2";
      const scenario = point.scenario || metadata.scenario || "ssp5_8_5";
      const levelCm =
        point.levelCm != null
          ? Number(point.levelCm)
          : point.delta_cm != null
            ? Number(point.delta_cm)
            : NaN;

      return {
        year,
        levelCm,
        model,
        scenario,
      };
    })
    .filter(
      (point) => Number.isFinite(point.year) && Number.isFinite(point.levelCm),
    )
    .sort((a, b) => a.year - b.year);

  return points;
}

function rebaseProjectionsTo2026(points: ProjectionPoint[]): ProjectionPoint[] {
  if (points.length === 0) return [];

  const exactBaselinePoint = points.find((point) => point.year === BASELINE_YEAR);

  const fallbackBaselinePoint =
    [...points]
      .filter((point) => point.year < BASELINE_YEAR)
      .sort((a, b) => b.year - a.year)[0] ?? points[0];

  const baselinePoint = exactBaselinePoint ?? fallbackBaselinePoint;
  const baselineLevel = baselinePoint?.levelCm ?? 0;

  const filtered = points
    .filter((point) => point.year >= BASELINE_YEAR)
    .map((point) => ({
      ...point,
      levelCm: Math.max(0, Math.round(point.levelCm - baselineLevel)),
    }));

  const has2026 = filtered.some((point) => point.year === BASELINE_YEAR);

  if (!has2026) {
    filtered.unshift({
      year: BASELINE_YEAR,
      levelCm: 0,
      model: baselinePoint?.model ?? "cmcc_esm2",
      scenario: baselinePoint?.scenario ?? "ssp5_8_5",
    });
  }

  return filtered.sort((a, b) => a.year - b.year);
}

async function loadProjections(): Promise<ProjectionPoint[]> {
  try {
    const res = await fetch("/data/cmip6-projections.json");
    if (!res.ok) throw new Error("Missing projection file");

    const json = await res.json();
    const normalized = normalizeProjectionData(json);
    const rebased = rebaseProjectionsTo2026(normalized);

    if (rebased.length === 0) throw new Error("Invalid projection data");

    return rebased;
  } catch (err) {
    return fallbackProjections;
  }
}

export default function ProjectedWaterLevelWidget({
  lat,
  lon,
  currentSeaLevel,
  onSeaLevelChange,
  totalVisibleSites,
  underwaterSiteCount,
}: {
  lat: number;
  lon: number;
  currentSeaLevel: number;
  onSeaLevelChange: (level: number) => void;
  totalVisibleSites: number;
  underwaterSiteCount: number;
}) {
  const [projections, setProjections] = useState<ProjectionPoint[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    loadProjections().then((data) => {
      if (!mounted) return;

      setProjections(data);

      const defaultIndex = data.findIndex((point) => point.year === BASELINE_YEAR);
      const nextIndex = defaultIndex >= 0 ? defaultIndex : 0;

      setSelectedIndex(nextIndex);
      setLoading(false);

      if (data[nextIndex]) {
        onSeaLevelChange(Number(data[nextIndex].levelCm));
      }
    });

    return () => {
      mounted = false;
    };
  }, [onSeaLevelChange]);

  const selected = projections[selectedIndex];
  const minYear = projections[0]?.year ?? BASELINE_YEAR;
  const maxYear = projections[projections.length - 1]?.year ?? 2050;
  const deltaCm = selected?.levelCm ?? 0;

  const yearPercent = selected
    ? Math.round(
      ((selected.year - minYear) / Math.max(1, maxYear - minYear)) * 100,
    )
    : 0;

  const trendLabel = deltaCm > 0 ? "Projected rise" : "Baseline";

  useEffect(() => {
    if (selected) {
      onSeaLevelChange(selected.levelCm);
    }
  }, [selected, onSeaLevelChange]);

  const underwaterCount = underwaterSiteCount;
  const riskPercentage = totalVisibleSites
    ? Math.round((underwaterCount / totalVisibleSites) * 100)
    : 0;

  return (
    <div className="z-1000 bg-white/90 shadow-lg backdrop-blur-md p-5 border border-slate-200 rounded-xl w-72">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="flex items-center font-bold text-slate-900 text-sm">
            <Waves className="mr-2 w-4 h-4 text-sky-600" /> Water Level
            Projection
          </h3>
        </div>
        <div className="group relative">
          <Info className="opacity-80 hover:opacity-100 w-4 h-4 text-sky-500 transition-opacity cursor-help" />
          <div className="invisible group-hover:visible top-6 right-0 z-50 absolute bg-slate-800 opacity-0 group-hover:opacity-100 shadow-xl p-3 rounded-lg w-72 text-slate-200 text-xs transition-all pointer-events-none">
            Future projections based on CMCC-ESM2 climate model data (SSP5-8.5).
            Values represent the estimated increase from the 2026 baseline
            level.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="bg-slate-200 rounded-full h-3"></div>
          <div className="bg-slate-200 rounded-full h-8"></div>
          <div className="bg-slate-200 rounded-xl h-16"></div>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <div className="flex justify-between items-end gap-3">
              <div>
                <p className="font-black text-slate-900 text-4xl">
                  +{selected?.levelCm ?? 0}
                </p>
                <p className="text-slate-500 text-xs uppercase tracking-[0.18em]">
                  cm above 2026 baseline
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs">Year</p>
                <p className="font-bold text-slate-900 text-2xl">
                  {selected?.year ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={Math.max(0, projections.length - 1)}
                value={selectedIndex}
                onChange={(event) => {
                  const nextIndex = Number(event.target.value);
                  setSelectedIndex(nextIndex);

                  const nextPoint = projections[nextIndex];
                  if (nextPoint) {
                    onSeaLevelChange(Number(nextPoint.levelCm));
                  }
                }}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 uppercase tracking-[0.15em]">
                <span>{projections[0]?.year ?? BASELINE_YEAR}</span>
                <span>{projections[projections.length - 1]?.year ?? 2050}</span>
              </div>
            </div>
          </div>

          <div className="bg-white mt-2 p-3 border border-slate-200 rounded-2xl text-slate-600 text-xs">
            <div className="flex justify-between items-center mb-2 font-semibold text-slate-800 text-sm">
              <span>City-wide Risk</span>
              <span>{riskPercentage}% underwater</span>
            </div>
            <div className="bg-slate-200 rounded-full w-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all"
                style={{ width: `${riskPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {underwaterCount} of {totalVisibleSites} visible sites now at
              risk.
            </p>
          </div>
        </>
      )}
    </div>
  );
}