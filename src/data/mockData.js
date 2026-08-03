// PT PRIMA KARYA MANUNGGAL (PKM) - Semen Tonasa Group
// Master Data: Products, Plants, Active Orders & CRM Contracts

export const PRODUCTS_DATA = [
  // --- READY MIX CONCRETE ---
  {
    id: 'rm-k175',
    code: 'K-175',
    name: 'Ready Mix Beton Mutu K-175',
    category: 'readymix',
    unit: 'm³',
    price: 780000,
    slump: '12 ± 2 cm',
    flyAshOptions: ['Fly Ash', 'Non-Fly Ash'],
    recommendedFor: 'Lantai Kerja & Pondasi Ringan',
    description: 'Beton non-struktural ideal untuk pembentukan lantai kerja (lean concrete), jalan lingkungan ringan, dan pengisian dasar.',
    inStock: true,
    featured: false,
    minOrder: 3,
    tag: 'Non-Struktural',
    specs: {
      fcMpa: '14.5 MPa',
      aggregateSize: '20 mm',
      settingTime: '3 - 4 Jam',
      cementBrand: 'Semen Tonasa PCC'
    }
  },
  {
    id: 'rm-k225',
    code: 'K-225',
    name: 'Ready Mix Beton Mutu K-225',
    category: 'readymix',
    unit: 'm³',
    price: 840000,
    slump: '12 ± 2 cm',
    flyAshOptions: ['Fly Ash', 'Non-Fly Ash'],
    recommendedFor: 'Rumah Tinggal & Ruko 2 Lantai',
    description: 'Beton standar struktural kelas II untuk dak lantai perumahan, sloof, kolom, dan ring balk ruko.',
    inStock: true,
    featured: true,
    minOrder: 3,
    tag: 'Perumahan',
    specs: {
      fcMpa: '18.7 MPa',
      aggregateSize: '20 mm',
      settingTime: '3.5 - 4.5 Jam',
      cementBrand: 'Semen Tonasa PCC'
    }
  },
  {
    id: 'rm-k300',
    code: 'K-300',
    name: 'Ready Mix Beton Mutu K-300',
    category: 'readymix',
    unit: 'm³',
    price: 890000,
    slump: '12 ± 2 cm',
    flyAshOptions: ['Fly Ash', 'Non-Fly Ash'],
    recommendedFor: 'Pelat Lantai, Kolom Utama, & Jalan Desa',
    description: 'Beton struktural favorit dengan daya tekan tinggi untuk gedung bertingkat, slab lantai, dan perkerasan kaku.',
    inStock: true,
    featured: true,
    minOrder: 3,
    tag: 'Terpopuler',
    specs: {
      fcMpa: '24.9 MPa',
      aggregateSize: '20 mm',
      settingTime: '3.5 - 5 Jam',
      cementBrand: 'Semen Tonasa Type I / PCC'
    }
  },
  {
    id: 'rm-k350',
    code: 'K-350',
    name: 'Ready Mix Beton Mutu K-350',
    category: 'readymix',
    unit: 'm³',
    price: 940000,
    slump: '12 ± 2 cm',
    flyAshOptions: ['Non-Fly Ash', 'Fly Ash'],
    recommendedFor: 'Jalan Rigid, Toll Road, & Kawasan Industri',
    description: 'Didesain khusus untuk struktur yang menahan lalu lintas beban berat, pergudangan, dan jalan tol rigid pavement.',
    inStock: true,
    featured: true,
    minOrder: 5,
    tag: 'Heavy Duty',
    specs: {
      fcMpa: '29.0 MPa',
      aggregateSize: '20 mm',
      settingTime: '4 - 5 Jam',
      cementBrand: 'Semen Tonasa OPC Type I'
    }
  },
  {
    id: 'rm-k400',
    code: 'K-400',
    name: 'Ready Mix Beton Mutu K-400',
    category: 'readymix',
    unit: 'm³',
    price: 1020000,
    slump: '10 ± 2 cm',
    flyAshOptions: ['Special Mix', 'Non-Fly Ash'],
    recommendedFor: 'Dermaga, Jembatan, & Precast Beam',
    description: 'Beton mutu tinggi durabilitas ekstra tahan sulfat/air laut untuk proyek infrastruktur maritim dan jembatan.',
    inStock: true,
    featured: false,
    minOrder: 5,
    tag: 'Infrastruktur',
    specs: {
      fcMpa: '33.2 MPa',
      aggregateSize: '20 mm',
      settingTime: '4 - 6 Jam',
      cementBrand: 'Semen Tonasa Type V / Special'
    }
  },
  {
    id: 'rm-k500',
    code: 'K-500',
    name: 'Ready Mix Beton Mutu K-500 (High Strength)',
    category: 'readymix',
    unit: 'm³',
    price: 1180000,
    slump: '14 ± 2 cm',
    flyAshOptions: ['Special Silica Fume'],
    recommendedFor: 'High-Rise Building, Pre-stressed Girder',
    description: 'Beton kekuatan ultra-tinggi untuk gedung tinggi >15 lantai dan girder jembatan prategang.',
    inStock: true,
    featured: false,
    minOrder: 6,
    tag: 'Ultra Strength',
    specs: {
      fcMpa: '41.5 MPa',
      aggregateSize: '15 mm',
      settingTime: '4.5 - 6 Jam',
      cementBrand: 'Semen Tonasa High Early'
    }
  },

  // --- MATERIAL PERTAMBANGAN & PERDAGANGAN ---
  {
    id: 'mat-pasir-pasang',
    code: 'MAT-PSR',
    name: 'Pasir Tambang Sungai (Pasir Pasang)',
    category: 'material',
    unit: 'm³',
    price: 185000,
    slump: 'N/A',
    recommendedFor: 'Pekerjaan Pasangan Batako, Plesteran, & Cor',
    description: 'Pasir tambang sungai kadar lumpur <3% dari kuari resmi PKM, disaring presisi untuk kekuatan spesifikasi tinggi.',
    inStock: true,
    featured: true,
    minOrder: 7,
    tag: 'Material Curah',
    specs: {
      moisture: '4.2%',
      siltContent: '2.1%',
      origin: 'Kuari Bontoa Pangkep'
    }
  },
  {
    id: 'mat-split-12',
    code: 'MAT-SPL12',
    name: 'Batu Split Pecah (Ukuran 1/2 cm)',
    category: 'material',
    unit: 'm³',
    price: 225000,
    slump: 'N/A',
    recommendedFor: 'Cor Beton Presisi & Precast',
    description: 'Batu pecah ukuran halus 10-20mm hasil olahan mesin stone crusher PKM dengan kubisitas seragam.',
    inStock: true,
    featured: false,
    minOrder: 7,
    tag: 'Pertambangan',
    specs: {
      size: '10 - 20 mm',
      abrasion: '18%',
      origin: 'Crusher Unit PKM Pangkep'
    }
  },
  {
    id: 'mat-split-23',
    code: 'MAT-SPL23',
    name: 'Batu Split Pecah (Ukuran 2/3 cm)',
    category: 'material',
    unit: 'm³',
    price: 210000,
    slump: 'N/A',
    recommendedFor: 'Cor Beton Struktur & Base Course Jalan',
    description: 'Batu split standar agregat kasar 20-30mm untuk campuran Ready Mix dan pembuatan pondasi cor.',
    inStock: true,
    featured: true,
    minOrder: 7,
    tag: 'Pertambangan',
    specs: {
      size: '20 - 30 mm',
      abrasion: '19.5%',
      origin: 'Crusher Unit PKM Pangkep'
    }
  },
  {
    id: 'mat-abu-batu',
    code: 'MAT-ABU',
    name: 'Abu Batu Crushed Dust Fine',
    category: 'material',
    unit: 'm³',
    price: 165000,
    slump: 'N/A',
    recommendedFor: 'Pengisian Paving Block & Campuran Hotmix',
    description: 'Agregat halus sisa pengolahan stone crusher untuk landasan paving block dan campuran aspal.',
    inStock: true,
    featured: false,
    minOrder: 7,
    tag: 'Agregat Halus',
    specs: {
      size: '0 - 5 mm',
      origin: 'Crusher Unit PKM Pangkep'
    }
  },

  // --- PRECAST CONCRETE ---
  {
    id: 'pre-paving-8cm',
    code: 'PRE-PV8',
    name: 'Paving Block K-300 Tebal 8cm (Bata/Holland)',
    category: 'precast',
    unit: 'm²',
    price: 85000,
    slump: 'N/A',
    recommendedFor: 'Area Parkir Truk & Pelabuhan/Industri',
    description: 'Paving block pres hidrolik otomatis tingkat kerapatan tinggi dengan daya tahan tekanan berat.',
    inStock: true,
    featured: true,
    minOrder: 20,
    tag: 'Precast PKM',
    specs: {
      strength: 'K-300',
      thickness: '8 cm',
      piecesPerM2: '44 Pcs'
    }
  },
  {
    id: 'pre-kanstin-dki',
    code: 'PRE-KNS',
    name: 'Kanstin Beton K-250 Type DKI (40x15x50cm)',
    category: 'precast',
    unit: 'Pcs',
    price: 52000,
    slump: 'N/A',
    recommendedFor: 'Pembatas Pembatas Jalan & Trotoar',
    description: 'Kanstin beton cetak pembatas bahu jalan presisi tinggi.',
    inStock: true,
    featured: false,
    minOrder: 30,
    tag: 'Precast PKM',
    specs: {
      strength: 'K-250',
      dimension: '40 x 15 x 50 cm'
    }
  },

  // --- SEWA ALAT BERAT & ARMADA LOGISTIK ---
  {
    id: 'sewa-pump-standard',
    code: 'SEWA-CP28',
    name: 'Sewa Concrete Pump / Pompa Beton Standard (28m)',
    category: 'rental',
    unit: 'Shift (8 Jam)',
    price: 3500000,
    slump: 'N/A',
    recommendedFor: 'Penuangan Lantai 2 s/d 4 Gedung/Rumah',
    description: 'Sewa pompa beton tipe boom 28 meter include operator profesional & BBM untuk penuangan cepat.',
    inStock: true,
    featured: true,
    minOrder: 1,
    tag: 'Sewa Armada',
    specs: {
      reach: '28 Meter Vertical',
      capacity: '60 m³/jam',
      crew: '1 Operator + 2 Helper'
    }
  },
  {
    id: 'sewa-pump-longboom',
    code: 'SEWA-CP36',
    name: 'Sewa Concrete Pump Long Boom (36m)',
    category: 'rental',
    unit: 'Shift (8 Jam)',
    price: 4800000,
    slump: 'N/A',
    recommendedFor: 'Gedung Bertingkat 5+ & Area Sempit',
    description: 'Pompa beton jangkauan ekstra panjang 36 meter untuk penuangan elevasi tinggi.',
    inStock: true,
    featured: false,
    minOrder: 1,
    tag: 'Sewa Armada',
    specs: {
      reach: '36 Meter Vertical',
      capacity: '90 m³/jam',
      crew: '1 Operator + 3 Helper'
    }
  },
  {
    id: 'sewa-dump-truck',
    code: 'SEWA-DT20',
    name: 'Sewa Dump Truck Tronton 20 Ton (PKM Fleet)',
    category: 'rental',
    unit: 'Hari / Rit',
    price: 1800000,
    slump: 'N/A',
    recommendedFor: 'Angkutan Material Tambang & Land Clearing',
    description: 'Armada dump truck kapasitas 20 ton untuk pengangkutan pasir, split, atau tanah proyek.',
    inStock: true,
    featured: false,
    minOrder: 1,
    tag: 'Sewa Armada',
    specs: {
      capacity: '20 Ton / 14 m³',
      fuel: 'Include / Exclude BBM'
    }
  }
];

