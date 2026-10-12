<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 12px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .meta { color: #475569; margin-bottom: 16px; }
        .metrics { width: 100%; margin-bottom: 16px; }
        .metrics td { width: 33%; border: 1px solid #e2e8f0; padding: 8px; }
        .label { color: #64748b; font-size: 10px; text-transform: uppercase; }
        .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th, table.data td { border: 1px solid #e2e8f0; padding: 6px; text-align: left; }
        table.data th { background: #f8fafc; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p class="meta">Prima Sales Pro · {{ $period }}</p>
    <table class="metrics">
        <tr>
            @foreach ($metrics as $metric)
                <td>
                    <div class="label">{{ $metric['label'] }}</div>
                    <div class="value">{{ $metric['value'] }}</div>
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
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headings) }}">Tidak ada data pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
