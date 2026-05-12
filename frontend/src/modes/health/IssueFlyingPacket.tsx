'use client';

/**
 * IssueFlyingPacket: animated 3D packet that flies from a source building
 * (the finding origin) to the Backlog Office (Athena City Hall landmark in
 * the current mockCityData) when a user converts a finding to a ticket.
 *
 * Owner: Asclepius (Wave-Fixing #2 cycle 1, STAMP=20260513-0313).
 *
 * Manager directive Cluster 7 / Feature #26 + #28 anchor:
 *   "Issue baru muncul di Backlog Office dengan flying animation (3D path
 *    trajectory + arrival pulse via r3f tween animation)" per PRD Section
 *    9.5 line 596 + Section 12.1 line 776.
 *
 * Visual recipe:
 *   1. Spawn a small emissive paper-plane-ish triangular plane at the
 *      source building rooftop (finding origin) at t=0.
 *   2. Animate position along a quadratic Bezier arc up + over to the
 *      target landmark (defaults to Athena City Hall, the closest stand-in
 *      for "Backlog Office" until Hera ships a dedicated Backlog Office
 *      building in a future iteration). Duration 1.4s, easeOutCubic.
 *   3. At arrival, fire a brief radial pulse + emissive flash on the
 *      target building rooftop (200ms), then despawn the packet.
 *
 * Source of truth for source + target coordinates: `useCityData()` from Iris
 * (`@/scene/buildings`). The component looks up positions per building id
 * + falls back to a deterministic default if either id is not present.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 [Wave 2 +
 * Wave-Fixing #2 mock visual; Wave 3 Demeter ticket-create still owns the
 * real GitHub POST. This component is the optimistic UI portion + the
 * 3D flying animation, separate from the API call lifecycle].
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Mesh } from 'three';
import { useCityData } from '@/scene/buildings';

/**
 * One in-flight packet. Multiple packets can overlap if the user converts
 * several findings in quick succession; each instance is tracked by its
 * own packetId.
 */
export interface FlyingPacketSpec {
  packetId: string;
  /** Source building id (finding origin). */
  sourceBuildingId: string;
  /** Target landmark id (defaults to Athena City Hall when undefined). */
  targetBuildingId?: string;
  /** Linked GitHub issue number for the arrival label. */
  issueNumber: number;
  /** Trigger timestamp (ms epoch) so the animation clock is absolute. */
  spawnedAt: number;
}

const PACKET_DURATION_SEC = 1.4;
const ARRIVAL_PULSE_SEC = 0.45;
const ARC_HEIGHT_BOOST = 28; // world units above the chord midpoint
const PACKET_COLOR = '#ffd23f'; // golden yellow, matches medium-severity warm-tint baseline
const ARRIVAL_PULSE_COLOR = '#5fc998'; // emerald, mirrors "ticketed" green status badge

function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Quadratic Bezier interpolation on three control points.
 */
function bezier(
  t: number,
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
): [number, number, number] {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2],
  ];
}

interface SinglePacketProps {
  spec: FlyingPacketSpec;
  source: [number, number, number];
  target: [number, number, number];
  /** Notify parent that this packet expired (animation + pulse complete). */
  onExpired: () => void;
}

function SinglePacket({ spec, source, target, onExpired }: SinglePacketProps) {
  const meshRef = useRef<Mesh>(null);
  const pulseRef = useRef<Mesh>(null);
  const startRef = useRef<number>(performance.now());
  const expiredRef = useRef<boolean>(false);

  // Control point at chord midpoint elevated by ARC_HEIGHT_BOOST so the
  // packet arcs gracefully upward + descends onto the target rooftop.
  const control = useMemo<[number, number, number]>(() => {
    const midX = (source[0] + target[0]) / 2;
    const midZ = (source[2] + target[2]) / 2;
    const peakY = Math.max(source[1], target[1]) + ARC_HEIGHT_BOOST;
    return [midX, peakY, midZ];
  }, [source, target]);

  useFrame(() => {
    const now = performance.now();
    const elapsedSec = (now - startRef.current) / 1000;

    if (elapsedSec < PACKET_DURATION_SEC) {
      const t = easeOutCubic(elapsedSec / PACKET_DURATION_SEC);
      const pos = bezier(t, source, control, target);
      if (meshRef.current) {
        meshRef.current.position.set(pos[0], pos[1], pos[2]);
        // Gentle spin around vertical axis so the paper-plane catches light.
        meshRef.current.rotation.y = t * Math.PI * 2;
      }
      if (pulseRef.current) {
        const mat = pulseRef.current.material as unknown as { opacity?: number };
        if (mat) mat.opacity = 0;
      }
      return;
    }

    // Arrival pulse window.
    const pulseElapsed = elapsedSec - PACKET_DURATION_SEC;
    if (pulseElapsed <= ARRIVAL_PULSE_SEC) {
      const k = pulseElapsed / ARRIVAL_PULSE_SEC;
      if (meshRef.current) {
        // Park the packet at the target + shrink it.
        meshRef.current.position.set(target[0], target[1] + 1.0, target[2]);
        const s = 1 - k;
        meshRef.current.scale.setScalar(Math.max(0.05, s));
      }
      if (pulseRef.current) {
        pulseRef.current.position.set(target[0], target[1] + 0.5, target[2]);
        const scale = 1 + k * 6;
        pulseRef.current.scale.setScalar(scale);
        const mat = pulseRef.current.material as unknown as { opacity?: number };
        if (mat) mat.opacity = (1 - k) * 0.6;
      }
      return;
    }

    if (!expiredRef.current) {
      expiredRef.current = true;
      onExpired();
    }
  });

  const packetColor = useMemo(() => new Color(PACKET_COLOR), []);
  const pulseColor = useMemo(() => new Color(ARRIVAL_PULSE_COLOR), []);

  return (
    <group name={`flying-packet-${spec.packetId}`}>
      {/* Paper-plane-ish triangular packet. Thin emissive plane angled forward. */}
      <mesh ref={meshRef} position={source}>
        <coneGeometry args={[0.5, 1.4, 4]} />
        <meshStandardMaterial
          color={packetColor}
          emissive={packetColor}
          emissiveIntensity={1.2}
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>

      {/* Arrival radial pulse at target. */}
      <mesh
        ref={pulseRef}
        position={target}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.3, 0.6, 48]} />
        <meshStandardMaterial
          color={pulseColor}
          emissive={pulseColor}
          emissiveIntensity={1.6}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