export const BATCHING_PLANTS = [
  {
    id: 'plant-pangkep',
    name: 'Batching Plant Utama - Pangkep (Semen Tonasa Area)',
    address: 'Kawasan Pabrik Semen Tonasa, Biringere, Pangkep',
    phone: '(0410) 21012',
    lat: -4.792,
    lng: 119.554,
    dailyCapacityM3: 1200,
    currentStock: {
      cementTonasaTon: 450,
      sandM3: 680,
      splitM3: 820,
      waterLiters: 45000,
      admixtureLiters: 3200
    },
    activeMixers: 14,
    status: 'OPERATIONAL'
  },
  {
    id: 'plant-makassar',
    name: 'Batching Plant Cabang Makassar (KIMA)',
    address: 'Kawasan Industri Makassar (KIMA) III, Makassar',
    phone: '(0411) 472190',
    lat: -5.112,
    lng: 119.489,
    dailyCapacityM3: 950,
    currentStock: {
      cementTonasaTon: 320,
      sandM3: 410,
      splitM3: 540,
      waterLiters: 30000,
      admixtureLiters: 2100
    },
    activeMixers: 10,
    status: 'OPERATIONAL'
  },
  {
    id: 'plant-maros',
    name: 'Batching Plant Support - Maros',
    address: 'Jl. Poros Maros - Pangkep Km 8, Lau, Maros',
    phone: '(0411) 381022',
    lat: -4.981,
    lng: 119.578,
    dailyCapacityM3: 600,
    currentStock: {
      cementTonasaTon: 180,
      sandM3: 290,
      splitM3: 310,
      waterLiters: 18000,
      admixtureLiters: 1200
    },
    activeMixers: 6,
    status: 'OPERATIONAL'
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'INV-PKM-2026-0891',
    orderDate: '03 Aug 2026, 09:15 WITA',
    deliveryDate: '03 Aug 2026',
    deliveryTimeSlot: '11:00 - 13:00 WITA',
    clientName: 'PT Mitra Kontraktor Utama',
    clientType: 'B2B Partner (Gold)',
    projectTitle: 'Proyek Pembangunan Perumahan Green Minasa - Blok B4',
    projectAddress: 'Jl. Poros Tonasa II, Bontoa, Kab. Pangkep',
    pinpointCoords: { lat: -4.805, lng: 119.561 },
    items: [
      { id: 'rm-k300', code: 'K-300', name: 'Ready Mix Beton Mutu K-300', quantity: 14, unit: 'm³', price: 890000, notes: 'Slump 12cm, Pompa Standard Requested' },
      { id: 'sewa-pump-standard', code: 'SEWA-CP28', name: 'Sewa Concrete Pump Standard 28m', quantity: 1, unit: 'Shift', price: 3500000, notes: 'Include Operator Pak Ruslan' }
    ],
    subtotal: 15960000,
    ppn: 1755600,
    totalPrice: 17715600,
    paymentMethod: 'Kredit B2B (TOP 30 Hari PKM)',
    paymentStatus: 'APPROVED_CREDIT',
    poNumber: 'PO-MKU/PKM/2026/042',
    statusStep: 3, // 1: Order Confirmed, 2: Batching Plant, 3: On The Way, 4: Pouring/Arrived, 5: Completed
    statusText: 'Driver Sedang Dalam Perjalanan ke Lokasi Proyek',
    plantAssigned: 'Batching Plant Utama - Pangkep',
    mixerTruckNumber: 'DD 8912 PKM (Mixer #04 - 7m³)',
    driverName: 'Pak Syamsuddin (ID: DRV-089)',
    driverPhone: '0812-4112-9901',
    estimatedArrival: '11:45 WITA',
    telematics: {
      speedKm: 42,
      drumRotationRpm: 12,
      concreteTempC: 31.5,
      slumpValue: '12.5 cm',
      batchTime: '10:20 WITA',
      currentLocationName: 'Jl. Poros Pangkep Km 4 (2.3 km dari lokasi)'
    },
    digitalDocs: {
      suratJalanNumber: 'SJ-PKM-2026-0891',
      notaTimbanganNumber: 'NT-PKM-9912',
      grossWeightKg: 28450,
      tareWeightKg: 11200,
      netWeightKg: 17250,
      eFakturNumber: '010.003-26.8819201',
      qualityCertNumber: 'CERT-K300-TONASA-0891'
    }
  },
  {
    id: 'INV-PKM-2026-0888',
    orderDate: '02 Aug 2026, 14:30 WITA',
    deliveryDate: '02 Aug 2026',
    deliveryTimeSlot: '15:00 - 17:00 WITA',
    clientName: 'CV Karya Utama Ritel',
    clientType: 'Pelanggan Umum (B2C)',
    projectTitle: 'Pengecoran Ruko 3 Lantai H. Kalla',
    projectAddress: 'Jl. Urip Sumohardjo No. 88, Makassar',
    pinpointCoords: { lat: -5.132, lng: 119.441 },
    items: [
      { id: 'rm-k225', code: 'K-225', name: 'Ready Mix Beton Mutu K-225', quantity: 21, unit: 'm³', price: 840000, notes: '3 Truk Mixer @ 7m³' }
    ],
    subtotal: 17640000,
    ppn: 1940400,
    totalPrice: 19580400,
    paymentMethod: 'Virtual Account Bank Mandiri',
    paymentStatus: 'PAID',
    poNumber: 'N/A',
    statusStep: 5,
    statusText: 'Pengecoran Selesai & Dokumen Digital Terbit',
    plantAssigned: 'Batching Plant Cabang Makassar (KIMA)',
    mixerTruckNumber: 'DD 8841 PKM (Mixer #08)',
    driverName: 'Pak Basri',
    driverPhone: '0852-9912-3341',
    estimatedArrival: 'Tiba 15:40 WITA (Selesai)',
    telematics: {
      speedKm: 0,
      drumRotationRpm: 0,
      concreteTempC: 30.2,
      slumpValue: '12.0 cm',
      batchTime: '14:50 WITA',
      currentLocationName: 'Lokasi Proyek Makassar (Pengecoran Selesai)'
    },
    digitalDocs: {
      suratJalanNumber: 'SJ-PKM-2026-0888',
      notaTimbanganNumber: 'NT-PKM-9854',
      grossWeightKg: 28900,
      tareWeightKg: 11200,
      netWeightKg: 17700,
      eFakturNumber: '010.003-26.8819150',
      qualityCertNumber: 'CERT-K225-TONASA-0888'
    }
  }
];

export const B2B_PARTNER_INFO = {
  companyName: 'PT Mitra Kontraktor Utama',
  npwp: '01.345.678.9-801.000',
  partnerTier: 'GOLD B2B PARTNER',
  contractNumber: 'PKS/PKM-MKU/2025/1109',
  creditLimit: 500000000, // Rp 500.000.000
  creditUsed: 142500000, // Rp 142.500.000
  topDays: 30,
  contactPerson: 'Ir. Ahmad Subagjo (Project Manager)',
  phone: '0811-420-9988',
  email: 'procurement@mitrakontraktor.co.id',
  address: 'Wisma Kalla Lt. 8, Jl. Dr. Sam Ratulangi No. 8, Makassar'
};
