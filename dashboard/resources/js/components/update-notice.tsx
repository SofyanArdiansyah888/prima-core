import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const CHECK_INTERVAL_MS = 2 * 60 * 1000;
const COUNTDOWN_SECONDS = 10;
const SNOOZE_MS = 10 * 60 * 1000;
/** Versi yang sudah dicoba diperbarui otomatis (cegah reload berulang bila server belum konsisten). */
const TRIED_KEY = 'pkm_update_tried';

/** Bersihkan service worker & Cache Storage lalu muat ulang dari server (pengganti Ctrl+Shift+R). */
async function hardReload(target: string | null): Promise<void> {
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
        }

        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        }
    } catch {
        // tetap lanjut reload
    }

    try {
        if (target) {
            sessionStorage.setItem(TRIED_KEY, target);
        }
    } catch {
        // sessionStorage tidak tersedia
    }

    window.location.reload();
}

function isTyping(): boolean {
    const el = document.activeElement as HTMLElement | null;

    if (!el) {
        return false;
    }

    return (
        el.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
    );
}

/**
 * Deteksi build dashboard baru (public/build/version.json) dan perbarui otomatis
 * sehingga pengguna tidak perlu Ctrl+Shift+R.
 */
export function UpdateNotice() {
    const [available, setAvailable] = useState(false);
    const [target, setTarget] = useState<string | null>(null);
    const [autoAllowed, setAutoAllowed] = useState(true);
    const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
    const [paused, setPaused] = useState(false);
    const snoozeUntil = useRef(0);
    const reloading = useRef(false);

    const check = useCallback(async () => {
        if (import.meta.env.DEV || Date.now() < snoozeUntil.current) {
            return;
        }

        try {
            const res = await fetch(`/build/version.json?t=${Date.now()}`, {
                cache: 'no-store',
            });

            if (!res.ok) {
                return;
            }

            const data = (await res.json()) as { build?: string };

            if (data.build && data.build !== __BUILD_ID__) {
                let tried: string | null = null;

                try {
                    tried = sessionStorage.getItem(TRIED_KEY);
                } catch {
                    tried = null;
                }

                setTarget(data.build);
                setAutoAllowed(tried !== data.build);
                setAvailable(true);
            }
        } catch {
            // offline / gagal sementara: abaikan
        }
    }, []);

    useEffect(() => {
        // Cek pertama sesaat setelah halaman siap, lalu berkala
        const first = window.setTimeout(() => void check(), 5000);
        const timer = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void check();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('online', check);
        window.addEventListener('focus', check);

        return () => {
            window.clearTimeout(first);
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('online', check);
            window.removeEventListener('focus', check);
        };
    }, [check]);

    useEffect(() => {
        if (!available || !autoAllowed) {
            return;
        }

        const timer = window.setInterval(() => {
            const typing = isTyping();
            setPaused(typing);

            if (typing) {
                return;
            }

            setSeconds((s) => {
                if (s <= 1 && !reloading.current) {
                    reloading.current = true;
                    void hardReload(target);

                    return 0;
                }

                return Math.max(0, s - 1);
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [available, autoAllowed, target]);

    if (!available) {
        return null;
    }

    return (
        <div className="fixed right-4 bottom-4 z-[100] w-[calc(100%-2rem)] max-w-sm">
            <div
                role="status"
                className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#0c1d37] px-4 py-3 text-white shadow-2xl"
            >
                <RefreshCw className="size-4 shrink-0 text-[#ea580c]" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                        Versi terbaru tersedia
                    </p>
                    <p className="text-xs text-slate-300">
                        {!autoAllowed
                            ? 'Tekan Perbarui untuk memuat versi terbaru.'
                            : paused
                              ? 'Menunggu Anda selesai mengetik…'
                              : `Memperbarui otomatis dalam ${seconds} detik`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setAvailable(false);
                        setSeconds(COUNTDOWN_SECONDS);
                        snoozeUntil.current = Date.now() + SNOOZE_MS;
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-300 hover:text-white"
                >
                    Nanti
                </button>
                <button
                    type="button"
                    onClick={() => {
                        reloading.current = true;
                        void hardReload(target);
                    }}
                    className="rounded-md bg-[#ea580c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                >
                    Perbarui
                </button>
            </div>
        </div>
    );
}