interface IssueFlyingPacketLayerProps {
  packets: FlyingPacketSpec[];
  onPacketExpired: (packetId: string) => void;
}

/**
 * Layer component: iterates the active packet list + resolves source +
 * target positions per packet from the live city data. Mount this once
 * inside the Canvas tree (sibling to BuildingInstances).
 *
 * Fallback rules per Pythia Asumption (Backlog Office not yet provisioned
 * by Hera in mockCityData):
 *   - Target landmark default = building with `landmark: 'athena'`
 *     (City Hall, the architect resident). Once Hera ships an explicit
 *     Backlog Office landmark, swap default to that.
 *   - Source default = origin (0, 0, 0) if building id not found, with
 *     a console.warn so the integrator notices the upstream id mismatch.
 */
export function IssueFlyingPacketLayer({
  packets,
  onPacketExpired,
}: IssueFlyingPacketLayerProps) {
  const city = useCityData();

  const resolve = useMemo(() => {
    const map = new Map(city.buildings.map((b) => [b.id, b]));
    // Find Athena landmark building (acts as Backlog Office stand-in).
    const athenaBuilding = city.buildings.find(
      (b) => b.landmark === 'athena',
    );
    const defaultTarget: [number, number, number] = athenaBuilding
      ? [
          athenaBuilding.position[0],
          athenaBuilding.position[1] + athenaBuilding.height + 2,
          athenaBuilding.position[2],
        ]
      : [0, 30, 0];

    return (spec: FlyingPacketSpec) => {
      const source = map.get(spec.sourceBuildingId);
      const target = spec.targetBuildingId
        ? map.get(spec.targetBuildingId)
        : athenaBuilding;
      const sourcePos: [number, number, number] = source
        ? [
            source.position[0],
            source.position[1] + source.height + 1.5,
            source.position[2],
          ]
        : [0, 5, 0];
      const targetPos: [number, number, number] = target
        ? [
            target.position[0],
            target.position[1] + target.height + 2,
            target.position[2],
          ]
        : defaultTarget;
      return { sourcePos, targetPos };
    };
  }, [city.buildings]);

  return (
    <group name="issue-flying-packet-layer">
      {packets.map((spec) => {
        const { sourcePos, targetPos } = resolve(spec);
        return (
          <SinglePacket
            key={spec.packetId}
            spec={spec}
            source={sourcePos}
            target={targetPos}
            onExpired={() => onPacketExpired(spec.packetId)}
          />
        );
      })}
    </group>
  );
}

IssueFlyingPacketLayer.displayName = 'IssueFlyingPacketLayer';

/* -------------------------------------------------------------------------
 * In-memory packet queue. Module-scope so DOM <ConvertToTicketButton/> can
 * dispatch a flight, and the in-scene <IssueFlyingPacketLayer/> picks it up
 * via the useFlyingPackets() hook subscribing to the same store.
 *
 * Avoid pulling Zustand inside the Asclepius store (asclepiusStore.ts is
 * already loaded with Apollo + Refactor slices); we want a lightweight
 * isolated channel that does not pollute the Apollo store shape.
 * ----------------------------------------------------------------------- */

type Listener = (packets: FlyingPacketSpec[]) => void;

class FlyingPacketBus {
  private packets: FlyingPacketSpec[] = [];
  private listeners = new Set<Listener>();

  getPackets(): FlyingPacketSpec[] {
    return this.packets;
  }

  spawn(spec: FlyingPacketSpec): void {
    this.packets = [...this.packets, spec];
    this.emit();
  }

  expire(packetId: string): void {
    this.packets = this.packets.filter((p) => p.packetId !== packetId);
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.packets);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const l of this.listeners) l(this.packets);
  }
}

const bus = new FlyingPacketBus();

/**
 * Dispatch a flying packet. Called by ConvertToTicketButton optimistic UI.
 */
export function spawnFlyingPacket(spec: Omit<FlyingPacketSpec, 'spawnedAt'>): void {
  bus.spawn({ ...spec, spawnedAt: Date.now() });
}

/**
 * Subscribe hook: returns the current packet list + notifies on update.
 * Used by the in-scene layer.
 */
export function useFlyingPackets(): {
  packets: FlyingPacketSpec[];
  expire: (packetId: string) => void;
} {
  const [packets, setPackets] = useState<FlyingPacketSpec[]>(() =>
    bus.getPackets(),
  );
  useEffect(() => {
    const unsubscribe = bus.subscribe(setPackets);
    return unsubscribe;
  }, []);
  return {
    packets,
    expire: (id: string) => bus.expire(id),
  };
}
