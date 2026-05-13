/**
 * Marketing landing component barrel re-export.
 *
 * Authored by Calliope (Wave 1). Page composition imports from a single
 * entry so Wave 2 / Hestia / Pan can swap pieces without churning the page
 * file. Trinity art primitives are also exported because Hestia (Entry page,
 * Wave 1) may re-use the same SVG for the resident introduction grid.
 */
export { MarketingShell } from './MarketingShell';
export { MarketingThemeLock } from './MarketingThemeLock';
export { HeroSection } from './HeroSection';
export { TrinitySection } from './TrinitySection';
export { SprintSection } from './SprintSection';
export { ModesSection } from './ModesSection';
export { ResidentsSection } from './ResidentsSection';
export { TechStackSection } from './TechStackSection';
export { CloserSection } from './CloserSection';
export { ShyCreature } from './ShyCreature';
export { TowerPOV } from './TowerPOV';
export { TrinityCode, TrinityResidents, TrinityCity } from './TrinityArt';
export { MODES, RESIDENTS, MODE_GLYPHS, RESIDENT_PORTRAITS } from './data';
export type { ModeCopy, ResidentCopy } from './data';
