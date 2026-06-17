import { useEffect, useState } from 'react'
import { ChevronDownIcon, SparklesIcon } from './Icons'
import { fetchCityWiseDropdownItems, analyzeZones, fetchDashboardCategories } from '../services/api'
import targetIcon from '../assets/target.png'

// Normalize key to match dashboard category keys
function normalizeKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s-]+/g, '')
}

const CityWiseAnalyse = ({ onBack, onAnalysisComplete }) => {
    const dropdownItems = ['Select city', 'Delhi']
    const [selectedItem, setSelectedItem] = useState(dropdownItems[0])
    const [secondDropdownItems, setSecondDropdownItems] = useState([])
    const [selectedZones, setSelectedZones] = useState(new Set())
    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const [itemsError, setItemsError] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)

    // ── Icon mapping from dashboard ──
    const [iconMap, setIconMap] = useState({})

    // Fetch dashboard categories to get icons
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

    // ── Load zones when city changes ──
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

    // ── Helpers ──
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
            next.has(value) ? next.delete(value) : next.add(value)
            return next
        })
    }

    function handleSelectAll() {
        setSelectedZones(new Set(secondDropdownItems.map(getZoneValue).map(String)))
    }
    function handleClearAll() {
        setSelectedZones(new Set())
    }

    // ── Analyze ──
    async function handleAnalyze() {
        if (selectedZones.size === 0) return
        setIsAnalyzing(true)
        setAnalysisResult(null)

        try {
            const result = await analyzeZones(selectedItem, [...selectedZones])
            setAnalysisResult(result)
            // Pass result up to SidePanel
            if (onAnalysisComplete) {
                onAnalysisComplete(result)
            }
        } catch (error) {
            alert(error.message || 'Analysis failed')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const citySelected = selectedItem !== dropdownItems[0]

    // ── Render cards with icons ──
    function renderSummaryCards(summary) {
        if (!summary || typeof summary !== 'object') return null

        const entries = Object.entries(summary)
        if (entries.length === 0) return null

        return (
            <div className="grid grid-cols-2 gap-2">
                {entries.map(([label, count]) => {
                    const normalizedLabel = normalizeKey(label)
                    const icon = iconMap[normalizedLabel] || ''

                    return (
                        <div
                            key={label}
                            className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 shadow-sm border border-slate-200/60"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {icon && (
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 overflow-hidden">
                                        <div
                                            className="h-full w-full flex items-center justify-center"
                                            dangerouslySetInnerHTML={{ __html: icon }}
                                        />
                                    </span>
                                )}
                                <span className="text-xs font-semibold uppercase text-slate-600 truncate">
                                    {label}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-cyan-700 ml-2">
                                {count}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="rounded-xl bg-white/72 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold uppercase text-slate-900">City Wise Analyse</h3>
                <div className="group relative inline-block">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-full bg-cyan-300 p-1 text-sm font-semibold text-white transition hover:bg-cyan-700"
                    >
                        <img src={targetIcon} alt="Back" className="h-6 w-6" />
                    </button>
                    <span className="pointer-events-none absolute top-4 right-2 mt-3 rounded bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap scale-95 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
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
                                                className="h-3.5 w-3.5 accent-blue-600"
                                            />
                                            {label}
                                        </label>
                                    )
                                })}
                            </div>

                            {selectedZones.size > 0 && (
                                <p className="mt-1 text-xs text-cyan-700">
                                    {selectedZones.size} zone(s) selected
                                </p>
                            )}
                        </>
                    ) : null}

                    {/* Analyze button */}
                    <div className="mt-3">
                        <button
                            onClick={handleAnalyze}
                            disabled={selectedZones.size === 0 || isAnalyzing}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/40 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/50 disabled:cursor-not-allowed disabled:from-[#87aacf] disabled:to-[#3d88d8] disabled:shadow-none disabled:opacity-60"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Selected Zones'}</span>
                        </button>
                    </div>

                    {/* ─── CARDS with icons ─── */}
                    {analysisResult && (
                        <div className="mt-4">
                            {analysisResult.summary && (
                                <>
                                    <h4 className="text-sm font-bold uppercase text-slate-700 mb-2">
                                        Summary
                                    </h4>
                                    {renderSummaryCards(analysisResult.summary)}
                                </>
                            )}

                            {/* Optional: Zone details (if available) */}
                            {analysisResult.zone_details && (
                                <>
                                    <h4 className="text-sm font-bold uppercase text-slate-700 mt-4 mb-2">
                                        Zone Details
                                    </h4>
                                    <div className="space-y-2">
                                        {analysisResult.zone_details.map((zone) => (
                                            <div
                                                key={zone.zone_id || zone.id}
                                                className="rounded-xl bg-white/80 p-3 shadow-sm border border-slate-200/60"
                                            >
                                                <div className="font-semibold text-slate-800">
                                                    {zone.name || zone.zone_name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {zone.poi_counts
                                                        ? Object.entries(zone.poi_counts)
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(' · ')
                                                        : 'No POI data'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Fallback: show raw data if no known structure */}
                            {!analysisResult.summary && !analysisResult.zone_details && (
                                <div className="rounded-xl bg-white/80 p-3 text-xs text-slate-600 border border-slate-200/60">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(analysisResult, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default CityWiseAnalyse