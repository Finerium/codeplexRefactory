/**
 * Public barrel for shadcn-pattern primitives.
 *
 * Authored by Persephone (Wave 2). Consumers import from `@/components/ui`.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

export { Button, type ButtonProps } from './button';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
export { Badge, type BadgeProps } from './badge';
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  type AvatarProps,
  type AvatarImageProps,
  type AvatarFallbackProps,
} from './avatar';
export { ScrollArea, type ScrollAreaProps } from './scroll-area';
export { Input, Textarea, type InputProps, type TextareaProps } from './input';
export { Separator, type SeparatorProps } from './separator';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from './tabs';
