'use client';

/**
 * PerformanceContext exposes the adaptive quality factor + regress flag to
 * scene children (Iris BuildingInstances primarily).
 *
 * Per Pythia contract Asumption #4: React Context, NOT Zustand. Performance
 * state is local to the scene tree, no need for cross-tree subscription.
 *
 * The provider lives inside Canvas tree (not outside) so children can read
 * via useThree if they want raw `state.performance.current`, or via the
 * lighter usePerformanceState hook for the public shape.
 */

import { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { PerformanceState } from './types';

const DEFAULT_STATE: PerformanceState = {
  qualityFactor: 1,
  regressing: false,
};

const PerformanceContext = createContext<PerformanceState>(DEFAULT_STATE);

/**
 * Public hook. Iris LOD logic calls this every render of BuildingInstances.
 * Returns default state when used outside Canvas (graceful degradation,
 * Iris can still render at full quality in storybook-style isolation).
 */
export function usePerformanceState(): PerformanceState {
  return useContext(PerformanceContext);
}

interface ProviderProps {
  qualityFactor: number;
  regressing: boolean;
  children: ReactNode;
}

/**
 * Provider used inside Canvas by Daedalus. External callers should NOT mount
 * this directly; use ChronicleCanvas which wires it up internally.
 */
export function PerformanceProvider({
  qualityFactor,
  regressing,
  children,
}: ProviderProps) {
  const value = useMemo<PerformanceState>(
    () => ({ qualityFactor, regressing }),
    [qualityFactor, regressing],
  );
  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Internal hook used by Canvas to derive the regressing boolean from raw
 * regress events. Maintains a 2-second debounce so brief camera nudges do
 * not constantly flap the flag.
 *
 * Returns [regressing, fireRegress] tuple.
 */
export function useRegressDebounce(debounceMs = 2000): [boolean, () => void] {
  const [regressing, setRegressing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function fireRegress() {
    setRegressing(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setRegressing(false);
      timeoutRef.current = null;
    }, debounceMs);
  }

  return [regressing, fireRegress];
}
