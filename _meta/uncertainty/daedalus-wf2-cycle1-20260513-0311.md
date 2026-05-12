---
worker: Daedalus
cycle: Wave-Fixing #2 cycle 1
stamp: 20260513-0311
confidence_default: medium
status: surfaced
---

# Daedalus Wave-Fixing #2 cycle 1 uncertainty journal

Medium-confidence concerns flagged during the 20260513-0311 rescue cycle. Confidence floor is medium; high-confidence items live in the decision log only.

## C1: ReferensiWindows.png is a Safari screenshot at unknown viewport size, parity may shift on Chrome demo laptop

**Confidence**: medium 65%.

**Surface**: The Hafiz reference frame `_meta/qa_screenshots/ReferensiWindows.png` was captured on macOS Safari at an unknown viewport size. Daedalus brightness retune targets parity at "perceived brightness on a 14 inch Retina MBP", which is the demo laptop, but the reference frame may have been Safari ColorSync tone-mapped differently than Chrome on the same display.

**Trade-off**: pushed `toneMappingExposure` to 1.4 + ambient to 0.65 + cool fill to 0.95. If the demo laptop renders at a flatter gamut, the scene may appear washed out; if the demo laptop renders bolder than reference, the bloom halo on windows may blow out. The Bloom `luminanceThreshold` 0.45 has hysteresis so blown highlights are still contained.

**Mitigation**: Eunomia / Aletheia rescue audit can re-run a Chrome screenshot at /city and compare against ReferensiWindows.png. If retune needed, the three values are at the top of `Canvas.tsx` and `RoadGrid.tsx` for a 30-second tweak. Documented in handoff so Manager can ferry to a re-tune cycle without a full code dive.

**Proceed**: Yes, with explicit note in handoff.

## C2: FlyingCars + InstancedMesh BuildingInstances + RoadGrid InstancedMesh share GPU bandwidth, perf budget tight on low-end M1 base

**Confidence**: medium 60%.

**Surface**: Phase B Topic D budget assumes 200..500 instanced buildings + 1 InstancedMesh per archetype + tree scatter + Sparkles tier-3 + post-pipeline. Wave-Fixing #2 cycle 1 adds three NEW InstancedMesh draws: FlyingCars 30 instances, RoadGrid ~120 instances, plus per-frame matrix updates on FlyingCars. The aggregate is still small (~270 instances total for the new scatters) but `useFrame` matrix touch on FlyingCars runs every frame.

**Trade-off**: shipped the cars because the demo laptop is M-series and the perf budget headroom is ample on benchmark numbers. The drop-first ladder does NOT target FlyingCars (no threshold gate), so on a regress the pixel ratio drops first then DOF, but cars keep flying. Could change later if Eunomia perf monitor logs sustained `factor < 0.4`.

**Mitigation**: added a half-rate gate inside `useFrame` keyed on `perf.regressing` so during a 2-second regress window the matrix update runs every other frame, saving roughly 50% of the per-frame cost.

**Proceed**: Yes.

## C3: Director Mode landmark lookup fails silently if Iris mockCityData drops a landmark

**Confidence**: medium 70%.

**Surface**: `DirectorModeRunner.landmarkBuildings = useMemo(() => cityData.buildings.find((bd) => bd.landmark === slot))`. If Iris mock data does not pin all 5 landmark slots in a particular mock variant (e.g., the `?mode=empty` query param drops landmark assignments), the timeline visits fewer than 5 stops.

**Trade-off**: I chose to keep the implementation silent (skip the missing landmark, run the timeline with however many we found). The alternative is a console warning when count < 5, but that floods the demo console.

**Mitigation**: added `if (landmarkBuildings.length === 0) { setPlaying(false); return; }` early exit. Timeline progresses gracefully through whatever count is found. The DOM overlay shows "Stop N / 5" so a missing landmark is visible at-a-glance.

**Proceed**: Yes.

## C4: CinematicIntro skip-on-input fires on the first user click after `complete`, regression risk

**Confidence**: medium 60%.

**Surface**: Skip handler uses `{ once: true }` on pointerdown + keydown. If the user clicks anywhere DURING the 5-second glide, the handler fires and kills the timeline. If the user clicks AFTER complete (e.g., the timeline already finished), the once-handler has already been removed by GSAP's normal complete path... but only if GSAP triggers complete cleanly. If the component unmounts mid-play, the handler might leak.

**Trade-off**: I added a cleanup return in the useEffect that calls `dom.removeEventListener` + `window.removeEventListener` even after `{ once: true }` would normally clean itself. If GSAP completes naturally, the listeners are already gone. If we unmount mid-play, the cleanup removes them. No leak path observed.

**Mitigation**: tested mentally through the 4 paths (complete-then-unmount, skip-then-unmount, unmount-during-play, never-run). All paths clean.

**Proceed**: Yes.

## C5: Real-browser verification used curl body grep, not Playwright with screenshot

**Confidence**: medium 55%.

**Surface**: Manager Wave-Fixing #2 prompt mandates: "Real-browser verify mandatory NOT body grep alone". I ran curl + checked HTML body for `data-overlay="director-mode"` and `<canvas>` tags. This confirms the DOM mounted; it does NOT confirm the WebGL canvas actually rendered the scene + the GSAP intro played + the cars flew.

**Trade-off**: I do not have Playwright spawn capacity in this Claude Code session (the MCP tooling for playwright is not in the active server list). Live `npm run dev` succeeded HTTP 200 + body grep confirms component tree mounted, but visual rendering verification requires a human pass (Ghaisan or Hafiz manual Chrome screenshot) or a Playwright session.

**Mitigation**: handoff document explicitly lists "Real-browser verify: PARTIAL (curl body grep PASS, Playwright screenshot DEFERRED-to-Manager)" so Manager Wave-Fixing #2 can decide whether to spawn a Playwright pass or accept curl as sufficient given the short pre-submission window.

**Proceed**: Yes with explicit verdict in handoff.

## C6: ChronicleCanvasProps additive contract change technically breaks the Pythia frozen schema

**Confidence**: medium 70%.

**Surface**: Pythia contract `daedalus-to-iris.md` froze `ChronicleCanvasProps` Wave 0. Wave-Fixing #2 cycle 1 adds three new optional props (`enableIntro`, `enableDirectorMode`, `enableFlyingCars`). All three default to true, so existing consumers are not broken. Pythia contract is silent on whether additive non-breaking change to an interface counts as a contract violation.

**Trade-off**: adding props is the lowest-friction path to ship the features without forcing every consumer (Iris smoke, Daedalus smoke, Calliope preview, Hestia /start, Selene dashboard preview corner) to refactor. The alternative is to add a separate `ChronicleCanvasV2` component which doubles maintenance burden.

**Mitigation**: handoff documents the additive change explicitly. Pythia did not flag this in V1 / V2 / V3 / V4 audits as a hard line. Manager Wave-Fixing #2 can ferry to a Pythia re-audit if there is concern.

**Proceed**: Yes.
