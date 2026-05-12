/**
 * Dashboard route entry. Server Component delegating to DashboardClient.
 *
 * Authored by Selene (Wave 1). Wave 1 ships mock data; Wave 3 Demeter
 * `/api/dashboard` swap is transparent to this page (the swap happens inside
 * `useDashboardData` hook).
 *
 * Per `selene.md` Section 9 example composition.
 */

import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return <DashboardClient />;
}
