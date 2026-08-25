<?php

namespace Modules\Dispatch\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Order\Models\Order;
use Modules\Product\Models\Product;
use Modules\WorkOrder\Models\WorkOrder;

class SuratJalanItem extends Model
{
    protected $fillable = [
        'surat_jalan_id',
        'order_id',
        'work_order_id',
        'product_id',
        'quantity_delivered',
        'unit',
        'destination_customer_name',
        'destination_project_title',
        'destination_address',
        'destination_lat',
        'destination_lng',
        'delivery_sequence',
        'status',
        'recipient_name',
        'received_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity_delivered' => 'decimal:2',
            'destination_lat' => 'decimal:7',
            'destination_lng' => 'decimal:7',
            'delivery_sequence' => 'integer',
            'received_at' => 'datetime',
        ];
    }

    public function suratJalan(): BelongsTo
    {
        return $this->belongsTo(SuratJalan::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
