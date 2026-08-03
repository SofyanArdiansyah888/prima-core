import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Truck, 
  BarChart3, 
  Users, 
  Layers, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Settings, 
  TrendingUp, 
  DollarSign,
  Box,
  RotateCw,
  RefreshCw,
  FileCheck,
  CheckSquare,
  Navigation,
  X
} from 'lucide-react';

export default function AdminDashboard({ plants, orders: initialOrders, triggerToast }) {
  const [adminTab, setAdminTab] = useState('overview'); // 'overview', 'dispatch', 'silos', 'b2b-finance'
  const [selectedPlant, setSelectedPlant] = useState('All Plants (Sulawesi Selatan)');
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Silo Master Data
  const silos = [
    { id: 'silo-1', name: 'Silo Semen Tonasa OPC Type I', capacity: 150, current: 118, unit: 'Ton', status: 'Optimal', color: 'bg-emerald-500' },
    { id: 'silo-2', name: 'Silo Semen PCC (Special Mix)', capacity: 120, current: 32, unit: 'Ton', status: 'Low Stock - Reorder Sent', color: 'bg-amber-500' },
    { id: 'silo-3', name: 'Pasir Tambang Sungai (Kuari Pangkep)', capacity: 400, current: 290, unit: 'm³', status: 'Optimal', color: 'bg-emerald-500' },
    { id: 'silo-4', name: 'Batu Split Pecah 1/2 cm (Crusher)', capacity: 350, current: 240, unit: 'm³', status: 'Optimal', color: 'bg-emerald-500' },
    { id: 'silo-5', name: 'Batu Split Pecah 2/3 cm (Crusher)', capacity: 350, current: 195, unit: 'm³', status: 'Optimal', color: 'bg-emerald-500' },
    { id: 'silo-6', name: 'Admixture Superplasticizer (Tangki 01)', capacity: 5000, current: 4100, unit: 'Liter', status: 'Optimal', color: 'bg-emerald-500' },
  ];

  // Fleet Trucks Master Data
  const fleetTrucks = [
    { id: 'truck-01', code: 'Mixer #01', plate: 'DD 8901 PKM', capacity: 7, status: 'In Plant (Loading)', driver: 'Pak Basri', location: 'Plant Pangkep #1' },
    { id: 'truck-04', code: 'Mixer #04', plate: 'DD 8912 PKM', capacity: 7, status: 'In Transit', driver: 'Pak Syamsuddin', location: 'Menuju Green Minasa' },
    { id: 'truck-09', code: 'Mixer #09', plate: 'DD 8831 PKM', capacity: 7, status: 'In Transit', driver: 'Pak Daeng Rapi', location: 'Menuju Pelabuhan Garongsong' },
    { id: 'truck-02', code: 'Mixer #02', plate: 'DD 8701 PKM', capacity: 7, status: 'Available in Yard', driver: 'Pak Kaharuddin', location: 'Yard Maros #3' },
    { id: 'truck-07', code: 'Mixer #07', plate: 'DD 8907 PKM', capacity: 7, status: 'Available in Yard', driver: 'Pak Herman', location: 'Yard Pangkep #1' },
    { id: 'truck-12', code: 'Mixer #12', plate: 'DD 8922 PKM', capacity: 8, status: 'Maintenance / Servis', driver: '-', location: 'Workshop Bengkel PKM' },
  ];

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalVolumeToday = orders.reduce((acc, curr) => {
      const vol = curr.items ? curr.items.reduce((iSum, item) => iSum + (item.unit === 'm³' ? item.quantity : 0), 0) : curr.qtyTotal || 0;
      return acc + vol;
    }, 0);

    const totalRevenueToday = orders.reduce((acc, curr) => acc + (curr.totalPrice || curr.amount || 0), 0);
    const pendingCount = orders.filter(o => o.statusStep === 1 || o.paymentStatus === 'PENDING').length;
    const awaitingApprovalCount = orders.filter(o => o.paymentMethod.includes('Kredit') && o.paymentStatus !== 'APPROVED_CREDIT').length;
    const activeDeliveryCount = orders.filter(o => o.statusStep === 3 || o.statusStep === 2).length || 2;

    return {
      totalVolumeToday,
      totalRevenueToday,
      pendingCount,
      awaitingApprovalCount,
      activeDeliveryCount
    };
  }, [orders]);

  const handleAssignDispatch = (orderId, truckCode, driverName) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          statusStep: 3,
          mixerTruckNumber: `${truckCode} (${driverName})`,
          driverName: driverName,
          statusText: `Didispatch via ${truckCode}`
        };
      }
      return o;
    }));
    setIsDispatchModalOpen(false);
    triggerToast(`Truk ${truckCode} berhasil didispatch untuk order ${orderId}!`);
  };

  const handleApproveTOP = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          paymentStatus: 'APPROVED_CREDIT',
          statusStep: 2
        };
      }
      return o;
    }));
    triggerToast(`Persetujuan kredit TOP untuk ${orderId} berhasil dikonfirmasi!`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 text-white p-6 rounded-2xl border border-brand-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-extrabold mb-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Enterprise Operational Dashboard PKM</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Sistem Informasi Terpadu Ready Mix & Pertambangan
          </h2>
          <p className="text-slate-300 text-xs mt-0.5">
            PT Prima Karya Manunggal — Anak Perusahaan PT Semen Tonasa (SIG Group)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-stretch md:self-auto">
          <button
            onClick={() => triggerToast("Data sistem berhasil disinkronkan dengan SAP Tonasa Group!")}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 border border-brand-400/30 shadow transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Sync SAP Tonasa</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Plant Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Sub-Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'overview', label: 'Ringkasan Eksekutif', icon: BarChart3 },
            { id: 'dispatch', label: 'Dispatch & Armada Truk', icon: Truck },
            { id: 'silos', label: 'Silo & Stok Material', icon: Box },
            { id: 'b2b-finance', label: 'Kredit B2B & TOP', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                  isSelected ? 'bg-amber-500 text-brand-950 shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Region Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-slate-400 font-bold text-xs whitespace-nowrap">Wilayah:</span>
          <select 
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-xl p-2 outline-none focus:border-brand-500"
          >
            <option>All Plants (Sulawesi Selatan)</option>
            <option>Batching Plant Pangkep #1</option>
            <option>Batching Plant Makassar #2</option>
            <option>Batching Plant Maros #3</option>
          </select>
        </div>

      </div>

      {/* VIEW 1: EXECUTIVE OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border-l-4 border-l-amber-500 border-slate-200 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Produksi Hari Ini</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {metrics.totalVolumeToday} <span className="text-sm font-bold text-slate-500">m³</span>
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  +12.4% vs kemarin
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Kapasitas Maksimum: 2.750 m³/hari</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-l-4 border-l-brand-600 border-slate-200 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pendapatan Bruto Hari Ini</div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">
                  Rp {(metrics.totalRevenueToday / 1000000).toLocaleString('id-ID')} Juta
                </span>
                <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                  B2B TOP Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Total {orders.length} Pesanan Dikonfirmasi</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-500 border-slate-200 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Armada Mixer Di Jalan</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {metrics.activeDeliveryCount} <span className="text-sm font-bold text-slate-500">Unit</span>
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  On Time 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Tersedia di Yard: 8 Unit</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-l-4 border-l-red-500 border-slate-200 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Menunggu Approval Kredit TOP</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {metrics.awaitingApprovalCount} <span className="text-sm font-bold text-slate-500">Pesanan</span>
                </span>
                <button 
                  onClick={() => setAdminTab('b2b-finance')}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Review →
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Perlu Verifikasi Limit Kredit B2B</p>
            </div>

          </div>

          {/* Visual Production Graph & Silo Status Mini Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Production Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Volume Output Ready Mix Per Jam (m³)</h3>
                  <p className="text-xs text-slate-500">Batching Plant Pangkep #1 & Makassar #2</p>
                </div>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold px-2.5 py-1 rounded">
                  Peak Time: 09:00 - 11:00 WITA
                </span>
              </div>

              {/* Bar Visualizer */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200 pb-2">
                {[
                  { time: '07:00', val: 12, max: 40 },
                  { time: '08:00', val: 28, max: 40 },
                  { time: '09:00', val: 38, max: 40 },
                  { time: '10:00', val: 35, max: 40 },
                  { time: '11:00', val: 32, max: 40 },
                  { time: '12:00', val: 10, max: 40 },
                  { time: '13:00', val: 22, max: 40 },
                  { time: '14:00', val: 15, max: 40 },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bar.val} m³
                    </span>
                    <div className="w-full bg-slate-100 rounded-t h-32 flex items-end overflow-hidden p-0.5 border border-slate-200">
                      <div 
                        style={{ height: `${(bar.val / bar.max) * 100}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${bar.val > 30 ? 'bg-amber-500' : 'bg-brand-600'}`}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">{bar.time}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> Jam Sibuk (&gt;30 m³)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-600"></span> Jam Normal</span>
                </div>
                <span className="font-bold text-slate-700">Rata-rata Slump: 11.8 cm</span>
              </div>
            </div>

            {/* Silo Status Mini Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Status Material Silo Utama</h3>
                <button onClick={() => setAdminTab('silos')} className="text-xs text-brand-600 font-bold hover:underline">
                  Detail →
                </button>
              </div>

              <div className="space-y-3">
                {silos.slice(0, 4).map((silo) => {
                  const pct = Math.round((silo.current / silo.capacity) * 100);
                  return (
                    <div key={silo.id} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-700 line-clamp-1">{silo.name}</span>
                        <span className={pct < 30 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                          {silo.current} {silo.unit} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          style={{ width: `${pct}%` }} 
                          className={`h-full ${silo.color}`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Silo PCC berada di angka 26%. Permintaan restock ke Pabrik Semen Tonasa telah dikirim.</span>
              </div>
            </div>

          </div>

          {/* Active Orders Dispatch Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Daftar Order Ready Mix & Status Pengiriman</h3>
                <p className="text-xs text-slate-500">Monitoring Surat Jalan Digital & Progres Truk Mixer</p>
              </div>

              <button 
                onClick={() => setAdminTab('dispatch')}
                className="bg-amber-500 hover:bg-amber-600 text-brand-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow transition-all"
              >
                + Process Dispatch Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-brand-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-3 border border-brand-800">No. Surat Jalan / Order</th>
                    <th className="p-3 border border-brand-800">Kontraktor & Proyek</th>
                    <th className="p-3 border border-brand-800">Mutu Beton</th>
                    <th className="p-3 border border-brand-800">Truk / Driver</th>
                    <th className="p-3 border border-brand-800 text-center">Vol. Kirim</th>
                    <th className="p-3 border border-brand-800 text-center">Status</th>
                    <th className="p-3 border border-brand-800 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((ord) => {
                    const itemSummary = ord.items ? ord.items.map(i => `${i.quantity} ${i.unit} ${i.code}`).join(', ') : `${ord.product}`;
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-extrabold text-brand-600">
                          {ord.id}
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{ord.clientName || ord.client}</div>
                          <div className="text-[10px] text-slate-500">{ord.projectTitle || ord.project}</div>
                        </td>
                        <td className="p-3">
                          <span className="bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded font-bold text-[11px]">
                            {itemSummary}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-semibold">{ord.mixerTruckNumber || ord.mixerTruck || 'Belum Ada Truk'}</div>
                          <div className="text-[10px] text-slate-500">Driver: {ord.driverName || ord.driver || '-'}</div>
                        </td>
                        <td className="p-3 text-center font-extrabold text-slate-900">
                          {ord.items ? ord.items.reduce((s, i) => s + i.quantity, 0) : ord.qtyTotal} m³
                        </td>
                        <td className="p-3 text-center">
                          {ord.statusStep === 3 || ord.status === 'In Delivery' ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              Di Jalan (En Route)
                            </span>
                          ) : ord.paymentStatus === 'APPROVED_CREDIT' || ord.status === 'Pending Dispatch' ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full inline-block">
                              Siap Dispatch
                            </span>
                          ) : ord.paymentMethod.includes('Kredit') && ord.paymentStatus !== 'APPROVED_CREDIT' ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full inline-block">
                              Cek Limit Kredit
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full inline-block">
                              Selesai Penuangan
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {(ord.statusStep === 1 || ord.status === 'Pending Dispatch') && (
                            <button 
                              onClick={() => {
                                setSelectedOrderForDispatch(ord);
                                setIsDispatchModalOpen(true);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-brand-950 font-extrabold px-3 py-1 rounded-lg text-[11px] shadow-sm"
                            >
                              Assign Truk
                            </button>
                          )}
                          {(ord.statusStep === 3 || ord.status === 'In Delivery') && (
                            <button 
                              onClick={() => triggerToast(`Lokasi Truk ${ord.mixerTruckNumber}: 2.3 km dari lokasi proyek.`)}
                              className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-slate-300 shadow-xs"
                            >
                              GPS Track
                            </button>
                          )}
                          {ord.paymentMethod.includes('Kredit') && ord.paymentStatus !== 'APPROVED_CREDIT' && (
                            <button 
                              onClick={() => handleApproveTOP(ord.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-[11px] shadow-xs"
                            >
                              Approve TOP
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: FLEET DISPATCH MANAGEMENT */}
      {adminTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Total Armada Truk Mixer PKM</span>
              <div className="text-2xl font-black text-slate-900">18 Unit</div>
              <p className="text-[11px] text-slate-500">Kapasitas rata-rata: 7 - 8 m³</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Siap Didispatch di Yard</span>
              <div className="text-2xl font-black text-emerald-600">8 Unit</div>
              <p className="text-[11px] text-slate-500">Siap menerima muatan beton</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Sedang Operasi Penuangan</span>
              <div className="text-2xl font-black text-amber-600">7 Unit</div>
              <p className="text-[11px] text-slate-500">3 Unit jalan, 4 unit di lokasi proyek</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              Status Live Armada Truk Mixer (Yard Plant Pangkep & Makassar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fleetTrucks.map((truck) => (
                <div key={truck.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded">
                        {truck.code}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm mt-1">{truck.plate}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Cap: {truck.capacity} m³
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver:</span>
                      <span className="font-bold text-slate-800">{truck.driver}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Posisi:</span>
                      <span className="font-bold text-slate-800">{truck.location}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className={`font-bold text-[11px] ${
                      truck.status.includes('Transit') ? 'text-amber-600' :
                      truck.status.includes('Available') ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      ● {truck.status}
                    </span>

                    {truck.status.includes('Available') && (
                      <button 
                        onClick={() => triggerToast(`Truk ${truck.code} disiapkan untuk pengisian batching berikutnya.`)}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded-xl font-bold text-[11px] shadow-sm"
                      >
                        Tunjuk Truk
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SILOS & RAW MATERIALS */}
      {adminTab === 'silos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Monitoring Real-Time Silo & Kuari Pertambangan</h3>
                <p className="text-xs text-slate-500">Terhubung langsung dengan timbangan elektronik Plant & Crusher</p>
              </div>
              <button 
                onClick={() => triggerToast("Form Pasok Material baru dibuka.")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow"
              >
                + Penerimaan Material
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {silos.map((silo) => {
                const pct = Math.round((silo.current / silo.capacity) * 100);
                return (
                  <div key={silo.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{silo.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        pct < 30 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {silo.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-2">
                      <span className="text-2xl font-black text-slate-900">{silo.current} <span className="text-xs text-slate-500 font-semibold">{silo.unit}</span></span>
                      <span className="text-xs text-slate-500 font-medium">Kapasitas: {silo.capacity} {silo.unit}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div 
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${silo.color}`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono font-semibold">
                        <span>0%</span>
                        <span>Tingkat Ketersediaan: {pct}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: B2B CREDIT & TOP APPROVALS */}
      {adminTab === 'b2b-finance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Verifikasi Kredit B2B & Limit Term of Payment (TOP)</h3>
              <p className="text-xs text-slate-500">Manajemen piutang kontraktor mitra PT Prima Karya Manunggal</p>
            </div>

            <div className="space-y-3">
              {orders.filter(o => o.paymentMethod.includes('Kredit')).map((order) => (
                <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-brand-600 font-extrabold text-xs">{order.id}</span>
                      <span className="bg-brand-50 text-brand-700 border border-brand-200 text-[10px] font-bold px-2 py-0.5 rounded">
                        {order.paymentMethod}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{order.clientName || order.client}</h4>
                    <p className="text-xs text-slate-500">Proyek: {order.projectTitle || order.project}</p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai Pesanan:</span>
                      <span className="text-sm font-black text-amber-600">
                        Rp {(order.totalPrice || order.amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div>
                      {order.paymentStatus === 'APPROVED_CREDIT' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1">
                          ✓ Kredit Disetujui
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleApproveTOP(order.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow"
                        >
                          Setujui TOP Order →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH ACTION MODAL */}
      {isDispatchModalOpen && selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Dispatch Truk Mixer</h3>
                <p className="text-slate-500 font-medium">{selectedOrderForDispatch.id}</p>
              </div>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Pemesan:</span>
                <span className="font-bold text-slate-900">{selectedOrderForDispatch.clientName || selectedOrderForDispatch.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proyek:</span>
                <span className="font-bold text-slate-800 text-right">{selectedOrderForDispatch.projectTitle || selectedOrderForDispatch.project}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-800">Pilih Armada Mixer Siap Kirim:</label>
              <div className="space-y-1.5">
                {fleetTrucks.filter(t => t.status.includes('Available') || t.status.includes('Plant')).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleAssignDispatch(selectedOrderForDispatch.id, t.code, t.driver)}
                    className="w-full p-2.5 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-500 rounded-xl flex justify-between items-center text-left font-semibold transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{t.code} ({t.plate})</div>
                      <div className="text-[10px] text-slate-500">Driver: {t.driver}</div>
                    </div>
                    <span className="bg-amber-500 text-brand-950 font-black text-[10px] px-2 py-1 rounded">
                      Assign
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
