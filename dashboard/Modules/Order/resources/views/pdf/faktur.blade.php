<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Faktur Penjualan &amp; Pajak - {{ $order->code }}</title>
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
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .summary-table td {
            padding: 4px 10px;
            font-size: 11px;
        }
        .signatures {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 5px 20px;
        }
        .sign-box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
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
            min-width: 140px;
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
                <div class="company-desc">NPWP: 01.122.344.5-801.000 &bull; Pengusaha Kena Pajak (PKP)</div>
                <div class="company-desc">Biringere, Pangkep, Sulawesi Selatan | Telp: (0410) 21012</div>
            </td>
            <td class="doc-title" style="width: 40%;">
                <h1>Faktur Tagihan &amp; Pajak</h1>
                <div class="doc-code">INV-PKM/{{ $order->code }}</div>
                <div style="margin-top: 4px;">
                    <span class="badge">STATUS: {{ $order->payment_status === 'PAID' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN' }}</span>
                </div>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td>
                <span class="label">Identitas Pembeli (Customer)</span>
                <div class="value">{{ $order->customer_name }}</div>
                <div style="color: #475569; font-size: 10px; margin-top: 2px;">Proyek: {{ $order->project_title }}</div>
                <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">Alamat: {{ $order->delivery_address }}</div>
                <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">No. Telp / HP: {{ $order->customer_phone ?? '-' }}</div>
            </td>
            <td>
                <span class="label">Informasi Transaksi &amp; Penagihan</span>
                <div class="value">No. Pesanan: {{ $order->code }}</div>
                <div style="color: #475569; font-size: 10px; margin-top: 2px;">
                    Tanggal Pesanan: {{ $order->created_at ? $order->created_at->format('d/m/Y') : date('d/m/Y') }}
                </div>
                <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Metode Pembayaran: <strong>{{ $order->payment_method ?? 'MIDTRANS' }}</strong>
                </div>
                @if($order->paid_at)
                    <div style="color: #047857; font-size: 9.5px; margin-top: 2px; font-weight: bold;">
                        Dibayar Pada: {{ $order->paid_at->format('d/m/Y H:i') }} WITA
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 45%;">Deskripsi Produk / Jasa</th>
                <th style="width: 15%; text-align: center;">Kuantitas</th>
                <th style="width: 15%; text-align: right;">Harga Satuan</th>
                <th style="width: 20%; text-align: right;">Total Harga</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $idx => $item)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td>
                        <strong>{{ $item->product?->name ?? 'Produk Tonasa' }}</strong>
                        <div style="font-size: 9px; color: #64748b;">Kode: {{ $item->product?->code ?? '-' }}</div>
                    </td>
                    <td style="text-align: center;">{{ number_format((float) $item->quantity, 2, ',', '.') }} {{ $item->unit }}</td>
                    <td style="text-align: right;">Rp {{ number_format((float) $item->unit_price, 0, ',', '.') }}</td>
                    <td style="text-align: right; font-weight: bold;">Rp {{ number_format((float) $item->subtotal, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="summary-table">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 10px; font-size: 10px;">
                    <strong>Informasi Pajak Pertambahan Nilai:</strong><br>
                    Tarif PPN sebesar 11% sesuai peraturan perpajakan yang berlaku.<br>
                    Pembayaran sah diverifikasi oleh sistem gateway Midtrans / Rekening Giro PKM.
                </div>
            </td>
            <td style="width: 40%; vertical-align: top;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="text-align: right; color: #64748b;">Dasar Pengenaan Pajak (DPP):</td>
                        <td style="text-align: right; font-weight: bold; width: 110px;">Rp {{ number_format((float) $order->subtotal, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; color: #64748b;">Ongkos Kirim Plant:</td>
                        <td style="text-align: right; font-weight: bold;">Rp {{ number_format((float) $order->delivery_fee, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; color: #64748b;">Biaya Layanan Admin:</td>
                        <td style="text-align: right; font-weight: bold;">Rp {{ number_format((float) $order->admin_fee, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; color: #64748b;">PPN Terutang (11%):</td>
                        <td style="text-align: right; font-weight: bold;">Rp {{ number_format((float) $order->ppn, 0, ',', '.') }}</td>
                    </tr>
                    <tr style="border-top: 2px solid #0f172a;">
                        <td style="text-align: right; font-size: 12px; font-weight: 900; color: #0c1d37; padding-top: 6px;">Total Tagihan:</td>
                        <td style="text-align: right; font-size: 13px; font-weight: 900; color: #0c1d37; padding-top: 6px;">Rp {{ number_format((float) $order->total_price, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="sign-box">
                    <div class="sign-title">Pelanggan / Pembeli</div>
                    <div class="sign-name">( {{ $order->customer_name }} )</div>
                </div>
            </td>
            <td>
                <div class="sign-box">
                    <div class="sign-title">Bagian Keuangan &amp; Penjualan PKM</div>
                    <div class="sign-name">( Bagian Penagihan &amp; Faktur )</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Faktur elektronik ini merupakan bukti tagihan dan pembayaran yang sah dari PT Prima Karya Manunggal.<br>
        Dicetak pada: {{ now()->translatedFormat('d F Y, H:i') }} WITA &bull; Sistem ERP PKM
    </div>

</body>
</html>
