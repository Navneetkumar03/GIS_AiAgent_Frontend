import { useState } from "react";
import SearchBar from './SearchBar'
import Dashboard from "./Dashboard";
import CityWiseAnalyse from "./CityWiseAnalyse";
import { DownloadIcon } from './Icons'
import './sidePanel.css'

// function normalizeKey(value) {
//     return String(value || '')
//         .trim()
//         .toLowerCase()
//         .replace(/[_\s-]+/g, '')
// }

export default function SidePanel({
    lat,
    lon,
    radiusKm,
    locationName,
    summary,
    isAnalyzing,
    isAnalyzed,
    onSearch,
    onClearSearch,
    onAnalyze,
    onDownload,
    setRadiusKm,
    openContextualPanel,
    setSelectedCategories,
    setShowGrid,
    showGrid,
    onHighlightZones, 
    onCategorySelect,  // ← new prop
    selectedZoneLayers,
    setCityWiseMode, 
    setCityWisePoiData
}) {
    const [showCityWiseAnalyse, setShowCityWiseAnalyse] = useState(false)

    function handleShowCityWiseAnalyse() {
        onClearSearch?.()
        setShowCityWiseAnalyse(true)
          setCityWiseMode(true)
    }

    return (
        <div
            className="side-panel-scrollbar flex w-80 shrink-0 flex-col gap-2 overflow-y-auto border-r border-white/40 bg-[#0f766e] p-2 backdrop-blur-md"
        >
            {showCityWiseAnalyse ? (
               <CityWiseAnalyse
    onBack={() => {
        setShowCityWiseAnalyse(false);
          setCityWiseMode(false)
        onHighlightZones([]);
        setCityWisePoiData?.(null)
    }}
    onZonesSelected={onHighlightZones}
    onCategorySelect={onCategorySelect}
       selectedZoneLayers={selectedZoneLayers}
/>
            ) : (
                <>
                    <SearchBar
                        onSearch={onSearch}
                        onClearSearch={onClearSearch}
                        onAnalyze={onAnalyze}
                        onOpenContextualPanel={openContextualPanel}
                        onShowCityWiseAnalyse={handleShowCityWiseAnalyse}
                        locationFound={!!lat}
                        isAnalyzing={isAnalyzing}
                        locationName={locationName}
                        setRadiusKm={setRadiusKm}
                        showGrid={showGrid}
                        setShowGrid={setShowGrid}
                    />
                    {isAnalyzed && (
                        <>
                            <Dashboard
                                locationName={locationName}
                                summary={summary}
                                lat={lat}
                                lon={lon}
                                radiusKm={radiusKm}
                                onDownload={onDownload}
                                onItemClick={() => openContextualPanel?.('panel')}
                                onSelectionChange={setSelectedCategories}
                            />

                            <div className="flex w-full items-center justify-center gap-1 rounded-2xl bg-white/72 py-2 text-sm font-semibold text-slate-900 transition hover:bg-[#14b8a6] hover:text-white hover:border hover:border-white">
                                <button
                                    onClick={onDownload}
                                    className="flex gap-2 items-center justify-center">
                                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-black text-white">
                                        <DownloadIcon className="h-4 w-4" />
                                    </span>
                                    <div className="text-xl">
                                        Download Report
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}





