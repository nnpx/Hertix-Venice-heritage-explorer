import xarray as xr
import json

# Load the file we just moved
ds = xr.open_dataset('download.nc')

# The error showed your dimensions are ('time', 'i', 'j')
# We average over 'i' and 'j' to get the mean sea level for the area
annual_means = ds['zos'].mean(dim=['i', 'j']).groupby('time.year').mean()

# Use 2020 as our starting '0' point (Baseline)
baseline = float(annual_means.sel(year=2020).values) 

projections = []
for year in annual_means.year.values:
    # Calculate difference from 2020 and convert to cm
    delta_cm = (float(annual_means.sel(year=year).values) - baseline) * 100
    projections.append({
        "year": int(year),
        "delta_cm": round(delta_cm, 2)
    })

# Format for your React slider
output = {
    "metadata": {
        "model": "cmcc_esm2",
        "scenario": "ssp2_4_5",
        "baseline_year": 2020
    },
    "projections": projections
}

with open('cmip6-projections.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✅ SUCCESS! The data is processed and ready for the map.")