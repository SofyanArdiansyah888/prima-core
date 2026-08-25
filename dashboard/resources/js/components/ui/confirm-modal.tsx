import { AlertTriangle, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'emerald' | 'purple' | 'amber';
    onConfirm: () => void;
    isLoading?: boolean;
};

export function ConfirmModal({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'emerald',
    onConfirm,
    isLoading = false,
}: ConfirmModalProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'destructive':
                return {
                    icon: <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />,
                    iconBg: 'bg-rose-500/10 border-rose-200 dark:border-rose-800',
                    confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white',
                };
            case 'purple':
                return {
                    icon: <CheckCircle2 className="size-5 text-purple-600 dark:text-purple-400" />,
                    iconBg: 'bg-purple-500/10 border-purple-200 dark:border-purple-800',
                    confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white',
                };
            case 'amber':
                return {
                    icon: <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />,
                    iconBg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
                    confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
                };
            case 'emerald':
            default:
                return {
                    icon: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />,
                    iconBg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
                    confirmButton: 'bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600',
                };
        }
    };

    const styles = getVariantStyles();

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-6">
                <div className="flex items-start gap-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}>
                        {styles.icon}
                    </div>
                    <div className="space-y-1.5 pt-0.5">
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {description}
                        </DialogDescription>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="text-xs h-9 px-4 font-medium"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`text-xs h-9 px-4 font-semibold ${styles.confirmButton}`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
