'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { SendHorizonal, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { MarkdownMessage } from '@/components/markdown-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export function CopilotSidebar() {
  const t = useTranslations('Dashboard.copilot');
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: `${BACKEND_URL}/api/chat` }),
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!isBusy) {
      inputRef.current?.focus();
    }
  }, [isBusy]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
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
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[90%] rounded-lg px-3 py-2',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {message.parts.map((part, i) =>
                  part.type === 'text' ? <MarkdownMessage key={i} text={part.text} /> : null
                )}
              </div>
            ))}
            {isBusy && <p className="text-xs text-muted-foreground">{t('thinking')}</p>}
            {error && <p className="text-xs text-destructive">{t('error')}</p>}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-1"
          disabled={isBusy}
        />
        <Button type="submit" size="icon" disabled={draft.trim().length === 0 || isBusy}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
