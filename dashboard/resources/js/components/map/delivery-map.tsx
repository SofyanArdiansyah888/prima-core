import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Factory, MapPin, Truck, Layers, Navigation, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function DeliveryMap({
    plants,
    deliveries,
}: {
    plants: Plant[];
    deliveries: DeliveryItem[];
}) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize map centered at South Sulawesi (Pangkep - Makassar region)
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [-4.95, 119.52],
                zoom: 10,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18,
            }).addTo(map);

            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // Clear existing layers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        // 1. Add Plant Markers (Factory Icon Badge)
        plants.forEach((plant) => {
            if (!plant.lat || !plant.lng) return;

            const plantIcon = L.divIcon({
                className: 'custom-map-icon',
                html: `
                    <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
                        <div style="
                            background: linear-gradient(135deg, #065f46, #047857);
                            color: #ffffff;
                            padding: 5px 10px;
                            border-radius: 8px;
                            font-size: 11px;
                            font-weight: 700;
                            box-shadow: 0 4px 12px rgba(4,120,87,0.35);
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            border: 2px solid #ffffff;
                            white-space: nowrap;
                            letter-spacing: 0.2px;
                        ">
                            <span style="font-size: 13px;">🏭</span>
                            <span>${plant.name.replace('Batching Plant ', '')}</span>
                        </div>
                        <div style="
                            width: 0;
                            height: 0;
                            border-left: 6px solid transparent;
                            border-right: 6px solid transparent;
                            border-top: 6px solid #047857;
                            margin-top: -1px;
                        "></div>
                        <div style="
                            width: 8px;
                            height: 8px;
                            background: #047857;
                            border: 2px solid #ffffff;
                            border-radius: 50%;
                            box-shadow: 0 0 8px rgba(4,120,87,0.8);
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

        // Group deliveries by Surat Jalan to draw routes
        const groupedBySJ: { [code: string]: DeliveryItem[] } = {};
        deliveries.forEach((d) => {
            const code = d.surat_jalan_code || 'SJ-UNKNOWN';
            if (!groupedBySJ[code]) groupedBySJ[code] = [];
            groupedBySJ[code].push(d);
        });

        // 2. Add Delivery Customer Destination Pins & Polylines
        Object.entries(groupedBySJ).forEach(([sjCode, items]) => {
            items.sort((a, b) => a.delivery_sequence - b.delivery_sequence);
            const first = items[0];

            // Draw route line from plant to stop 1 to stop 2
            if (first.plant_lat && first.plant_lng) {
                const routePoints: [number, number][] = [[first.plant_lat, first.plant_lng]];
                items.forEach((it) => {
                    if (it.lat && it.lng) {
                        routePoints.push([it.lat, it.lng]);
                    }
                });

                if (routePoints.length > 1) {
                    L.polyline(routePoints, {
                        color: items.length > 1 ? '#2563eb' : '#059669',
                        weight: 3.5,
                        dashArray: '6, 6',
                        opacity: 0.85,
                    }).addTo(map);
                }
            }

            items.forEach((item) => {
                if (!item.lat || !item.lng) return;

                const isMulti = items.length > 1;
                const bgGradient = isMulti
                    ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                    : 'linear-gradient(135deg, #047857, #10b981)';
                const borderColor = isMulti ? '#2563eb' : '#10b981';

                const destIcon = L.divIcon({
                    className: 'custom-map-icon',
                    html: `
                        <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
                            <div style="
                                background: ${bgGradient};
                                color: #ffffff;
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 11px;
                                font-weight: 600;
                                box-shadow: 0 4px 10px rgba(0,0,0,0.25);
                                display: flex;
                                align-items: center;
                                gap: 4px;
                                border: 1.5px solid #ffffff;
                                white-space: nowrap;
                                max-width: 220px;
                            ">
                                <span style="
                                    background: rgba(255,255,255,0.25);
                                    padding: 1px 4px;
                                    border-radius: 4px;
                                    font-size: 9px;
                                    font-weight: 800;
                                ">#${item.delivery_sequence}</span>
                                <span style="
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                ">${item.customer_name}</span>
                            </div>
                            <div style="
                                width: 0;
                                height: 0;
                                border-left: 5px solid transparent;
                                border-right: 5px solid transparent;
                                border-top: 5px solid ${borderColor};
                                margin-top: -1px;
                            "></div>
                            <div style="
                                width: 6px;
                                height: 6px;
                                background: ${borderColor};
                                border: 1.5px solid #ffffff;
                                border-radius: 50%;
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
    }, [plants, deliveries]);

    return (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Map Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Peta Lokasi Pengantaran & Batching Plant
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Visualisasi sebaran Batching Plant Semen Tonasa dan titik lokasi proyek customer (Single & Multi-Drop).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <span>🏭</span> {plants.length} Batching Plant
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        <span>🚚</span> {deliveries.length} Titik Pengantaran
                    </span>
                </div>
            </div>

            {/* Map Canvas and Info Panel */}
            <div className="relative h-[500px] w-full">
                <style>{`
                    .custom-map-icon {
                        background: transparent !important;
                        border: none !important;
                    }
                `}</style>
                <div ref={mapContainerRef} className="h-full w-full z-0" />

                {/* Selected Item Floating Panel */}
                {selectedItem && (
                    <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl z-[1000] text-xs space-y-2.5 transition-all">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 font-mono text-xs font-bold text-blue-800 dark:text-blue-200">
                                    Drop Stop #{selectedItem.delivery_sequence}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {selectedItem.customer_name}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="size-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-400">Proyek & Alamat Pengantaran:</span>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{selectedItem.project_title || 'Proyek Lapangan'}</p>
                            <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{selectedItem.destination_address}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <span className="text-[11px] text-slate-400">Material Muatan:</span>
                                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                    {selectedItem.quantity} {selectedItem.unit} {selectedItem.product_name}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-400">Armada & Driver:</span>
                                <p className="font-mono font-medium text-slate-800 dark:text-slate-200 text-xs">
                                    {selectedItem.vehicle_number} ({selectedItem.driver_name})
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center text-[11px] border-t border-slate-100 dark:border-slate-800">
                            <span className="font-mono text-slate-400">{selectedItem.surat_jalan_code}</span>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                {selectedItem.status}
                            </span>
                        </div>
                    </div>
                )}

                {/* Selected Plant Floating Panel */}
                {selectedPlant && (
                    <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl z-[1000] text-xs space-y-2.5 transition-all">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🏭</span>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {selectedPlant.name}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedPlant(null)}
                                className="size-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-400">Alamat Plant:</span>
                            <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">{selectedPlant.address}</p>
                            {selectedPlant.phone && <p className="font-mono text-slate-500 text-[11px] mt-0.5">Telp: {selectedPlant.phone}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <span className="text-[11px] text-slate-400">Kapasitas Produksi:</span>
                                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                    {selectedPlant.daily_capacity_m3} m³ / hari
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-400">Status Operasi:</span>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                    {selectedPlant.status}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Map Legend */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-emerald-600" /> Batching Plant Semen Tonasa
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-emerald-500" /> Pengantaran Single Destination
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-blue-600" /> Pengantaran Multi-Drop (Customer A & B)
                    </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                    Koordinat Presisi Sulawesi Selatan (Pangkep - Maros - Makassar)
                </div>
            </div>
        </div>
    );
}
