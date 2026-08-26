import { useTranslations } from 'next-intl';

import { CopilotSidebar } from '@/components/copilot-sidebar';
import { WarehouseTabs } from '@/components/warehouse-tabs';

export function AppShell() {
  const t = useTranslations('Dashboard');

  return (
    <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>
        <WarehouseTabs />
      </main>

      <aside className="w-[380px] shrink-0 border-l">
        <CopilotSidebar />
      </aside>
    </div>
  );
}
