<?php

namespace Modules\Shared\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case User = 'user';
    case Sales = 'sales';
    case Driver = 'driver';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::User => 'Operator Plant',
            self::Sales => 'Sales Lapangan',
            self::Driver => 'Supir Armada',
        };
    }
}
