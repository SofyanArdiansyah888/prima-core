<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} — PT Prima Karya Manunggal</title>
    <style>
        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 10px;
            line-height: 1.4;
            margin: 0;
            padding: 15px;
        }
        .header {
            border-bottom: 2px solid #0c1d37;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #0c1d37;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .company-sub {
            font-size: 9px;
            color: #64748b;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 8px;
            margin-bottom: 3px;
        }
        .meta {
            font-size: 9px;
            color: #475569;
        }
        .metrics {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px;
            margin-bottom: 15px;
            margin-left: -6px;
            margin-right: -6px;
        }
        .metric-card {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 8px 10px;
            border-radius: 4px;
        }
        .metric-label {
            color: #64748b;
            font-size: 8px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .metric-value {
            font-size: 13px;
            font-weight: bold;
            color: #0c1d37;
            margin-top: 3px;
        }
        .metric-desc {
            font-size: 8px;
            color: #94a3b8;
            margin-top: 2px;
        }
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        table.data th {
            background-color: #0c1d37;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 5px;
            border: 1px solid #0c1d37;
            text-align: left;
        }
        table.data td {
            border: 1px solid #e2e8f0;
            padding: 5px 6px;
            font-size: 8.5px;
            color: #1e293b;
        }
        table.data tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 8px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="header">
        <table style="width: 100%;">
            <tr>
                <td>
                    <div class="company-name">PT PRIMA KARYA MANUNGGAL</div>
                    <div class="company-sub">Semen Tonasa Ready Mix & Distribusi Semen Curah/Sak</div>
                    <div class="title">{{ $title }}</div>
                    <div class="meta">Periode: <strong>{{ $period }}</strong></div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                    <div style="font-size: 8px; color: #64748b;">
                        Dokumen Resmi Sistem PKM<br>
                        Dicetak: {{ now()->translatedFormat('d M Y, H:i') }} WITA
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="metrics">
        <tr>
            @foreach ($metrics as $metric)
                <td class="metric-card" style="width: {{ 100 / count($metrics) }}%;">
                    <div class="metric-label">{{ $metric['label'] }}</div>
                    <div class="metric-value">{{ $metric['value'] }}</div>
                    @if (!empty($metric['desc']))
                        <div class="metric-desc">{{ $metric['desc'] }}</div>
                    @endif
                </td>
            @endforeach
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                @foreach ($headings as $heading)
                    <th>{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cellIndex => $cell)
                        <td class="{{ is_numeric($cell) ? 'text-right' : '' }}">
                            {{ is_numeric($cell) && $cell > 1000 ? number_format($cell, 0, ',', '.') : $cell }}
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headings) }}" style="text-align: center; padding: 15px; color: #64748b;">
                        Tidak ada data yang tercatat pada rentang periode ini.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <span>PT Prima Karya Manunggal — Sistem Informasi Operasional & Distribusi Terpadu.</span>
    </div>
</body>
</html>
