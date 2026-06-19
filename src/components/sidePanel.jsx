import { useState } from "react";
import SearchBar from './SearchBar'
import Dashboard from "./Dashboard";
import CityWiseAnalyse from "./CityWiseAnalyse";
import { DownloadIcon } from './Icons'
import './sidePanel.css'

function normalizeKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s-]+/g, '')
}

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
    setIsAnalyzing,
    setIsAnalyzed,
    setSummary,
    setLat,
    setLon,
    setLocationName,
    setPoiData,
    setStatus,
    setSuggestions,
    setSessionId,
    setRadiusKm,
    addMessage,
    openContextualPanel,
    setSelectedCategories,
    setGridData,
    setShowGrid,
    showGrid,
    onRadiusChange,
    onHighlightZones, 
    onCategorySelect,  // ← new prop
}) {
    const [showCityWiseAnalyse, setShowCityWiseAnalyse] = useState(false)

    function handleShowCityWiseAnalyse() {
        onClearSearch?.()
        setShowCityWiseAnalyse(true)
    }

    return (
        <div
            className="side-panel-scrollbar flex w-80 shrink-0 flex-col gap-2 overflow-y-auto border-r border-white/40 bg-[#0f766e] p-2 backdrop-blur-md"
        >
            {showCityWiseAnalyse ? (
               <CityWiseAnalyse
    onBack={() => {
        setShowCityWiseAnalyse(false);
        onHighlightZones([]);
    }}
    onZonesSelected={onHighlightZones}
    onCategorySelect={onCategorySelect}
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












// import { useState } from "react";
// import SearchBar from './SearchBar'
// import Dashboard from "./Dashboard";
// import CityWiseAnalyse from "./CityWiseAnalyse";
// import { DownloadIcon } from './Icons'
// import './sidePanel.css'

// function normalizeKey(value) {
//     return String(value || '')
//         .trim()
//         .toLowerCase()
//         .replace(/[_\s-]+/g, '')
// }

// export default function SidePanel({ lat,
//     lon,
//     radiusKm,
//     locationName,
//     summary,
//     isAnalyzing,
//     isAnalyzed,
//     onSearch,
//     onClearSearch,
//     onAnalyze,
//     onDownload,
//     setIsAnalyzing,
//     setIsAnalyzed,
//     setSummary,
//     setLat,
//     setLon,
//     setLocationName,
//     setPoiData,
//     setStatus,
//     setSuggestions,
//     setSessionId,
//     setRadiusKm,
//     addMessage,
//     openContextualPanel,
//     setSelectedCategories,
//     setGridData,
//     setShowGrid,
//     showGrid,
//     onRadiusChange,
// }) {
//     const [showCityWiseAnalyse, setShowCityWiseAnalyse] = useState(false)

//     function handleShowCityWiseAnalyse() {
//         onClearSearch?.()
//         setShowCityWiseAnalyse(true)
//     }

//     return (
//         <div
//             className="side-panel-scrollbar flex w-80 shrink-0 flex-col gap-2 overflow-y-auto border-r border-white/40 bg-[#0f766e] p-2 backdrop-blur-md"
//         >
//             {showCityWiseAnalyse ? (
//                 <CityWiseAnalyse onBack={() => setShowCityWiseAnalyse(false)} />
//             ) : (
//                 <>
//                     <SearchBar
//                         onSearch={onSearch}
//                         onClearSearch={onClearSearch}
//                         onAnalyze={onAnalyze}
//                         onOpenContextualPanel={openContextualPanel}
//                         onShowCityWiseAnalyse={handleShowCityWiseAnalyse}
//                         locationFound={!!lat}
//                         isAnalyzing={isAnalyzing}
//                         locationName={locationName}
//                         setRadiusKm={setRadiusKm}
//                         showGrid={showGrid}
//                         setShowGrid={setShowGrid}
//                     />
//                     {isAnalyzed && (
//                         <>
//                             <Dashboard
//                                 locationName={locationName}
//                                 summary={summary}
//                                 lat={lat}
//                                 lon={lon}
//                                 radiusKm={radiusKm}
//                                 onDownload={onDownload}
//                                 onItemClick={() => openContextualPanel?.('panel')}
//                                 onSelectionChange={setSelectedCategories}

//                             />

//                             {/* {poiData?.pois && (
//                         <div className="rounded-xl border border-white/55 bg-white/72 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
//                             <div className="mb-3 flex items-center justify-between gap-2">
//                                 <div>
//                                     <h4 className="text-base font-semibold text-slate-900">Layer legend</h4>
//                                     <p className="text-xs text-slate-500">Toggle POI categories</p>
//                                 </div>
//                                 <button
//                                     type="button"
//                                     onClick={() => setSelectedCategories(Object.keys(poiData.pois).map(normalizeKey))}
//                                     className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
//                                 >
//                                     Reset
//                                 </button>
//                             </div>
//                             <div className="grid max-h-64 gap-2 overflow-y-auto">
//                                 {Object.keys(poiData.pois).map((category) => {
//                                     const key = normalizeKey(category)
//                                     const isSelected = selectedCategories.includes(key)
//                                     return (
//                                         <button
//                                             key={key}
//                                             type="button"
//                                             onClick={() => {
//                                                 const next = isSelected
//                                                     ? selectedCategories.filter((k) => k !== key)
//                                                     : [...selectedCategories, key]
//                                                 setSelectedCategories(next)
//                                             }}
//                                             className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${isSelected ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'}`}
//                                         >
//                                             <span className="text-sm font-medium truncate">{category}</span>
//                                             <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
//                                                 {isSelected ? 'Visible' : 'Hidden'}
//                                             </span>
//                                         </button>
//                                     )
//                                 })}
//                             </div>
//                         </div>
//                     )} */}

//                             <div className="flex w-full items-center justify-center gap-1 rounded-2xl  bg-white/72  py-2 text-sm font-semibold text-slate-900 transition hover:bg-[#14b8a6] hover:text-white hover:border hover:border-white">
//                                 <button
//                                     onClick={onDownload}
//                                     className="flex gap-2 items-center justify-center">
//                                     <span className="flex items-center justify-center h-5 w-5 rounded-full bg-black text-white">
//                                         <DownloadIcon className="h-4 w-4" />
//                                     </span>
//                                     <div className="text-xl">
//                                         Download Report
//                                     </div>
//                                 </button>
//                             </div>
//                         </>
//                     )}
//                 </>
//             )}
//         </div>
//     )
// }