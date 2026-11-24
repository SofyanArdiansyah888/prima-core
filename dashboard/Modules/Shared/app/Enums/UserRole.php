<?php

namespace Modules\Shared\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case User = 'user';
    case Sales = 'sales';
    case Driver = 'driver';
    case Manager = 'manager';
    case KepalaDivisi = 'kepala_divisi';
    case Keuangan = 'keuangan';
    case Direksi = 'direksi';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::User => 'Operator Plant',
            self::Sales => 'Sales Lapangan',
            self::Driver => 'Supir Armada',
            self::Manager => 'Manager',
            self::KepalaDivisi => 'Kepala Divisi',
            self::Keuangan => 'Keuangan',
            self::Direksi => 'Direksi',
        };
    }

    /** Role pemberi persetujuan Berita Acara retur pembayaran, sesuai urutan tahap. */
    public static function approverRoles(): array
    {
        return [self::Manager, self::KepalaDivisi, self::Keuangan, self::Direksi];
    }

    public function isApprover(): bool
    {
        return in_array($this, self::approverRoles(), true);
    }
}
