<?php

namespace Modules\Shared\Services;

use Illuminate\Support\Facades\DB;
use Modules\Shared\Models\DocumentSequence;

class CodeGenerator
{
    public function nextBranchCode(string $region): string
    {
        $region = strtoupper(preg_replace('/[^A-Z0-9]/', '', $region) ?? '');
        $region = substr($region, 0, 6);
        $scope = $region;
        $nn = $this->nextNumber('branch', $scope, null, 2);

        return sprintf('BR-%s-%s', $region, $nn);
    }

    public function nextPlantCode(string $branchCode): string
    {
        $branchCode = strtoupper($branchCode);
        $nn = $this->nextNumber('batching_plant', $branchCode, null, 2);

        return sprintf('%s-BP-%s', $branchCode, $nn);
    }

    public function nextEmployeeCode(?string $branchShort = null): string
    {
        $short = $branchShort
            ? strtoupper(preg_replace('/[^A-Z0-9]/', '', $branchShort) ?? '')
            : 'HQ';
        $short = substr($short ?: 'HQ', 0, 6);
        $year = (int) date('Y');
        $seq = $this->nextNumber('employee', $short, $year, 5);

        return sprintf('EMP-%s-%d%s', $short, $year, $seq);
    }

    public function nextOrderCode(?string $region = null): string
    {
        $reg = $region ? strtoupper(preg_replace('/[^A-Z0-9]/', '', $region) ?? '') : 'HQ';
        $reg = substr($reg ?: 'HQ', 0, 6);
        $yearMonth = (int) date('Ym');
        $seq = $this->nextNumber('order', $reg, $yearMonth, 5);

        return sprintf('SO-%s-%d%s', $reg, $yearMonth, $seq);
    }

    public function nextWorkOrderCode(string $plantCode): string
    {
        $clean = strtoupper(preg_replace('/[^A-Z0-9]/', '', $plantCode) ?? 'PLANT');
        $clean = substr($clean, -8);
        $yearMonth = (int) date('Ym');
        $seq = $this->nextNumber('work_order', $clean, $yearMonth, 4);

        return sprintf('WO-%s-%d%s', $clean, $yearMonth, $seq);
    }

    public function nextSuratJalanCode(string $plantCode): string
    {
        $clean = strtoupper(preg_replace('/[^A-Z0-9]/', '', $plantCode) ?? 'PLANT');
        $clean = substr($clean, -8);
        $yearMonth = (int) date('Ym');
        $seq = $this->nextNumber('surat_jalan', $clean, $yearMonth, 4);

        return sprintf('SJ-%s-%d%s', $clean, $yearMonth, $seq);
    }

    public function nextProductCode(string $category): string
    {
        $cat = strtoupper(substr(preg_replace('/[^A-Z0-9]/', '', $category) ?? 'GEN', 0, 4));
        $seq = $this->nextNumber('product', $cat, null, 3);

        return sprintf('PRD-%s-%s', $cat, $seq);
    }

    /**
     * Branch region segment from BR-{REGION}-{NN}.
     */
    public function regionFromBranchCode(string $branchCode): string
    {
        $parts = explode('-', strtoupper($branchCode));

        return $parts[1] ?? 'HQ';
    }

    private function nextNumber(string $entity, string $scope, ?int $year, int $pad): string
    {
        return DB::transaction(function () use ($entity, $scope, $year, $pad) {
            $query = DocumentSequence::query()
                ->where('entity', $entity)
                ->where('scope', $scope);

            if ($year === null) {
                $query->whereNull('year');
            } else {
                $query->where('year', $year);
            }

            $row = $query->lockForUpdate()->first();

            if (! $row) {
                $row = DocumentSequence::query()->create([
                    'entity' => $entity,
                    'scope' => $scope,
                    'year' => $year,
                    'last_number' => 0,
                ]);
                $row = DocumentSequence::query()->whereKey($row->id)->lockForUpdate()->firstOrFail();
            }

            $row->last_number++;
            $row->save();

            return str_pad((string) $row->last_number, $pad, '0', STR_PAD_LEFT);
        });
    }
}
