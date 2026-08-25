<?php

namespace Modules\Shared\Enums;

enum PlantStatus: string
{
    case Operational = 'OPERATIONAL';
    case Maintenance = 'MAINTENANCE';
    case Inactive = 'INACTIVE';

    public function label(): string
    {
        return match ($this) {
            self::Operational => 'Operational',
            self::Maintenance => 'Maintenance',
            self::Inactive => 'Inactive',
        };
    }
}
