'use client';

import { SendHorizonal, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function CopilotSidebar() {
  const t = useTranslations('Dashboard.copilot');
  const [draft, setDraft] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Chat is not wired to the AI backend yet.
    setDraft('');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold">{t('title')}</h2>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
      </ScrollArea>

      <Separator />

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={draft.trim().length === 0}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
