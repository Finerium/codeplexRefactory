/**
 * Public barrel for the buildings module.
 *
 * Consumer pattern (Wave 2 worker Hera):
 *   import {
 *     BuildingInstances,
 *     useCityData,
 *     useBuildingClick,
 *     useBuildingById,
 *   } from '@/scene/buildings';
 *
 * Schema-only imports (Wave 3 worker Demeter, Pandora):
 *   import type {
 *     BuildingData,
 *     DistrictData,
 *     CityData,
 *     BuildingArchetype,
 *   } from '@/scene/buildings';
 *
 * Re-export discipline: only stable surfaces. Archetype geometry builders +
 * mock data are intentionally NOT re-exported here, so consumers cannot
 * accidentally bypass BuildingInstances + couple to internal geometry. If a
 * future Wave 2 worker needs custom geometry mounting outside InstancedMesh
 * (e.g., Asclepius adding a single beacon point light on Hermes building),
 * they import the archetype builder directly with full path awareness.
 */

export { BuildingInstances } from './BuildingInstances';
export type { BuildingClickHandler, BuildingHoverHandler } from './BuildingInstances';
export {
  useCityData,
  useBuildingById,
  useBuildingClick,
  useBuildingClickDispatch,
  useBuildingHover,
  useBuildingHoverDispatch,
  useFloorFocus,
  useFloorFocusDispatch,
  useFloorHover,
  useFloorHoverDispatch,
} from './useCityData';
export type { FloorFocusEvent, FloorFocusHandler } from './useCityData';
export { HoverFloorGlow } from './HoverFloorGlow';
export { mockCityData } from './mockCityData';
export { squarifyTreemap, encodeHeight, deriveWindowTint, encodeFloors } from './layout';
export {
  deriveOwnerColor,
  djb2,
  parseCodeowners,
  resolveOwner,
  OWNERSHIP_PALETTE,
} from './ownership';
export type {
  BuildingArchetype,
  BuildingData,
  DistrictData,
  CityData,
  LandmarkSlot,
  WindowTint,
  TreemapNode,
  TreemapResult,
} from './types';
export type { CodeownersRule } from './ownership';
