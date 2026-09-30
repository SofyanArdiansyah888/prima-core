import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Factory,
    MapPin,
    Truck,
    Layers,
    Navigation,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Eye,
    Scale,
    Phone,
    Activity,
    SlidersHorizontal,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

type Plant = {
    id: number;
    uuid: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number;
    lng: number;
    status: string;
    daily_capacity_m3: number | null;
};

type DeliveryItem = {
    id: number;
    surat_jalan_code?: string;
    surat_jalan_uuid?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_phone?: string | null;
    status: string;
    dispatch_status?: string;
    delivery_sequence: number;
    customer_name: string;
    project_title: string | null;
    destination_address: string;
    lat: number;
    lng: number;
    product_name?: string;
    product_code?: string;
    quantity: number;
    unit: string;
    plant_name?: string;
    plant_lat?: number;
    plant_lng?: number;
};

type MapTheme = 'grey' | 'dark' | 'standard';

export function DeliveryMap({
    plants,
    deliveries,
}: {
    plants: Plant[];
    deliveries: DeliveryItem[];
}) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const [mapTheme, setMapTheme] = useState<MapTheme>('grey');
    const [filterType, setFilterType] = useState<'all' | 'plants' | 'deliveries'>('all');
    const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

    // Initial center: Sulawesi Selatan corridor (Pangkep - Maros - Makassar)
    const defaultCenter: [number, number] = [-4.95, 119.55];
    const defaultZoom = 10;

    // Calculate live stats
    const totalVolumeInTransit = useMemo(() => {
        return deliveries.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
    }, [deliveries]);

    const activeTrucksCount = useMemo(() => {
        const uniqueTrucks = new Set(deliveries.map((d) => d.vehicle_number).filter(Boolean));
        return uniqueTrucks.size;
    }, [deliveries]);

    // Initialize Standard OpenStreetMap (100% Free & No API Key)
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: defaultZoom,
                zoomControl: false,
                attributionControl: false,
            });

            L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

            // Official Free OpenStreetMap Tile Layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                subdomains: ['a', 'b', 'c'],
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            mapInstanceRef.current = map;
        }
    }, []);

    // Render Markers & Routes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers, polylines, and circles
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });

        // 1. Render Batching Plants
        if (filterType === 'all' || filterType === 'plants') {
            plants.forEach((plant) => {
                if (!plant.lat || !plant.lng) return;

                const isPlantSelected = selectedPlant?.id === plant.id;

                const plantIcon = L.divIcon({
                    className: 'custom-map-icon',
                    html: `
                        <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
                            <!-- Radar Pulse Beacon Effect -->
                            <div class="tonasa-radar-pulse"></div>
                            
                            <!-- Plant Badge Card -->
                            <div style="
                                background: #0c1d37;
                                color: #ffffff;
                                padding: 6px 12px;
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 800;
                                box-shadow: 0 10px 25px -3px rgba(12, 29, 55, 0.45), 0 4px 6px -4px rgba(12, 29, 55, 0.2);
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                border: 2px solid ${isPlantSelected ? '#ea580c' : '#ffffff'};
                                white-space: nowrap;
                                letter-spacing: 0.3px;
                                backdrop-filter: blur(8px);
                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                            ">
                                <span style="
                                    background: #ea580c;
                                    color: #ffffff;
                                    width: 22px;
                                    height: 22px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border-radius: 7px;
                                    font-size: 11px;
                                ">🏭</span>
                                <div style="display: flex; flex-direction: column; text-align: left;">
                                    <span style="font-weight: 800; font-size: 11px; line-height: 1.2;">
                                        ${plant.name.replace('Batching Plant ', 'BP ')}
                                    </span>
                                    <span style="font-size: 9px; font-weight: 600; color: #cbd5e1; font-family: monospace;">
                                        ${plant.code} · ${plant.daily_capacity_m3 ? plant.daily_capacity_m3 + ' m³/d' : 'Ready'}
                                    </span>
                                </div>
                            </div>

                            <!-- Pointer Arrow -->
                            <div style="
                                width: 0;
                                height: 0;
                                border-left: 6px solid transparent;
                                border-right: 6px solid transparent;
                                border-top: 7px solid #0c1d37;
                                margin-top: -1px;
                            "></div>
                            
                            <!-- Anchor Dot -->
                            <div style="
                                width: 10px;
                                height: 10px;
                                background: #ea580c;
                                border: 2px solid #ffffff;
                                border-radius: 50%;
                                box-shadow: 0 0 12px #ea580c;
                                margin-top: -3px;
                            "></div>
                        </div>
                    `,
                    iconSize: [0, 0],
                });

                const marker = L.marker([plant.lat, plant.lng], { icon: plantIcon }).addTo(map);
                marker.on('click', () => {
                    setSelectedPlant(plant);
                    setSelectedItem(null);
                });
            });
        }

        // 2. Render Deliveries & Animated Routes
        if (filterType === 'all' || filterType === 'deliveries') {
            const groupedBySJ: { [code: string]: DeliveryItem[] } = {};
            deliveries.forEach((d) => {
                const code = d.surat_jalan_code || 'SJ-UNKNOWN';
                if (!groupedBySJ[code]) groupedBySJ[code] = [];
                groupedBySJ[code].push(d);
            });

            Object.entries(groupedBySJ).forEach(([sjCode, items]) => {
                items.sort((a, b) => a.delivery_sequence - b.delivery_sequence);
                const first = items[0];
                const isMultiDrop = items.length > 1;

                if (first.plant_lat && first.plant_lng) {
                    const routePoints: [number, number][] = [[first.plant_lat, first.plant_lng]];
                    items.forEach((it) => {
                        if (it.lat && it.lng) {
                            routePoints.push([it.lat, it.lng]);
                        }
                    });

                    if (routePoints.length > 1) {
                        // Background glow line
                        L.polyline(routePoints, {
                            color: isMultiDrop ? '#2563eb' : '#ea580c',
                            weight: 6,
                            opacity: 0.25,
                            lineCap: 'round',
                        }).addTo(map);

                        // Animated Dashed Line
                        L.polyline(routePoints, {
                            color: isMultiDrop ? '#1d4ed8' : '#ea580c',
                            weight: 3.5,
                            dashArray: '8, 8',
                            opacity: 0.9,
                            className: 'tonasa-moving-route',
                        }).addTo(map);
                    }
                }

                // Render Customer Destination Drop Markers
                items.forEach((item) => {
                    if (!item.lat || !item.lng) return;

                    const isSelected = selectedItem?.id === item.id;
                    const badgeColor = isMultiDrop
                        ? 'linear-gradient(135deg, #1e40af, #2563eb)'
                        : 'linear-gradient(135deg, #0c1d37, #1e293b)';
                    const accentPill = isMultiDrop ? '#60a5fa' : '#ea580c';

                    const destIcon = L.divIcon({
                        className: 'custom-map-icon',
                        html: `
                            <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
                                <div style="
                                    background: ${badgeColor};
                                    color: #ffffff;
                                    padding: 5px 10px;
                                    border-radius: 10px;
                                    font-size: 11px;
                                    font-weight: 700;
                                    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
                                    display: flex;
                                    align-items: center;
                                    gap: 6px;
                                    border: 2px solid ${isSelected ? '#ea580c' : '#ffffff'};
                                    white-space: nowrap;
                                    max-width: 240px;
                                    backdrop-filter: blur(6px);
                                    transition: all 0.2s;
                                ">
                                    <span style="
                                        background: ${accentPill};
                                        color: #ffffff;
                                        padding: 1px 5px;
                                        border-radius: 6px;
                                        font-size: 9px;
                                        font-weight: 900;
                                        font-family: monospace;
                                    ">#${item.delivery_sequence}</span>
                                    <div style="display: flex; flex-direction: column; overflow: hidden;">
                                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px;">
                                            ${item.customer_name}
                                        </span>
                                        <span style="font-size: 9px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            ${item.quantity} ${item.unit} ${item.product_name || 'Beton'}
                                        </span>
                                    </div>
                                </div>
                                <div style="
                                    width: 0;
                                    height: 0;
                                    border-left: 5px solid transparent;
                                    border-right: 5px solid transparent;
                                    border-top: 6px solid #0c1d37;
                                    margin-top: -1px;
                                "></div>
                                <div style="
                                    width: 8px;
                                    height: 8px;
                                    background: ${isSelected ? '#ea580c' : '#3b82f6'};
                                    border: 2px solid #ffffff;
                                    border-radius: 50%;
                                    box-shadow: 0 0 10px ${isSelected ? '#ea580c' : '#3b82f6'};
                                "></div>
                            </div>
                        `,
                        iconSize: [0, 0],
                    });

                    const marker = L.marker([item.lat, item.lng], { icon: destIcon }).addTo(map);
                    marker.on('click', () => {
                        setSelectedItem(item);
                        setSelectedPlant(null);
                    });
                });
            });
        }
    }, [plants, deliveries, filterType, selectedItem, selectedPlant]);

    // Controls
    const resetView = () => {
        const map = mapInstanceRef.current;
        if (map) {
            map.flyTo(defaultCenter, defaultZoom, { duration: 1.2 });
        }
    };

    const zoomIn = () => mapInstanceRef.current?.zoomIn();
    const zoomOut = () => mapInstanceRef.current?.zoomOut();

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 shadow-xl dark:border-slate-800">
            {/* Pure CSS map filters for Grey / Dark / Standard (No external API keys required) */}
            <style>{`
                .custom-map-icon {
                    background: transparent !important;
                    border: none !important;
                }
                
                /* 1. Theme: Abu-abu Minimalis (Grayscale OSM) */
                .theme-grey-tiles .leaflet-tile-pane {
                    filter: grayscale(100%) contrast(108%) brightness(95%);
                }

                /* 2. Theme: Dark Mode (Inverted & High-Contrast OSM) */
                .theme-dark-tiles .leaflet-tile-pane {
                    filter: grayscale(100%) invert(100%) contrast(125%) brightness(88%);
                }

                /* 3. Theme: Standard Natural OSM */
                .theme-standard-tiles .leaflet-tile-pane {
                    filter: saturate(105%) contrast(102%);
                }

                .tonasa-radar-pulse {
                    position: absolute;
                    top: 18px;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(234, 88, 12, 0.35);
                    border: 1.5px solid rgba(234, 88, 12, 0.7);
                    animation: tonasa-radar 2.4s infinite ease-out;
                    pointer-events: none;
                    z-index: -1;
                }
                @keyframes tonasa-radar {
                    0% {
                        transform: translate(-50%, -50%) scale(0.4);
                        opacity: 1;
                    }
                    70% {
                        transform: translate(-50%, -50%) scale(2.2);
                        opacity: 0.15;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(2.8);
                        opacity: 0;
                    }
                }
                .tonasa-moving-route {
                    stroke-dashoffset: 0;
                    animation: tonasa-dash 25s linear infinite;
                }
                @keyframes tonasa-dash {
                    to {
                        stroke-dashoffset: -1000;
                    }
                }
            `}</style>

            {/* Top HUD Control Bar */}
            <div className="absolute top-3.5 left-3.5 right-3.5 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                {/* Left Live Badge & Filters */}
                <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-2xl shadow-lg">
                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#0c1d37] rounded-xl border border-slate-700/80 text-white">
                        <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                            LIVE RADAR
                        </span>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                filterType === 'all'
                                    ? 'bg-[#ea580c] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Semua ({plants.length + deliveries.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('plants')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                filterType === 'plants'
                                    ? 'bg-[#ea580c] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            🏭 Plant ({plants.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('deliveries')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                filterType === 'deliveries'
                                    ? 'bg-[#ea580c] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            🚚 Pengantaran ({deliveries.length})
                        </button>
                    </div>
                </div>

                {/* Right Theme Style & Action Controls */}
                <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-2xl shadow-lg">
                    {/* Theme Filter Selection */}
                    <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setMapTheme('grey')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                mapTheme === 'grey'
                                    ? 'bg-slate-100 text-slate-900 shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Tampilan Peta Abu-abu Minimalis (OpenStreetMap)"
                        >
                            Abu-abu
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapTheme('dark')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                mapTheme === 'dark'
                                    ? 'bg-slate-700 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Tampilan Peta Mode Gelap"
                        >
                            Gelap
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapTheme('standard')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                mapTheme === 'standard'
                                    ? 'bg-[#0c1d37] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Tampilan Peta Warna Standar"
                        >
                            Standar
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-700 mx-0.5" />

                    {/* Reset Center */}
                    <button
                        type="button"
                        onClick={resetView}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                        title="Reset Fokus Peta (Sulawesi Selatan)"
                    >
                        <RotateCcw className="size-3.5" />
                    </button>

                    {/* Zoom Buttons */}
                    <button
                        type="button"
                        onClick={zoomIn}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                        title="Perbesar Peta"
                    >
                        <ZoomIn className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={zoomOut}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                        title="Perkecil Peta"
                    >
                        <ZoomOut className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* Map Canvas with dynamic Theme Class */}
            <div className={`relative h-[560px] w-full bg-slate-100 dark:bg-slate-950 theme-${mapTheme}-tiles`}>
                <div ref={mapContainerRef} className="h-full w-full z-0" />

                {/* Floating Drawer: Selected Delivery Item */}
                {selectedItem && (
                    <div className="absolute bottom-14 left-4 right-4 sm:right-auto sm:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xl z-[1000] text-xs space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-[#ea580c] px-2 py-0.5 font-mono text-xs font-black text-white">
                                    Stop #{selectedItem.delivery_sequence}
                                </span>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                                        {selectedItem.customer_name}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        Ref: {selectedItem.surat_jalan_code}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="size-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyek & Lokasi:</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                                {selectedItem.project_title || 'Proyek Lapangan'}
                            </p>
                            <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5 flex items-start gap-1">
                                <MapPin className="size-3 text-[#ea580c] shrink-0 mt-0.5" />
                                <span>{selectedItem.destination_address}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-700/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Muatan</span>
                                <p className="font-mono font-black text-[#0c1d37] dark:text-emerald-400 text-xs mt-0.5">
                                    {selectedItem.quantity} {selectedItem.unit}
                                </p>
                                <span className="text-[10px] text-slate-500 truncate block">
                                    {selectedItem.product_name ?? 'Ready Mix'}
                                </span>
                            </div>
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-700/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Armada Mixer</span>
                                <p className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                                    {selectedItem.vehicle_number}
                                </p>
                                <span className="text-[10px] text-slate-500 truncate block">
                                    Driver: {selectedItem.driver_name}
                                </span>
                            </div>
                        </div>

                        {selectedItem.surat_jalan_uuid && (
                            <Button asChild size="sm" className="w-full h-8 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] text-white text-xs font-bold">
                                <Link href={`/dispatch/surat-jalan/${selectedItem.surat_jalan_uuid}`}>
                                    <Eye className="size-3.5 mr-1" />
                                    <span>Buka Surat Jalan Terkait</span>
                                </Link>
                            </Button>
                        )}
                    </div>
                )}

                {/* Floating Drawer: Selected Plant */}
                {selectedPlant && (
                    <div className="absolute bottom-14 left-4 right-4 sm:right-auto sm:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xl z-[1000] text-xs space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-[#0c1d37] text-[#ea580c] flex items-center justify-center font-bold text-sm shadow-xs">
                                    🏭
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                                        {selectedPlant.name}
                                    </h4>
                                    <span className="font-mono text-[10px] font-bold text-slate-400">
                                        Kode: {selectedPlant.code}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPlant(null)}
                                className="size-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Unit Produksi:</span>
                            <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">{selectedPlant.address || 'Kawasan Industri Semen Tonasa'}</p>
                            {selectedPlant.phone && (
                                <p className="font-mono text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                                    <Phone className="size-3 text-slate-400" />
                                    <span>{selectedPlant.phone}</span>
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-700/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Kapasitas Harian</span>
                                <p className="font-mono font-black text-[#0c1d37] dark:text-white text-xs mt-0.5">
                                    {selectedPlant.daily_capacity_m3 ? `${selectedPlant.daily_capacity_m3} m³` : '—'}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-700/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Status Operasi</span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] px-1.5 py-0.5 mt-0.5">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {selectedPlant.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Telematics & Legend Ribbon */}
            <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Metric Chips */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/50">
                        <span className="size-2 rounded-full bg-[#ea580c] animate-pulse" />
                        <span className="text-slate-400 text-[11px]">Plant Aktif:</span>
                        <span className="font-mono font-black text-white">{plants.length} Unit</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/50">
                        <Truck className="size-3 text-blue-400" />
                        <span className="text-slate-400 text-[11px]">Armada Mixer:</span>
                        <span className="font-mono font-black text-white">{activeTrucksCount} Truk</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/50">
                        <Activity className="size-3 text-emerald-400" />
                        <span className="text-slate-400 text-[11px]">Volume Bergerak:</span>
                        <span className="font-mono font-black text-emerald-400">{totalVolumeInTransit} m³</span>
                    </div>
                </div>

                {/* Legend Hints */}
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#ea580c]" /> Batching Plant Tonasa
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-blue-500" /> Titik Pengantaran Proyek
                    </span>
                </div>
            </div>
        </div>
    );
}
