<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SPK Produksi - {{ $workOrder->code }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 15px;
            font-weight: bold;
            color: #0c1d37;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .company-sub {
            font-size: 10px;
            font-weight: bold;
            color: #ea580c;
            text-transform: uppercase;
        }
        .company-desc {
            font-size: 9px;
            color: #64748b;
        }
        .doc-title {
            text-align: right;
            vertical-align: top;
        }
        .doc-title h1 {
            margin: 0;
            font-size: 15px;
            font-weight: 900;
            color: #0c1d37;
            text-transform: uppercase;
        }
        .doc-code {
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
            color: #d91424;
            margin-top: 3px;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #047857;
            font-size: 9px;
            font-weight: bold;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .meta-table td {
            width: 50%;
            vertical-align: top;
            padding: 8px 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 10.5px;
        }
        .label {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            display: block;
            margin-bottom: 2px;
        }
        .value {
            font-weight: bold;
            color: #0f172a;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .data-table th {
            background-color: #0c1d37;
            color: #ffffff;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            padding: 7px 10px;
            border: 1px solid #0c1d37;
            text-align: left;
        }
        .data-table td {
            padding: 7px 10px;
            border: 1px solid #cbd5e1;
            font-size: 10.5px;
        }
        .spec-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 4px;
            padding: 8px 10px;
            margin-bottom: 15px;
            font-size: 10px;
        }
        .signatures {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
        }
        .signatures td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 5px;
        }
        .sign-box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 5px;
            min-height: 85px;
            background: #ffffff;
        }
        .sign-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 45px;
        }
        .sign-name {
            font-weight: bold;
            font-size: 10.5px;
            color: #0f172a;
            border-top: 1px dotted #94a3b8;
            display: inline-block;
            padding-top: 3px;
            min-width: 120px;
        }
        .footer-note {
            margin-top: 20px;
            font-size: 8.5px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <div class="company-name">PT PRIMA KARYA MANUNGGAL</div>
                <div class="company-sub">Semen Tonasa Group &bull; SIG</div>
                <div class="company-desc">Divisi Ready Mix Concrete &bull; Distribusi Logistik Material Curah</div>
                <div class="company-desc">Biringere, Pangkep, Sulawesi Selatan | Telp: (0410) 21012</div>
            </td>
            <td class="doc-title" style="width: 40%;">
                <h1>Surat Perintah Kerja</h1>
                <div class="doc-code">{{ $workOrder->code }}</div>
                <div style="margin-top: 4px;">
                    <span class="badge">E-VERIFIED &bull; RESMI</span>
                </div>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td>
                <span class="label">Proyek &amp; Pemesan</span>
                <div class="value">{{ $order->project_title }}</div>
                <div style="color: #475569; font-size: 10px; margin-top: 2px;">{{ $order->customer_name }} ({{ $order->customer_phone ?? '-' }})</div>
                <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">Alamat: {{ $order->delivery_address }}</div>
            </td>
            <td>
                <span class="label">Unit Batching Plant &amp; Jadwal</span>
                <div class="value">{{ $order->batchingPlant?->name ?? 'Batching Plant PKM' }}</div>
                <div style="color: #475569; font-size: 10px; margin-top: 2px;">
                    Jadwal: {{ $workOrder->scheduled_date ? $workOrder->scheduled_date->format('d/m/Y') : date('d/m/Y') }} 
                    ({{ $workOrder->scheduled_time_slot ?? 'Reguler' }})
                </div>
                <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Rujukan SO: <strong>{{ $order->code }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <div class="spec-box">
        <strong>Spesifikasi Mutu &amp; Formula Batching:</strong><br>
        Kode Resep Formula: <span style="font-family: monospace; font-weight: bold; color: #7e22ce;">{{ $workOrder->batch_recipe_code ?? 'TONASA-STD' }}</span> &bull; 
        Target Slump Pengujian: <strong>{{ $workOrder->slump_target ?? '12 ± 2 cm' }}</strong> &bull;
        Standar Mutu: SNI 2847 / SNI 6880 Ready-Mix Concrete.
        @if($workOrder->production_notes)
            <div style="margin-top: 4px; color: #92400e; font-style: italic;">
                Catatan Produksi: {{ $workOrder->production_notes }}
            </div>
        @endif
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 25%;">Kode Material</th>
                <th style="width: 45%;">Nama Produk / Mutu Beton</th>
                <th style="width: 25%; text-align: center;">Target Volume</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align: center;">1</td>
                <td style="font-family: monospace;">{{ $workOrder->product?->code ?? 'RM-BETON' }}</td>
                <td>
                    <strong>{{ $workOrder->product?->name ?? 'Ready Mix Beton' }}</strong>
                    <div style="font-size: 9px; color: #64748b;">Kategori: {{ ucfirst($workOrder->product?->category ?? 'readymix') }}</div>
                </td>
                <td style="text-align: center; font-size: 12px; font-weight: bold; color: #0c1d37;">
                    {{ number_format((float) $workOrder->target_quantity, 2, ',', '.') }} {{ $workOrder->unit ?? 'm³' }}
                </td>
            </tr>
        </tbody>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="sign-box">
                    <div class="sign-title">Penanggung Jawab Plant</div>
                    <div class="sign-name">( Ir. Syamsir, M.T. )</div>
                </div>
            </td>
            <td>
                <div class="sign-box">
                    <div class="sign-title">Operator Batcher</div>
                    <div class="sign-name">( {{ $workOrder->assignedUser?->name ?? 'Hardianto' }} )</div>
                </div>
            </td>
            <td>
                <div class="sign-box" style="background: #f8fafc;">
                    <div class="sign-title">Validasi Digital</div>
                    <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #047857; padding-top: 15px;">
                        [ E-VERIFIED ]<br>
                        <span style="font-size: 8px; color: #64748b;">SIG DIGITAL CERT</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Dokumen ini diterbitkan secara sah dan elektronik oleh Sistem ERP PT Prima Karya Manunggal (Semen Tonasa Group).<br>
        Dicetak pada: {{ now()->translatedFormat('d F Y, H:i') }} WITA &bull; Lembar Asli Produksi Batching
    </div>

</body>
</html>
