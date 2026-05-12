'use client';

/**
 * AssigneeAvatar: GitHub username + avatar fallback initial.
 *
 * Authored by Persephone (Wave 2).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface AssigneeAvatarProps {
  githubLogin: string | null;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

function initial(login: string | null): string {
  if (!login) return '?';
  const stripped = login.replace(/^@/, '');
  return stripped.slice(0, 2).toUpperCase();
}

export function AssigneeAvatar({
  githubLogin,
  avatarUrl,
  size = 'sm',
  showLabel = true,
  className,
}: AssigneeAvatarProps) {
  if (!githubLogin) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[10px] text-white/40',
          className
        )}
      >
        <Avatar size={size}>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        {showLabel ? <span className="font-mono">unassigned</span> : null}
      </span>
    );
  }

  const handle = githubLogin.startsWith('@') ? githubLogin : `@${githubLogin}`;
  const githubUrl = `https://github.com/${githubLogin.replace(/^@/, '')}`;

  return (
    <a
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] text-white/75 hover:text-white',
        className
      )}
    >
      <Avatar size={size}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={`Avatar for ${handle}`} />
        ) : null}
        <AvatarFallback>{initial(githubLogin)}</AvatarFallback>
      </Avatar>
      {showLabel ? <span className="font-mono">{handle}</span> : null}
    </a>
  );
}

AssigneeAvatar.displayName = 'AssigneeAvatar';
