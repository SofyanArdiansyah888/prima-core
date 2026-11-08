<?php

namespace Modules\Shared\Concerns;

use App\Models\User;

/**
 * Pemeriksaan akses per record untuk controller dashboard / API staf.
 */
trait AuthorizesPlantAccess
{
    protected function ensurePlantAccess(?int $plantId, ?User $user = null): void
    {
        $user ??= auth()->user();

        abort_unless(
            $user instanceof User && $user->canAccessPlant($plantId),
            403,
            'Data ini milik batching plant lain dan tidak dapat Anda akses.'
        );
    }
}
