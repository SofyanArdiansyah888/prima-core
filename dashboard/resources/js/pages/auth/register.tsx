import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { login } from '@/routes';

export default function RegisterDisabled() {
    return (
        <>
            <Head title="Registration disabled" />
            <div className="flex flex-col gap-4 text-center">
                <p className="text-sm text-muted-foreground">
                    Pendaftaran publik dimatikan. User dibuat melalui Master User oleh admin.
                </p>
                <Button asChild>
                    <Link href={login()}>Kembali ke login</Link>
                </Button>
            </div>
        </>
    );
}

RegisterDisabled.layout = {
    title: 'Registration disabled',
    description: 'Public sign-up is not available',
};
