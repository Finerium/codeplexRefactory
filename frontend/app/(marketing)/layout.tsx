import { MarketingThemeLock } from '../../components/marketing/MarketingThemeLock';
import './marketing.css';

/**
 * Marketing route group layout. Authored by Calliope (Wave 1).
 *
 * Daedalus owns the root `app/layout.tsx` which boots dark mode (Canvas
 * default for the production city scene at `/city`). The marketing route
 * group at `/` must lock to light mode per Revision 1. The strategy:
 *   1. Import `marketing.css` which contains the full ported bundle styles
 *      (palette, typography, sections). Selectors are scoped via :root so
 *      Tailwind base + bg-codeplex-void from Daedalus globals get
 *      overridden inside the marketing route only.
 *   2. Mount a tiny client component `MarketingThemeLock` that sets
 *      `document.documentElement.dataset.mode = 'day'` plus
 *      `colorScheme: 'light'` on mount, and reverts on unmount. This keeps
 *      the dark mode home for `/city` clean.
 *
 * Wave 2 Persephone city layout at `/city` keeps its own parallel route
 * scaffolding; marketing layout never touches it.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingThemeLock />
      {children}
    </>
  );
}
