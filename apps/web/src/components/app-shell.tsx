import { useTranslations } from 'next-intl';

import { CopilotSidebar } from '@/components/copilot-sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ResizableSidebar } from '@/components/resizable-sidebar';
import { WarehouseTabs } from '@/components/warehouse-tabs';

export function AppShell() {
  const t = useTranslations('Dashboard');

  return (
    <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <LanguageSwitcher />
        </div>
        <WarehouseTabs />
      </main>

      <ResizableSidebar>
        <CopilotSidebar />
      </ResizableSidebar>
    </div>
  );
}
