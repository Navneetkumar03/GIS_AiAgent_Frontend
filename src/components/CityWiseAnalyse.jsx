import { useEffect, useState } from 'react'
import { ChevronDownIcon, SparklesIcon } from './Icons'
import { fetchCityWiseDropdownItems, analyzeZones, fetchDashboardCategories } from '../services/api'
import targetIcon from '../assets/target.png'

function normalizeKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s-]+/g, '')
}

// ── Shared helpers for "Car Showroom" extraction/exclusion ──
// Previously this logic was copy-pasted in four different places
// (combined total, combined infra reduce, per-zone count, per-zone infra filter).
// Centralizing it here means there's only one place to fix if the key ever changes.
function getShowroomCount(summary) {
    if (!summary || typeof summary !== 'object') return 0
    const key = Object.keys(summary).find(k => normalizeKey(k) === 'carshowroom')
    return key ? summary[key] : 0
}

function excludeShowroom(summary) {
    if (!summary || typeof summary !== 'object') return {}
    return Object.fromEntries(
        Object.entries(summary).filter(([key]) => normalizeKey(key) !== 'carshowroom')
    )
}

const CityWiseAnalyse = ({
    onBack,
    onAnalysisComplete,
    onZonesSelected,
    onCategorySelect,
selectedZoneLayers
}) => {
    const dropdownItems = ['Select city', 'Delhi']
    const [selectedItem, setSelectedItem] = useState(dropdownItems[0])
    const [secondDropdownItems, setSecondDropdownItems] = useState([])
    const [selectedZones, setSelectedZones] = useState(new Set())
    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const [itemsError, setItemsError] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [activeCard, setActiveCard] = useState(null)

    const [iconMap, setIconMap] = useState({})

    useEffect(() => {
        let mounted = true
        async function loadIcons() {
            try {
                const categories = await fetchDashboardCategories()
                if (!mounted) return
                const map = {}
                categories.forEach(item => {
                    const key = normalizeKey(item.label || item.key)
                    map[key] = item.icon || ''
                })
                setIconMap(map)
            } catch (error) {
                console.error('Failed to load category icons:', error)
            }
        }
        loadIcons()
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        if (selectedItem === dropdownItems[0]) {
            setSecondDropdownItems([])
            setSelectedZones(new Set())
            setItemsError('')
            return
        }

        let ignore = false
        async function loadItems() {
            setIsLoadingItems(true)
            setItemsError('')
            setSelectedZones(new Set())

            try {
                const items = await fetchCityWiseDropdownItems(selectedItem)
                if (!ignore) setSecondDropdownItems(items)
            } catch {
                if (!ignore) {
                    setSecondDropdownItems([])
                    setItemsError('Unable to load items')
                }
            } finally {
                if (!ignore) setIsLoadingItems(false)
            }
        }

        loadItems()
        return () => { ignore = true }
    }, [selectedItem])

    function getZoneValue(item) {
        return typeof item === 'string'
            ? item
            : item.value ?? item.key ?? item.id ?? item.zone_id ?? item.zone ?? item.label ?? item.name
    }
    function getZoneLabel(item) {
        return typeof item === 'string'
            ? item
            : item.label ?? item.name ?? item.zone_name ?? item.zone ?? item.value ?? String(item.id ?? '')
    }

    function handleZoneToggle(value) {
        setSelectedZones(prev => {
            const next = new Set(prev)
            if (next.has(value)) {
                next.delete(value)
            } else {
                next.add(value)
            }
            return next
        })
    }

    function handleSelectAll() {
        setSelectedZones(new Set(secondDropdownItems.map(getZoneValue).map(String)))
    }
    function handleClearAll() {
        setSelectedZones(new Set())
    }

    async function handleAnalyze() {
        if (selectedZones.size === 0) return
        setIsAnalyzing(true)
        setAnalysisResult(null)

        try {
            const result = await analyzeZones(selectedItem, [...selectedZones])
            setAnalysisResult(result)
            if (onAnalysisComplete) {
                onAnalysisComplete(result)
            }

            // --- NEW: pass selected zone labels to parent (for map highlighting) ---
            if (onZonesSelected) {
                const selectedLabels = secondDropdownItems
                    .filter(item => selectedZones.has(getZoneValue(item)))
                    .map(item => getZoneLabel(item))
                onZonesSelected(selectedLabels)
            }
        } catch (error) {
            alert(error.message || 'Analysis failed')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const citySelected = selectedItem !== dropdownItems[0]

    // ── Reusable card renderer ──
// function handleCategoryClick(category) {

//     if (!analysisResult?.zones?.length) return

//     let allPois = []

//     analysisResult.zones.forEach(zone => {

//         const pois =
//             zone?.pois?.[category] || []

//         allPois.push(...pois)
//     })

//     console.log(category)
//     console.log(allPois)

//     onCategorySelect?.(
//         category,
//         allPois
//     )
// }
function handleCategoryClick(zoneName, category) {

    const zone = analysisResult?.zones?.find(
        z => z.zone === zoneName
    )

    if (!zone) return

    const pois = zone?.pois?.[category] || []

    setActiveCard(`${zoneName}-${category}`)

    onCategorySelect?.(
        category,
        pois,
        zoneName
    )
}
    function renderSummaryCards(summary,zoneName) {
        if (!summary || typeof summary !== 'object') return null

        const entries = Object.entries(summary)
        if (entries.length === 0) return null

        return (
            <div className="grid grid-cols-2 gap-1.5">
                {entries.map(([label, count]) => {
                    const isActive =
    selectedZoneLayers.some(
        item =>
            item.zoneName === zoneName &&
            item.category === label
    )
                    const normalizedLabel = normalizeKey(label)
                    const icon = iconMap[normalizedLabel] || ''

                    return (
                        <div
                            key={label}
                               onClick={() => handleCategoryClick(zoneName,label)}
                         className={`
    flex flex-col items-center justify-center
    rounded-lg px-2 py-1.5 shadow-sm border cursor-pointer

   ${
    isActive
        ? 'bg-cyan-500 border-cyan-600'
        : 'bg-white/80 border-slate-200/60'
}
`}
                        >
                            {/* Row 1: Icon + Name (side by side) */}
                            <div className="flex items-center gap-1.5 w-full justify-center">
                                {icon && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 overflow-hidden">
                                        <div
                                            className="h-full w-full flex items-center justify-center"
                                            dangerouslySetInnerHTML={{ __html: icon }}
                                        />
                                    </span>
                                )}
                                <span className="text-[9px] font-semibold uppercase text-slate-600 break-words leading-tight">
                                    {label}
                                </span>
                            </div>
                            {/* Row 2: Count (below) */}
                            <span className="text-sm font-bold text-cyan-700 leading-tight">
                                {count}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

    // ── Helper to extract total registrations from vehicle_registration_summary ──
    function getTotalRegistrations(regSummary) {
        if (!regSummary || typeof regSummary !== 'object') return 0
        // If it's already a number, return it
        if (typeof regSummary === 'number') return regSummary
        // If it's an object, sum all numeric values
        const values = Object.values(regSummary)
        if (values.every(v => typeof v === 'number')) {
            return values.reduce((a, b) => a + b, 0)
        }
        // Fallback: try common keys
        return regSummary.total || regSummary.registrations || regSummary.count || 0
    }

    // ── Derived analysis aggregates ──
    // Computed once here (instead of inline inside JSX) so the values used to decide
    // *whether* to show a section and the values used to *render* it can never disagree.
    const zones = analysisResult?.zones || []
    const hasZones = zones.length > 0

    const totalShowrooms = hasZones
        ? zones.reduce((sum, zone) => sum + getShowroomCount(zone.summary), 0)
        : 0

    const totalVehicles = hasZones
        ? zones.reduce((sum, zone) => sum + getTotalRegistrations(zone.vehicle_registration_summary), 0)
        : 0

    const combinedInfra = hasZones
        ? zones.reduce((acc, zone) => {
            Object.entries(excludeShowroom(zone.summary)).forEach(([key, count]) => {
                acc[key] = (acc[key] || 0) + count
            })
            return acc
        }, {})
        : {}

    const hasCombinedInfra = Object.keys(combinedInfra).length > 0
    const hasRoadData = zones.some(z => z.road_summary && Object.keys(z.road_summary).length > 0)

    return (
        <div className="rounded-xl bg-white/72 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            {/* Header */}
<div className="mb-1 flex items-center justify-between">
    <div className="flex h-3 w-3 min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/15">
       <img
    src={targetIcon}
    alt="City Wise Analyse"
    className="h-5 w-5 brightness-0 invert"
/>
    </div>

    <div>
        <h3 className="font-bold uppercase text-slate-900">
            City Wise Analyse
        </h3>
    </div>

    <div className="group relative inline-block">
      <button
    type="button"
    onClick={onBack}
    className="group rounded-full bg-cyan-300 p-1 text-sm font-semibold text-white transition hover:bg-cyan-700"
>
    <img
        src={targetIcon}
        alt="Back"
        className="h-6 w-6 transition-all duration-200 group-hover:brightness-0 group-hover:invert"
    />
</button>

        <span
            className="pointer-events-none absolute top-4 right-2 mt-3 rounded
                       bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap
                       scale-95 opacity-0 transition-all duration-150
                       group-hover:scale-100 group-hover:opacity-100"
        >
            Explore by location
        </span>
    </div>
</div>

            {/* City dropdown */}
            <div className="mt-4">
                <div className="relative">
                    <select
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 pr-10 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                    >
                        {dropdownItems.map((item, i) => (
                            <option key={item} value={item} disabled={i === 0}>{item}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-700" />
                </div>
            </div>

            {/* Zone checkbox list */}
            {citySelected && (
                <div className="mt-3">
                    {isLoadingItems ? (
                        <p className="text-xs text-slate-400 px-1">Loading zones...</p>
                    ) : itemsError ? (
                        <p className="text-xs font-semibold text-rose-600 px-1">{itemsError}</p>
                    ) : secondDropdownItems.length > 0 ? (
                        <>
                            <div className="mb-1.5 flex items-center justify-between px-0.5">
                                <span className="text-xs text-slate-500">Select zones</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs text-cyan-700 hover:underline"
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs text-slate-400 hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white/90">
                                {secondDropdownItems.map((item) => {
                                    const value = String(getZoneValue(item))
                                    const label = String(getZoneLabel(item))
                                    const checked = selectedZones.has(value)

                                    return (
                                        <label
                                            key={value}
                                            className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2 text-sm text-slate-800 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleZoneToggle(value)}
                                                className="h-3.5 w-3.5 accent-[#bcd9d7]"
                                            />
                                            {label}
                                        </label>
                                    )
                                })}
                            </div>

                            {selectedZones.size > 0 && (
                                <p className="mt-1 text-xs text-cyan-700">
                                    {selectedZones.size} zone selected
                                </p>
                            )}
                        </>
                    ) : null}

                    {/* Analyze button */}
                    <div className="mt-3">
                        <button
                            onClick={handleAnalyze}
                            disabled={selectedZones.size === 0 || isAnalyzing}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/40 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/50 disabled:cursor-not-allowed disabled:from-[#87aacf] disabled:to-[#3d88d8] disabled:shadow-none disabled:opacity-60"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Selected Zones'}</span>
                        </button>
                    </div>

                    {/* ─── RESULT RENDERING ─── */}
                    {hasZones && (
                        <div className="mt-4 space-y-5">

                            {/* 1. Combined Car Showroom Market Summary */}
                            <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 p-3 shadow-sm">
                                <h4 className="text-sm font-bold uppercase text-cyan-800 flex items-center justify-center gap-2 mb-2">
                                    Car Showroom Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="rounded-xl bg-white/80 px-2 py-2 shadow-sm border border-slate-200 overflow-hidden">
                                        <p className="text-[9px] text-slate-500 uppercase truncate font-extrabold">Total Car Dealers</p>
                                        <p className="text-lg font-bold text-cyan-700">{totalShowrooms}</p>
                                        <p className="text-[9px] text-slate-400 truncate font-semibold">Competition level</p>
                                    </div>
                                    <div className="rounded-xl bg-white/80 px-2 py-2 shadow-sm border border-slate-200 overflow-hidden">
                                        <p className="text-[9px] text-slate-500 uppercase truncate font-extrabold">Total Registrations</p>
                                        <p className="text-lg font-bold text-cyan-700">{totalVehicles.toLocaleString()}</p>
                                        <p className="text-[9px] text-slate-400 truncate font-semibold">Potential customers</p>
                                    </div>
                                </div>
                                {hasRoadData && (
                                    <div className="mt-2 text-[11px] text-slate-600 bg-white/70 rounded-lg px-3 py-2 font-extrabold">
                                        Road connectivity: Available in selected zones
                                    </div>
                                )}
                            </div>

                            {/* 2. Supporting Infrastructure (combined, excluding car-related) */}
                            {/* {hasCombinedInfra && (
                                <>
                                    <h4 className="text-sm font-bold uppercase text-slate-700 text-center">
                                        Supporting Infra (Combined)
                                    </h4>
                                    {renderSummaryCards(combinedInfra)}
                                </>
                            )} */}

                            {/* 3. Zone-wise Details */}
                            <hr className="border-slate-200" />
                            <h4 className="text-sm font-bold uppercase text-slate-700 text-center">
                                Zone wise Details
                            </h4>
{zones.map((zone, idx) => {

    const zoneName =
        zone.zone || `Zone ${idx + 1}`

    const showroomCount =
        getShowroomCount(zone.summary)

    const regCount =
        getTotalRegistrations(
            zone.vehicle_registration_summary
        )

    const infraSummary =
        excludeShowroom(zone.summary)

    const isShowroomActive =
        selectedZoneLayers.some(
            item =>
                item.zoneName === zoneName &&
                item.category === "Car Showroom"
        )
const showroomIcon =
    iconMap["carshowroom"] || ""
    return (
        <div
            key={zoneName}
            className="rounded-xl bg-white/80 p-3 shadow-sm border border-slate-200/60"
        >

            {/* Zone Name */}
            <h5 className="font-bold text-slate-800 text-lg mb-2 text-center">
                {zoneName}
            </h5>

            {/* Total Registration Full Width */}
            {regCount > 0 && (
                <div className="mb-2 bg-blue-100 rounded-xl px-3 py-2 flex flex-col items-center">
                    <span className="text-[9px] font-medium text-blue-700 uppercase">
                        Total Registrations
                    </span>

                    <span className="text-lg font-bold text-blue-900">
                        {regCount.toLocaleString()}
                    </span>
                </div>
            )}

            {/* All Cards Grid */}
            <div className="grid grid-cols-2 gap-1.5">

                {/* Car Dealers Card */}
             {showroomCount > 0 && (
    <div
        onClick={() =>
            handleCategoryClick(
                zoneName,
                "Car Showroom"
            )
        }
        className={`
            flex flex-col items-center justify-center
            rounded-lg px-2 py-1.5 shadow-sm border cursor-pointer

            ${
                isShowroomActive
                    ? 'bg-[#14b8a6] border-cyan-600 text-white'
                    : 'bg-white/80 border-slate-200/60'
            }
        `}
    >

        <div className="flex items-center gap-1.5">

            {showroomIcon && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 overflow-hidden">
                    <div
                        className="h-full w-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{
                            __html: showroomIcon
                        }}
                    />
                </span>
            )}

            <span
                className={`text-[9px] font-semibold uppercase ${
                    isShowroomActive
                        ? 'text-white'
                        : 'text-cyan-700'
                }`}
            >
                Total Car Dealers
            </span>
        </div>

        <span
            className={`text-sm font-bold ${
                isShowroomActive
                    ? 'text-white'
                    : 'text-cyan-900'
            }`}
        >
            {showroomCount}
        </span>

    </div>
)}

                {/* Infrastructure Cards */}
                {Object.entries(infraSummary).map(
                    ([label, count]) => {

                        const isActive =
                            selectedZoneLayers.some(
                                item =>
                                    item.zoneName === zoneName &&
                                    item.category === label
                            )

                        const normalizedLabel =
                            normalizeKey(label)

                        const icon =
                            iconMap[normalizedLabel] || ''

                        return (
                            <div
                                key={label}
                                onClick={() =>
                                    handleCategoryClick(
                                        zoneName,
                                        label
                                    )
                                }
                                className={`
                                    flex flex-col items-center justify-center
                                    rounded-lg px-2 py-1.5 shadow-sm border cursor-pointer

                                    ${
                                        isActive
                                            ? 'bg-[#14b8a6] border-cyan-600 text-white'
                                            : 'bg-white/80 border-slate-200/60'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-1.5 w-full justify-center">

                                    {icon && (
                                        <span
                                            className={`
                                                flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden
                                                ${
                                                    isActive
                                                        ? 'bg-white/20'
                                                        : 'bg-blue-50'
                                                }
                                            `}
                                        >
                                            <div
                                                className="h-full w-full flex items-center justify-center"
                                                dangerouslySetInnerHTML={{
                                                    __html: icon
                                                }}
                                            />
                                        </span>
                                    )}

                                    <span
                                        className={`text-[9px] font-semibold uppercase break-words leading-tight ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </div>

                                <span
                                    className={`text-sm font-bold leading-tight ${
                                        isActive
                                            ? 'text-white'
                                            : 'text-cyan-700'
                                    }`}
                                >
                                    {count}
                                </span>
                            </div>
                        )
                    }
                )}
            </div>

        </div>
    )
})}

                        </div>
                    )}

                    {/* Fallback: if zones array missing or empty */}
                    {analysisResult && !hasZones && (
                        <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs text-slate-600 border border-slate-200/60">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(analysisResult, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default CityWiseAnalyse