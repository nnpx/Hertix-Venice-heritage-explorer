# Hertix Venice Heritage Explorer

Hertix is an interactive web application that explores Venice's rich cultural heritage while visualizing the impacts of climate change and rising sea levels. Built with modern web technologies, it provides an immersive experience of Venice's historic sites, allowing users to filter by categories, eras, and districts, and see how rising waters affect these treasures.

## Features

### 🗺️ Interactive Heritage Map
- **Leaflet-powered map** centered on Venice with custom markers for heritage sites
- **Color-coded categories**: Palaces (Gold), Churches (Purple), Living Heritage (Brown), Infrastructure (Blue)
- **Dynamic site visibility** based on current sea level settings
- **Site selection** with detailed popups and sidebar information

### 🔍 Advanced Filtering System
- **Category Filters**: Toggle visibility of Palaces, Churches, Living Heritage, and Infrastructure
- **Era Filters**: Explore sites from Byzantine (Pre-1300), Gothic (1300-1400s), Renaissance (1500s), and Baroque (1600s+) periods
- **District Filters**: Focus on specific Venetian sestieri (districts)

### 🌊 Water Level Visualization
- **Projected Sea Level Widget**: Interactive slider showing future sea level rise projections based on CMIP6 climate models
- **Live Water Level Widget**: Real-time tide data from Venice's official monitoring stations
- **Underwater Impact**: Sites below current water level are visually marked and counted
- **Elevation Data**: Each site includes elevation measurements for accurate flooding simulation

### 📊 Data Widgets
- **Site Counters**: Display total visible sites and those currently underwater
- **Social Pulse Widget**: Shows trending hashtags and visitor sentiment based on site type
- **Detailed Site Information**: Name, category, era, elevation, and location data

### 🔧 Technical Features
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Real-time Data**: Live tide API integration with automatic updates
- **Custom Data Processing**: Tools for converting CMIP6 NetCDF files to JSON projections
- **Open Data Integration**: Uses Venice's open data portal and OpenTripMap API

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Mapping**: Leaflet with React-Leaflet
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Processing**: Python with xarray for NetCDF handling

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hertix-venice-heritage-explorer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Explore the Map**: Use the interactive Leaflet map to browse Venice's heritage sites
2. **Apply Filters**: Use the filter panel to narrow down sites by category, era, or district
3. **Adjust Sea Levels**: Use the projected water level slider to see future flooding impacts
4. **View Live Data**: Check current tide levels from Venice's monitoring stations
5. **Select Sites**: Click on markers to view detailed information in the sidebar
6. **Monitor Impact**: Watch the counters for visible vs. underwater sites

## Data Sources

### Heritage Sites
- Custom curated dataset of Venice's most significant cultural sites
- Includes elevation data for flooding simulation
- Categorized by architectural type and historical era

### Climate Projections
- CMIP6 (Coupled Model Intercomparison Project Phase 6) data
- Sea level rise projections from various climate models and scenarios
- Processed using Python and xarray for web compatibility

### Live Tide Data
- Real-time water level data from Venice's official monitoring network
- Accessed via Venice's open data portal API
- Proxied through Next.js API routes for CORS handling

### Geographic Boundaries
- Venice district (sestiere) boundaries
- GeoJSON format for map visualization

## Customizing Climate Data

The app supports custom CMIP6 projections. To use your own data:

1. Obtain CMIP6 sea level projection data from Copernicus Climate Data Store
2. Download the NetCDF (.nc) file
3. Run the conversion script:
```bash
python convert_to_json.py
```
4. Replace `public/data/cmip6-projections.json` with your processed file

### Supported Projection Formats

**New Format (Recommended)**:
```json
{
  "metadata": {
    "model": "cmcc_esm2",
    "scenario": "ssp2_4_5",
    "baseline_year": 2020
  },
  "projections": [
    {
      "year": 2020,
      "delta_cm": 0,
      "model": "cmcc_esm2",
      "scenario": "ssp2_4_5"
    }
  ]
}
```

**Legacy Format**:
```json
[
  {
    "year": 2020,
    "levelCm": 15,
    "model": "cmcc_esm2",
    "scenario": "ssp2_4_5"
  }
]
```

## API Endpoints

- `GET /api/tide`: Proxies live tide data from Venice's monitoring stations

## Acknowledgments

- Venice Municipality for open tide data
- OpenTripMap for heritage site information
- Copernicus Climate Data Store for CMIP6 projections