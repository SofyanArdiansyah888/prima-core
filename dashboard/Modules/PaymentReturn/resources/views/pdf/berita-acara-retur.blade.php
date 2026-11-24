<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Berita Acara Retur - {{ $ba->code }}</title>
    <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.45; margin: 0; }
        .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
        .company-name { font-size: 15px; font-weight: bold; color: #0c1d37; text-transform: uppercase; }
        .company-sub { font-size: 10px; font-weight: bold; color: #ea580c; text-transform: uppercase; }
        .company-desc { font-size: 9px; color: #64748b; }
        .doc-title { text-align: right; vertical-align: top; }
        .doc-title h1 { margin: 0; font-size: 14px; font-weight: 900; color: #0c1d37; text-transform: uppercase; }
        .doc-code { font-family: monospace; font-size: 12px; font-weight: bold; color: #d91424; margin-top: 3px; }
        .badge { display: inline-block; padding: 2px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        .meta-table { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
        .meta-table td { width: 50%; vertical-align: top; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 10.5px; }
        .label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 2px; }
        .value { font-weight: bold; color: #0f172a; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .data-table th { background: #0c1d37; color: #fff; font-size: 10px; text-transform: uppercase; padding: 6px 8px; border: 1px solid #0c1d37; text-align: left; }
        .data-table td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10.5px; }
        .right { text-align: right; }
        .center { text-align: center; }
        .reason { border: 1px solid #e2e8f0; background: #fffbeb; padding: 8px 10px; margin-bottom: 12px; font-size: 10.5px; }
        .signatures { width: 100%; margin-top: 18px; border-collapse: collapse; }
        .signatures td { width: 25%; text-align: center; vertical-align: top; padding: 4px; }
        .sign-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 6px; min-height: 95px; }
        .sign-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
        .sign-status { font-size: 9px; font-weight: bold; margin: 18px 0 14px; }
        .ok { color: #047857; }
        .no { color: #b91c1c; }
        .wait { color: #94a3b8; }
        .sign-name { font-weight: bold; font-size: 10px; border-top: 1px dotted #94a3b8; display: inline-block; padding-top: 3px; min-width: 110px; }
        .footer-note { margin-top: 18px; font-size: 8.5px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    @php
        $rp = fn ($v) => 'Rp '.number_format((float) $v, 0, ',', '.');
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', '.'), '0'), ',');
        $order = $ba->order;
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
                <h1>Berita Acara<br>Pengembalian Pembayaran</h1>
                <div class="doc-code">{{ $ba->code }}</div>
                <div style="margin-top: 4px;"><span class="badge">{{ \Modules\PaymentReturn\Models\PaymentReturn::statusLabel($ba->status) }}</span></div>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 10px;">
        Pada tanggal <strong>{{ $ba->created_at?->translatedFormat('d F Y') }}</strong> telah dibuat Berita Acara pengembalian
        pembayaran atas volume pesanan yang tidak terpakai / diretur, dengan rincian sebagai berikut:
    </p>

    <table class="meta-table">
        <tr>
            <td>
                <span class="label">Customer</span>
                <div class="value">{{ $order?->customer_name }}</div>
                <div>Proyek: {{ $order?->project_title }}</div>
                <div>No. HP: {{ $order?->customer_phone ?? '-' }}</div>
            </td>
            <td>
                <span class="label">Referensi Pesanan</span>
                <div class="value">No. SO: {{ $order?->code }}</div>
                <div>Plant: {{ $ba->batchingPlant?->name ?? '-' }}</div>
                <div>Total dibayar: {{ $rp($order?->total_price) }}</div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th>Produk</th>
                <th class="center" style="width: 15%;">Vol. Pesan</th>
                <th class="center" style="width: 15%;">Vol. Retur</th>
                <th class="right" style="width: 15%;">Harga Satuan</th>
                <th class="right" style="width: 17%;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ba->items as $i => $item)
                <tr>
                    <td class="center">{{ $i + 1 }}</td>
                    <td>{{ $item->orderItem?->product?->name ?? '-' }}</td>
                    <td class="center">{{ $qty($item->orderItem?->quantity) }} {{ $item->orderItem?->unit }}</td>
                    <td class="center"><strong>{{ $qty($item->quantity) }} {{ $item->orderItem?->unit }}</strong></td>
                    <td class="right">{{ $rp($item->unit_price) }}</td>
                    <td class="right">{{ $rp($item->subtotal) }}</td>
                </tr>
            @endforeach
            <tr>
                <td colspan="5" class="right">Subtotal</td>
                <td class="right">{{ $rp($ba->subtotal) }}</td>
            </tr>
            <tr>
                <td colspan="5" class="right">PPN 11%</td>
                <td class="right">{{ $rp($ba->ppn) }}</td>
            </tr>
            <tr>
                <td colspan="5" class="right"><strong>Total Dikembalikan</strong></td>
                <td class="right"><strong>{{ $rp($ba->amount) }}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="reason">
        <span class="label">Alasan Retur</span>
        {{ $ba->reason }}
    </div>

    <table class="meta-table">
        <tr>
            <td>
                <span class="label">Rekening Tujuan Pengembalian</span>
                <div class="value">{{ $ba->customer_bank_name ?? '-' }} &bull; {{ $ba->customer_bank_account ?? '-' }}</div>
                <div>a.n. {{ $ba->customer_account_name ?? '-' }}</div>
            </td>
            <td>
                <span class="label">Status Pengembalian Dana</span>
                @if($ba->refunded_at)
                    <div class="value ok">Ditransfer {{ $ba->refunded_at->format('d/m/Y H:i') }}</div>
                    <div>Ref: {{ $ba->refund_reference }}</div>
                @else
                    <div class="value">Belum ditransfer</div>
                @endif
                <div>Dibuat oleh: {{ $ba->creator?->name ?? '-' }}</div>
            </td>
        </tr>
    </table>

    <table class="signatures">
        <tr>
            @foreach($steps as $step)
                @php $a = $step['approval']; @endphp
                <td>
                    <div class="sign-box">
                        <div class="sign-title">{{ $step['label'] }}</div>
                        @if($a && $a->decision === 'approved')
                            <div class="sign-status ok">DISETUJUI<br>{{ $a->decided_at?->format('d/m/Y H:i') }}</div>
                        @elseif($a)
                            <div class="sign-status no">DITOLAK<br>{{ $a->decided_at?->format('d/m/Y H:i') }}</div>
                        @else
                            <div class="sign-status wait">BELUM</div>
                        @endif
                        <div class="sign-name">( {{ $a?->user?->name ?? '..................' }} )</div>
                    </div>
                </td>
            @endforeach
        </tr>
    </table>

    <div class="footer-note">
        Berita Acara ini disetujui secara elektronik melalui Sistem ERP PKM.<br>
        Dicetak pada: {{ now()->translatedFormat('d F Y, H:i') }} WITA
    </div>
</body>
</html>
