'use client';

/**
 * Tabs primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/tabs
 *
 * Composable: Tabs (root context) + TabsList + TabsTrigger + TabsContent.
 * Controlled by `value` + `onValueChange` prop on root.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (v: string) => void;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  function Tabs(
    { className, value, onValueChange, children, ...rest },
    ref
  ) {
    return (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={cn('flex flex-col gap-2', className)} {...rest}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function TabsList({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-codeplex-void/50 p-1 text-xs',
        className
      )}
      {...rest}
    />
  );
});
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(function TabsTrigger({ className, value, children, ...rest }, ref) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error('TabsTrigger must be used within Tabs');
  }
  const active = ctx.value === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'inline-flex h-7 items-center justify-center rounded-md px-2.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-white/10 text-white'
          : 'text-white/55 hover:text-white/85 hover:bg-white/5',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ className, value, ...rest }, ref) {
    const ctx = React.useContext(TabsContext);
    if (!ctx) {
      throw new Error('TabsContent must be used within Tabs');
    }
    if (ctx.value !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('focus-visible:outline-none', className)}
        {...rest}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';
