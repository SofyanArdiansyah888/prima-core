<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Sales Order - {{ $order->code }}</title>
    <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; }
        .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
        .company-name { font-size: 15px; font-weight: bold; color: #0c1d37; text-transform: uppercase; }
        .company-sub { font-size: 10px; font-weight: bold; color: #ea580c; text-transform: uppercase; }
        .company-desc { font-size: 9px; color: #64748b; }
        .doc-title { text-align: right; vertical-align: top; }
        .doc-title h1 { margin: 0; font-size: 15px; font-weight: 900; color: #0c1d37; text-transform: uppercase; }
        .doc-code { font-family: monospace; font-size: 12px; font-weight: bold; color: #d91424; margin-top: 3px; }
        .badge { display: inline-block; padding: 2px 8px; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        .meta-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .meta-table td { width: 50%; vertical-align: top; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 10.5px; }
        .label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 2px; }
        .value { font-weight: bold; color: #0f172a; }
        .sub { color: #64748b; font-size: 9.5px; margin-top: 2px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .data-table th { background-color: #0c1d37; color: #ffffff; font-weight: bold; font-size: 10px; text-transform: uppercase; padding: 7px 10px; border: 1px solid #0c1d37; text-align: left; }
        .data-table td { padding: 7px 10px; border: 1px solid #cbd5e1; font-size: 10.5px; }
        .summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .summary-table td { padding: 4px 10px; font-size: 11px; }
        .right { text-align: right; }
        .muted { text-align: right; color: #64748b; }
        .signatures { width: 100%; margin-top: 25px; border-collapse: collapse; }
        .signatures td { width: 50%; text-align: center; vertical-align: top; padding: 5px 20px; }
        .sign-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; min-height: 85px; background: #ffffff; }
        .sign-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 45px; }
        .sign-name { font-weight: bold; font-size: 10.5px; color: #0f172a; border-top: 1px dotted #94a3b8; display: inline-block; padding-top: 3px; min-width: 140px; }
        .footer-note { margin-top: 20px; font-size: 8.5px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    @php
        $rp = fn ($v) => 'Rp '.number_format((float) $v, 0, ',', '.');
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', '.'), '0'), ',');
        $statusLabels = [
            'PENDING_APPROVAL' => 'Menunggu Verifikasi Tempat',
            'CONFIRMED' => 'Dikonfirmasi',
            'PROCESSING' => 'Diproses (SPK Terbit)',
            'ON_DELIVERY' => 'Dalam Pengiriman',
            'COMPLETED' => 'Selesai',
            'CANCELLED' => 'Dibatalkan',
        ];
        $paymentLabels = ['PENDING' => 'Belum Lunas', 'PAID' => 'Lunas', 'FAILED' => 'Gagal', 'REFUNDED' => 'Dikembalikan', 'APPROVED_CREDIT' => 'Lunas'];
        $distanceNote = '';
        if ($order->is_distance_manual) {
            $distanceNote = ' (input sales'.($order->gps_distance_km !== null ? ', GPS '.$qty($order->gps_distance_km).' km' : '').')';
        }
    @endphp

    <table class="header-table">
        <tr>
            <td style="width: 62px; vertical-align: middle; padding-right: 10px;">
                <img src="{{ \App\Support\PrintLogo::dataUri() }}" alt="Logo PKM" style="width: 56px; height: auto;">
            </td>
            <td style="width: 52%; vertical-align: middle;">
                <div class="company-name">PT PRIMA KARYA MANUNGGAL</div>
                <div class="company-sub">Semen Tonasa Group &bull; SIG</div>
                <div class="company-desc">Biringere, Pangkep, Sulawesi Selatan | Telp: (0410) 21012</div>
            </td>
            <td class="doc-title" style="width: 38%;">
                <h1>Sales Order</h1>
                <div class="doc-code">{{ $order->code }}</div>
                <div style="margin-top: 4px;">
                    <span class="badge">{{ $statusLabels[$order->status] ?? $order->status }}</span>
                </div>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td>
                <span class="label">Customer</span>
                <div class="value">{{ $order->customer_name }}</div>
                <div class="sub">Proyek: {{ $order->project_title }}</div>
                <div class="sub">Alamat Bongkar: {{ $order->delivery_address }}</div>
                <div class="sub">No. Telp / HP: {{ $order->customer_phone ?? '-' }}</div>
                @if($order->po_number)
                    <div class="sub">No. PO: {{ $order->po_number }}</div>
                @endif
            </td>
            <td>
                <span class="label">Informasi Pesanan</span>
                <div class="value">Tanggal: {{ $order->created_at?->format('d/m/Y H:i') }}</div>
                <div class="sub">Plant: {{ $order->batchingPlant?->name ?? '-' }} ({{ $order->batchingPlant?->code }})</div>
                <div class="sub">Jarak: {{ $qty($order->distance_km) }} km{{ $distanceNote }}</div>
                <div class="sub">Concrete Pump (CP): <strong>{{ $order->uses_concrete_pump ? 'Ya' : 'Tidak' }}</strong></div>
                <div class="sub">
                    Pembayaran: <strong>{{ $order->payment_method ?? '-' }}</strong> &bull; {{ $paymentLabels[$order->payment_status] ?? $order->payment_status }}
                </div>
                @if($order->approved_at)
                    <div class="sub" style="color: #047857;">ACC lokasi: {{ $order->approved_at->format('d/m/Y H:i') }} oleh {{ $order->approver?->name ?? '-' }}</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 45%;">Produk</th>
                <th style="width: 15%; text-align: center;">Volume</th>
                <th style="width: 15%; text-align: right;">Harga Satuan</th>
                <th style="width: 20%; text-align: right;">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $idx => $item)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td>
                        <strong>{{ $item->product?->name ?? 'Produk' }}</strong>
                        <div style="font-size: 9px; color: #64748b;">Kode: {{ $item->product?->code ?? '-' }}@if($item->notes) &middot; {{ $item->notes }}@endif</div>
                    </td>
                    <td style="text-align: center;">{{ $qty($item->quantity) }} {{ $item->unit }}</td>
                    <td class="right">{{ $rp($item->unit_price) }}</td>
                    <td class="right" style="font-weight: bold;">{{ $rp($item->subtotal) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="summary-table">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                @if($order->survey_notes || $order->notes)
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 10px; font-size: 10px;">
                        @if($order->survey_notes)<strong>Catatan Survei:</strong> {{ $order->survey_notes }}<br>@endif
                        @if($order->notes)<strong>Catatan Customer:</strong> {{ $order->notes }}@endif
                    </div>
                @endif
            </td>
            <td style="width: 45%; vertical-align: top;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td class="muted">Subtotal Produk:</td><td class="right" style="font-weight: bold; width: 110px;">{{ $rp($order->subtotal) }}</td></tr>
                    <tr><td class="muted">Ongkos Kirim:</td><td class="right" style="font-weight: bold;">{{ $rp($order->delivery_fee) }}</td></tr>
                    @if((float) $order->concrete_pump_fee > 0)
                        <tr><td class="muted">Concrete Pump (CP):</td><td class="right" style="font-weight: bold;">{{ $rp($order->concrete_pump_fee) }}</td></tr>
                    @endif
                    <tr><td class="muted">PPN (11%):</td><td class="right" style="font-weight: bold;">{{ $rp($order->ppn) }}</td></tr>
                    @if((float) $order->admin_fee > 0)
                        <tr><td class="muted">Biaya Layanan:</td><td class="right" style="font-weight: bold;">{{ $rp($order->admin_fee) }}</td></tr>
                    @endif
                    <tr style="border-top: 2px solid #0f172a;">
                        <td style="text-align: right; font-size: 12px; font-weight: 900; color: #0c1d37; padding-top: 6px;">Total:</td>
                        <td style="text-align: right; font-size: 13px; font-weight: 900; color: #0c1d37; padding-top: 6px;">{{ $rp($order->total_price) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="sign-box">
                    <div class="sign-title">Customer</div>
                    <div class="sign-name">( {{ $order->customer_name }} )</div>
                </div>
            </td>
            <td>
                <div class="sign-box">
                    <div class="sign-title">Sales / Bagian Penjualan PKM</div>
                    <div class="sign-name">( {{ $order->approver?->name ?? '..................' }} )</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Dokumen Sales Order dicetak dari Sistem ERP PKM pada {{ now()->translatedFormat('d F Y, H:i') }} WITA.
    </div>
</body>
</html>
