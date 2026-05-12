'use client';

/**
 * Avatar primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/avatar
 *
 * Composable: Avatar + AvatarImage + AvatarFallback.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

interface AvatarContextValue {
  hasImage: boolean;
  setHasImage: (v: boolean) => void;
}
const AvatarContext = React.createContext<AvatarContextValue | null>(null);

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: AvatarSize;
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  function Avatar({ className, size = 'md', children, ...rest }, ref) {
    const [hasImage, setHasImage] = React.useState(false);
    return (
      <AvatarContext.Provider value={{ hasImage, setHasImage }}>
        <span
          ref={ref}
          className={cn(
            'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/8 font-mono uppercase tracking-wider text-white/85',
            sizeClasses[size],
            className
          )}
          {...rest}
        >
          {children}
        </span>
      </AvatarContext.Provider>
    );
  }
);
Avatar.displayName = 'Avatar';

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  function AvatarImage({ className, src, alt, onLoad, onError, ...rest }, ref) {
    const ctx = React.useContext(AvatarContext);
    const [loaded, setLoaded] = React.useState(false);

    if (!src) return null;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt={alt ?? ''}
        className={cn('h-full w-full object-cover', !loaded && 'opacity-0', className)}
        onLoad={(e) => {
          setLoaded(true);
          ctx?.setHasImage(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          ctx?.setHasImage(false);
          onError?.(e);
        }}
        {...rest}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  AvatarFallbackProps
>(function AvatarFallback({ className, children, ...rest }, ref) {
  const ctx = React.useContext(AvatarContext);
  // Hide fallback when image is loaded.
  if (ctx?.hasImage) return null;
  return (
    <span
      ref={ref}
      className={cn('inline-flex items-center justify-center', className)}
      {...rest}
    >
      {children}
    </span>
  );
});
AvatarFallback.displayName = 'AvatarFallback';
