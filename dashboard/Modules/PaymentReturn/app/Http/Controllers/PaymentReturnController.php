<?php

namespace Modules\PaymentReturn\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\PaymentReturn\Models\PaymentReturn;
use Modules\PaymentReturn\Models\PaymentReturnApproval;
use Modules\PaymentReturn\Models\PaymentReturnItem;
use Modules\PaymentReturn\Services\PaymentReturnWorkflow;
use Modules\Shared\Concerns\AuthorizesPlantAccess;
use Modules\Shared\Enums\UserRole;

class PaymentReturnController extends Controller
{
    use AuthorizesPlantAccess;

    public function index(Request $request): Response
    {
        $user = $this->authorizeViewer($request);
        $tab = $request->string('tab', $user->role?->isApprover() ? 'mine' : 'all')->toString();
        $search = $request->string('search')->trim()->toString();

        $query = PaymentReturn::query()
            ->visibleTo($user)
            ->with(['order:id,uuid,code,customer_name,project_title', 'batchingPlant:id,code,name', 'creator:id,name'])
            ->when($search !== '', fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($o) => $o->where('code', 'like', "%{$search}%")->orWhere('customer_name', 'like', "%{$search}%"));
            }));

        $myStatus = $this->statusAwaiting($user);

        match ($tab) {
            'mine' => $myStatus !== null ? $query->whereIn('status', $myStatus) : $query->whereRaw('1 = 0'),
            'process' => $query->whereIn('status', array_keys(PaymentReturn::STEPS)),
            'done' => $query->whereIn('status', [PaymentReturn::STATUS_APPROVED, PaymentReturn::STATUS_REFUNDED, PaymentReturn::STATUS_REJECTED]),
            default => null,
        };

        $returns = $query->orderByDesc('id')->paginate(15)->withQueryString();
        $returns->getCollection()->transform(fn (PaymentReturn $r) => [
            'uuid' => $r->uuid,
            'code' => $r->code,
            'status' => $r->status,
            'status_label' => PaymentReturn::statusLabel($r->status),
            'amount' => (float) $r->amount,
            'created_at' => $r->created_at?->toIso8601String(),
            'creator' => $r->creator?->name,
            'order' => $r->order?->only(['uuid', 'code', 'customer_name', 'project_title']),
            'plant' => $r->batchingPlant?->only(['code', 'name']),
            'awaiting_me' => $r->isAwaiting($user),
        ]);

        return Inertia::render('modules/payment-return/index', [
            'returns' => $returns,
            'filters' => ['tab' => $tab, 'search' => $search],
            'awaitingCount' => $myStatus !== null
                ? PaymentReturn::query()->visibleTo($user)->whereIn('status', $myStatus)->count()
                : 0,
        ]);
    }

    public function create(Request $request, PaymentReturnWorkflow $workflow): Response|RedirectResponse
    {
        $this->authorizeCreator($request);
        $order = Order::query()->where('uuid', $request->string('order')->toString())->with(['items.product', 'batchingPlant'])->firstOrFail();
        $this->ensurePlantAccess($order->batching_plant_id);

        if (! $order->isPaid()) {
            return redirect()->route('orders.show', $order)->with('error', 'Berita Acara retur hanya untuk pesanan yang sudah lunas.');
        }

        $remaining = $workflow->returnableQuantities($order);

        return Inertia::render('modules/payment-return/form', [
            'order' => [
                'uuid' => $order->uuid,
                'code' => $order->code,
                'customer_name' => $order->customer_name,
                'project_title' => $order->project_title,
                'total_price' => (float) $order->total_price,
                'plant' => $order->batchingPlant?->only(['code', 'name']),
            ],
            'items' => $order->items->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'name' => $item->product?->name,
                'unit' => $item->unit,
                'quantity' => (float) $item->quantity,
                'fulfilled_quantity' => (float) $item->fulfilled_quantity,
                'unit_price' => (float) $item->unit_price,
                'returnable' => $remaining[$item->id] ?? 0.0,
                // Usulan awal: volume yang tidak terkirim / tidak terpakai.
                'suggested' => min($remaining[$item->id] ?? 0.0, max(0.0, round((float) $item->quantity - (float) $item->fulfilled_quantity, 2))),
            ])->values(),
            'returnableAmount' => $workflow->returnableAmount($order),
            'ppnRate' => PaymentReturnWorkflow::PPN_RATE,
        ]);
    }

    public function store(Request $request, PaymentReturnWorkflow $workflow): RedirectResponse
    {
        $user = $this->authorizeCreator($request);

        $data = $request->validate([
            'order_uuid' => ['required', 'uuid', 'exists:orders,uuid'],
            'reason' => ['required', 'string', 'max:2000'],
            'customer_bank_name' => ['nullable', 'string', 'max:100'],
            'customer_bank_account' => ['nullable', 'string', 'max:50'],
            'customer_account_name' => ['nullable', 'string', 'max:150'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
        ]);

        $order = Order::query()->where('uuid', $data['order_uuid'])->firstOrFail();
        $this->ensurePlantAccess($order->batching_plant_id);

        $return = $workflow->create($order, $user, $data);

        return redirect()->route('payment-returns.show', $return)
            ->with('success', "Berita Acara {$return->code} dibuat dan menunggu persetujuan Manager.");
    }

    public function show(Request $request, PaymentReturn $paymentReturn): Response
    {
        $user = $this->authorizeViewer($request);
        $this->ensurePlantAccess($paymentReturn->batching_plant_id);

        $paymentReturn->load([
            'order:id,uuid,code,customer_name,customer_phone,project_title,total_price,payment_status,refund_amount',
            'batchingPlant:id,code,name',
            'creator:id,name',
            'refunder:id,name',
            'items.orderItem.product:id,name,code',
            'approvals.user:id,name',
        ]);

        $approvals = $paymentReturn->approvals->keyBy('step');

        return Inertia::render('modules/payment-return/show', [
            'paymentReturn' => [
                'uuid' => $paymentReturn->uuid,
                'code' => $paymentReturn->code,
                'status' => $paymentReturn->status,
                'status_label' => PaymentReturn::statusLabel($paymentReturn->status),
                'reason' => $paymentReturn->reason,
                'subtotal' => (float) $paymentReturn->subtotal,
                'ppn' => (float) $paymentReturn->ppn,
                'amount' => (float) $paymentReturn->amount,
                'customer_bank_name' => $paymentReturn->customer_bank_name,
                'customer_bank_account' => $paymentReturn->customer_bank_account,
                'customer_account_name' => $paymentReturn->customer_account_name,
                'creator' => $paymentReturn->creator?->name,
                'created_at' => $paymentReturn->created_at?->toIso8601String(),
                'refunded_at' => $paymentReturn->refunded_at?->toIso8601String(),
                'refunder' => $paymentReturn->refunder?->name,
                'refund_reference' => $paymentReturn->refund_reference,
                'order' => $paymentReturn->order?->only(['uuid', 'code', 'customer_name', 'customer_phone', 'project_title', 'total_price', 'payment_status', 'refund_amount']),
                'plant' => $paymentReturn->batchingPlant?->only(['code', 'name']),
                'items' => $paymentReturn->items->map(fn (PaymentReturnItem $i) => [
                    'name' => $i->orderItem?->product?->name,
                    'unit' => $i->orderItem?->unit,
                    'ordered_quantity' => (float) ($i->orderItem?->quantity ?? 0),
                    'quantity' => (float) $i->quantity,
                    'unit_price' => (float) $i->unit_price,
                    'subtotal' => (float) $i->subtotal,
                ])->values(),
                'steps' => collect(PaymentReturn::STEPS)->map(function (UserRole $role, string $status) use ($approvals) {
                    /** @var PaymentReturnApproval|null $a */
                    $a = $approvals->get($role->value);

                    return [
                        'status' => $status,
                        'role' => $role->value,
                        'label' => $role->label(),
                        'decision' => $a?->decision,
                        'user' => $a?->user?->name,
                        'notes' => $a?->notes,
                        'decided_at' => $a?->decided_at?->toIso8601String(),
                    ];
                })->values(),
            ],
            'can' => [
                'decide' => $paymentReturn->isAwaiting($user),
                'refund' => $paymentReturn->status === PaymentReturn::STATUS_APPROVED && $user->canManageFinance(),
            ],
        ]);
    }

    public function approve(Request $request, PaymentReturn $paymentReturn, PaymentReturnWorkflow $workflow): RedirectResponse
    {
        $user = $this->authorizeViewer($request);
        $this->ensurePlantAccess($paymentReturn->batching_plant_id);
        $data = $request->validate(['notes' => ['nullable', 'string', 'max:1000']]);

        $return = $workflow->approve($paymentReturn, $user, $data['notes'] ?? null);

        return back()->with('success', "Berita Acara {$return->code}: ".PaymentReturn::statusLabel($return->status).'.');
    }

    public function reject(Request $request, PaymentReturn $paymentReturn, PaymentReturnWorkflow $workflow): RedirectResponse
    {
        $user = $this->authorizeViewer($request);
        $this->ensurePlantAccess($paymentReturn->batching_plant_id);
        $data = $request->validate(['notes' => ['required', 'string', 'max:1000']]);

        $workflow->reject($paymentReturn, $user, $data['notes']);

        return back()->with('success', "Berita Acara {$paymentReturn->code} ditolak.");
    }

    public function refund(Request $request, PaymentReturn $paymentReturn, PaymentReturnWorkflow $workflow): RedirectResponse
    {
        $user = $this->authorizeViewer($request);
        abort_unless($user->canManageFinance(), 403, 'Hanya keuangan / admin yang dapat menandai dana dikembalikan.');
        $this->ensurePlantAccess($paymentReturn->batching_plant_id);
        $data = $request->validate(['refund_reference' => ['required', 'string', 'max:150']]);

        $workflow->markRefunded($paymentReturn, $user, $data['refund_reference']);

        return back()->with('success', "Dana retur {$paymentReturn->code} ditandai sudah dikembalikan ke customer.");
    }

    public function print(Request $request, PaymentReturn $paymentReturn): \Illuminate\Http\Response
    {
        $this->authorizeViewer($request);
        $this->ensurePlantAccess($paymentReturn->batching_plant_id);

        $paymentReturn->load(['order', 'batchingPlant', 'creator', 'items.orderItem.product', 'approvals.user']);
        $approvals = $paymentReturn->approvals->keyBy('step');

        return Pdf::loadView('paymentreturn::pdf.berita-acara-retur', [
            'ba' => $paymentReturn,
            'steps' => collect(PaymentReturn::STEPS)->map(fn (UserRole $role) => [
                'label' => $role->label(),
                'approval' => $approvals->get($role->value),
            ])->values(),
        ])->stream("{$paymentReturn->code}.pdf");
    }

    /** Admin + 4 role penyetuju boleh melihat BA retur. */
    private function authorizeViewer(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isAdmin() || ($user->role?->isApprover() ?? false), 403, 'Menu retur hanya untuk admin, manager, kepala divisi, keuangan, dan direksi.');

        return $user;
    }

    private function authorizeCreator(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isAdmin(), 403, 'Hanya admin yang dapat membuat Berita Acara retur.');

        return $user;
    }

    /**
     * @return list<string>|null
     */
    private function statusAwaiting(User $user): ?array
    {
        $statuses = array_keys(array_filter(PaymentReturn::STEPS, fn (UserRole $role) => $user->role === $role));

        return $statuses !== [] ? array_values($statuses) : null;
    }
}
