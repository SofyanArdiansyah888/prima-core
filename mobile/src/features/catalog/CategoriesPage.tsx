import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import type { CatalogCategory } from '../../domain/types';
import { ErrorText, NavBar, Screen } from '../../shared/ui';
import { CategoryGlyph } from './HomePage';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.categories()
      .then((response) => {
        if (active) setCategories(response.data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Kategori gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen header={<NavBar title="Semua Kategori" backHref="/tabs/home" />}>
      <div className="space-y-2 bg-slate-50 p-4">
        <ErrorText>{error}</ErrorText>
        {loading ? <p className="text-xs text-slate-500">Memuat kategori…</p> : null}
        {!loading && categories.length === 0 && !error ? (
          <p className="text-xs text-slate-500">Belum ada kategori.</p>
        ) : null}
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => navigate(`/tabs/home?kategori=${category.slug}`)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#d91424]">
              <CategoryGlyph type={category.slug} className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900">{category.name}</span>
              <span className="text-[11px] text-slate-500">{category.default_unit}</span>
            </span>
            <IonIcon icon={chevronForwardOutline} className="shrink-0 text-base text-slate-400" />
          </button>
        ))}
      </div>
    </Screen>
  );
}
