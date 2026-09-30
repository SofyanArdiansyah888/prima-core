<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Customer\Http\Requests\UpdateCustomerProfileRequest;
use Modules\Customer\Models\Customer;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->payload($this->customer($request)),
        ]);
    }

    public function update(UpdateCustomerProfileRequest $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->validated();

        $customer->update([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
        ]);

        return response()->json([
            'data' => $this->payload($customer->refresh()),
        ]);
    }

    private function customer(Request $request): Customer
    {
        /** @var Customer $customer */
        $customer = $request->user();

        return $customer;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Customer $customer): array
    {
        return [
            'uuid' => $customer->uuid,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
        ];
    }
}
