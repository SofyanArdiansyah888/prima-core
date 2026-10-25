<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Nota Pengiriman - {{ $suratJalan->code }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            color: #000000;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #000000;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .logo-box {
            width: 65px;
            vertical-align: middle;
        }
        .pkm-badge {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            border: 2px solid #000000;
            text-align: center;
            line-height: 1.1;
            padding-top: 6px;
            box-sizing: border-box;
            font-size: 7px;
            font-weight: bold;
        }
        .pkm-title {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #000000;
            vertical-align: middle;
        }
        .header-address {
            text-align: right;
            vertical-align: top;
            font-size: 9px;
            line-height: 1.3;
        }
        .no-box-container {
            width: 100%;
            margin-bottom: 6px;
        }
        .no-box {
            float: right;
            border: 1px solid #000000;
            padding: 4px 10px;
            min-width: 170px;
            font-size: 10.5px;
            line-height: 1.4;
        }
        .doc-title {
            text-align: center;
            font-size: 14px;
            font-weight: 900;
            text-decoration: underline;
            letter-spacing: 0.8px;
            margin: 8px 0 12px 0;
            clear: both;
        }
        .meta-form {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .meta-form td {
            padding: 3px 0;
            vertical-align: bottom;
            font-size: 11px;
        }
        .field-label {
            white-space: nowrap;
            width: 1%;
            font-weight: normal;
        }
        .field-line {
            border-bottom: 1px solid #000000;
            padding-left: 8px;
            padding-bottom: 1px;
            font-weight: bold;
        }
        .section-header {
            font-weight: 900;
            font-size: 11.5px;
            margin: 10px 0 6px 0;
        }
        .delivery-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .delivery-table td {
            vertical-align: top;
            padding: 3px 4px;
            font-size: 10.5px;
        }
        .right-spec-box {
            border: 1px solid #000000;
            padding: 6px 8px;
            margin-left: 8px;
        }
        .box-mutu {
            display: inline-block;
            border: 1.5px solid #000000;
            padding: 1px 12px;
            font-weight: 900;
            font-size: 12px;
            margin-left: 4px;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            margin-top: 14px;
            margin-bottom: 10px;
        }
        .signatures-table td {
            width: 33.33%;
            border: 1.5px solid #000000;
            text-align: center;
            vertical-align: top;
            padding: 8px 6px;
        }
        .sign-header {
            font-weight: bold;
            font-size: 10.5px;
            min-height: 28px;
        }
        .sign-space {
            height: 55px;
        }
        .sign-name {
            font-weight: bold;
            font-size: 10.5px;
        }
        .footer-note {
            font-size: 10.5px;
            margin-top: 6px;
            line-height: 1.4;
        }
        .circle-num {
            display: inline-block;
            border: 1.5px solid #000000;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin-right: 4px;
        }
    </style>
</head>
<body>

    @php
        $firstItem = $suratJalan->items->first();
        $product = $firstItem?->product;
        $workOrder = $firstItem?->workOrder;
        $customerName = $order->customer?->name ?? $firstItem?->destination_customer_name ?? '-';
        $projectTitle = $order->project_title ?? $firstItem?->destination_project_title ?? '-';
        $deliveryAddress = $order->delivery_address ?? $firstItem?->destination_address ?? '-';
        $quantity = (float) ($firstItem?->quantity_delivered ?? 7);
        $orderCode = $order->code ?? '-';
        $orderDate = $order->created_at ? $order->created_at->format('d - m - Y') : date('d - m - Y');
        $departureTime = $suratJalan->departure_time ? $suratJalan->departure_time->format('H . i') : '17 . 44';
        $arrivalTime = $suratJalan->arrival_time ? $suratJalan->arrival_time->format('H . i') : '.........';
        $driverName = $suratJalan->driver_name ?? $suratJalan->driver?->name ?? 'DOWAR';
        $operatorName = $workOrder?->assignedUser?->name ?? 'NURDIN';
        $recipientName = $firstItem?->recipient_name ?? '....................................';
        $distanceKm = (float) ($order->distance_km ?? 15);
        $distancePP = $distanceKm > 0 ? ($distanceKm * 2) : 30;

        // Mutu extraction (e.g. K 225)
        $mutuCode = '225';
        if ($product) {
            if (preg_match('/K[-\s]?(\d+)/i', $product->name, $matches)) {
                $mutuCode = $matches[1];
            } elseif (preg_match('/K[-\s]?(\d+)/i', $product->code, $matches)) {
                $mutuCode = $matches[1];
            } else {
                $mutuCode = $product->name;
            }
        }
        $slumpVal = $product?->slump ?? $workOrder?->slump_target ?? '12 ± 2';
    @endphp

    <!-- HEADER KOP SURAT -->
    <table class="header-table">
        <tr>
            <td class="logo-box">
                <div class="pkm-badge">
                    <span style="font-size: 6px; display: block;">&star; PKM &star;</span>
                    <strong style="font-size: 9px; display: block; margin: 1px 0;">PKM</strong>
                    <span style="font-size: 5px; display: block;">SEMEN TONASA</span>
                </div>
            </td>
            <td class="pkm-title">
                PT. PRIMA KARYA MANUNGGAL
            </td>
            <td class="header-address">
                <strong>Kantor Pusat PT. Semen Tonasa</strong><br>
                Lantai I Biringere Pangkep<br>
                Telp. (0410) 310040 Fax. (0410) 310039
            </td>
        </tr>
    </table>

    <!-- KOTAK NO & TONASA TGL -->
    <div class="no-box-container">
        <div class="no-box">
            <div><strong>No :</strong> {{ $suratJalan->code }}</div>
            <div style="margin-top: 2px;"><strong>Tonasa Tgl.</strong> {{ $suratJalan->created_at ? $suratJalan->created_at->format('d/m/Y') : date('d/m/Y') }}</div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <!-- JUDUL RESMI -->
    <div class="doc-title">
        NOTA PENGIRIMAN &ldquo;BETON SIAP PAKAI&rdquo;
    </div>

    <!-- DATA PERMINTAAN PELANGGAN / PROYEK -->
    <table class="meta-form">
        <tr>
            <td class="field-label">Permintaan dari</td>
            <td style="width: 10px; text-align: center;">:</td>
            <td class="field-line">{{ strtoupper($customerName) }}</td>
        </tr>
        <tr>
            <td class="field-label">Untuk Pekerjaan</td>
            <td style="width: 10px; text-align: center;">:</td>
            <td class="field-line">{{ strtoupper($projectTitle) }}</td>
        </tr>
        <tr>
            <td class="field-label">Lokasi Pengecoran</td>
            <td style="width: 10px; text-align: center;">:</td>
            <td class="field-line">{{ strtoupper($deliveryAddress) }}</td>
        </tr>
    </table>

    <table class="meta-form" style="margin-bottom: 12px;">
        <tr>
            <td class="field-label">Sesuai dengan surat Permintaan No.</td>
            <td style="width: 10px; text-align: center;">:</td>
            <td class="field-line" style="width: 50%;">{{ $orderCode }}</td>
            <td class="field-label" style="padding-left: 20px;">Tgl.</td>
            <td style="width: 10px; text-align: center;">:</td>
            <td class="field-line">{{ $orderDate }}</td>
        </tr>
    </table>

    <!-- SECTION PELAKSANAAN PENGIRIMAN -->
    <div class="section-header">&ldquo;PELAKSANAAN PENGIRIMAN&rdquo; :</div>

    <table class="delivery-table">
        <tr>
            <!-- SISI KIRI: DATA TRUK & WAKTU OPERASIONAL -->
            <td style="width: 62%;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="white-space: nowrap; width: 1%;">Transit Mixer No.</td>
                        <td style="width: 8px; text-align: center;">:</td>
                        <td style="font-weight: bold; border-bottom: 1px dotted #000;">
                            {{ $suratJalan->vehicle_number }}
                        </td>
                        <td style="white-space: nowrap; width: 1%; padding-left: 10px;">sebanyak :</td>
                        <td style="font-weight: bold; border-bottom: 1px dotted #000; text-align: center; width: 40px;">
                            {{ number_format($quantity, 0) }}
                        </td>
                        <td style="width: 25px;">m3</td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
                    <tr>
                        <td style="white-space: nowrap; width: 1%;">Jam selesai muat / jam berangkat</td>
                        <td style="width: 8px; text-align: center;">:</td>
                        <td style="font-weight: bold; border-bottom: 1px dotted #000; width: 65px;">
                            {{ $departureTime }}
                        </td>
                        <td style="white-space: nowrap; width: 1%; padding-left: 8px;">Jam mulai tuang</td>
                        <td style="width: 8px; text-align: center;">:</td>
                        <td style="border-bottom: 1px dotted #000;"></td>
                    </tr>
                    <tr>
                        <td style="white-space: nowrap; width: 1%; padding-top: 5px;">Jam datang di lokasi pengecoran</td>
                        <td style="width: 8px; text-align: center; padding-top: 5px;">:</td>
                        <td style="font-weight: bold; border-bottom: 1px dotted #000; padding-top: 5px;">
                            {{ $arrivalTime }}
                        </td>
                        <td style="white-space: nowrap; width: 1%; padding-left: 8px; padding-top: 5px;">Jam selesai tuang / kembali</td>
                        <td style="width: 8px; text-align: center; padding-top: 5px;">:</td>
                        <td style="border-bottom: 1px dotted #000; padding-top: 5px;"></td>
                    </tr>
                </table>

                <div style="margin-top: 8px;">
                    Sampai saat ini telah dikirim sebanyak :
                    <span class="circle-num">{{ number_format($order->fulfilled_quantity > 0 ? $order->fulfilled_quantity : $quantity, 0) }}</span>
                    <strong>m3</strong>
                </div>
            </td>

            <!-- SISI KANAN: ADITIF & MUTU CAMPURAN -->
            <td style="width: 38%; padding-left: 10px;">
                <div class="right-spec-box">
                    <div style="margin-bottom: 8px;">
                        <strong>ADDECTIVE =</strong>
                        <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 45px; text-align: center; font-weight: bold;">
                            8
                        </span>
                        <strong>LITER</strong>
                    </div>

                    <div style="margin-bottom: 8px; white-space: nowrap;">
                        Sifat kekuasaan campuran :
                        <span style="font-weight: bold;">K</span>
                        <span class="box-mutu">{{ $mutuCode }}</span>
                    </div>

                    <div>
                        <strong>Slump :</strong>
                        <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 50px; text-align: center; font-weight: bold;">
                            {{ $slumpVal }}
                        </span>
                        <strong>CM</strong>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 3 KOLOM TANDA TANGAN BERGARIS TEGAS -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sign-header">
                    Penerima<br>Yang dikuasakan
                </div>
                <div class="sign-space"></div>
                <div class="sign-name">
                    ( &nbsp;&nbsp;{{ $recipientName }}&nbsp;&nbsp; )
                </div>
            </td>
            <td>
                <div class="sign-header">
                    Transit Mixer<br>Operator
                </div>
                <div class="sign-space"></div>
                <div class="sign-name">
                    ( &nbsp;&nbsp;{{ strtoupper($driverName) }}&nbsp;&nbsp; )
                </div>
            </td>
            <td>
                <div class="sign-header">
                    Batch Plant<br>Operator
                </div>
                <div class="sign-space"></div>
                <div class="sign-name">
                    ( &nbsp;&nbsp;{{ strtoupper($operatorName) }}&nbsp;&nbsp; )
                </div>
            </td>
        </tr>
    </table>

    <!-- FOOTER CATATAN & JARAK PP -->
    <div class="footer-note">
        <strong>Catatan</strong><br>
        <strong>JARAK PP =</strong> &nbsp;
        <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 50px; text-align: center; font-weight: bold;">
            {{ number_format($distancePP, 0) }}
        </span>
        <strong>KM</strong> &nbsp;&nbsp;&nbsp;&nbsp;
        <span>{{ $suratJalan->notes ?? 'Rute aman armada mixer Semen Tonasa.' }}</span>
    </div>

</body>
</html>
