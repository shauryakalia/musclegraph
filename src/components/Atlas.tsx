"use client";
/* The whole interactive atlas. It lives in the root layout so it stays mounted while the URL moves
 * between "/" and "/exercises/<id>/"; the URL decides which exercise is open, so every exercise has a
 * real, prerendered page and the browser back button works. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { JOINTS } from "@/lib/anatomy";
import { bestMatch, buildModel, cat, exercisePath, idFromPath, makeView, uniq } from "@/lib/model";
import type { AtlasData, Gender, Level } from "@/lib/types";
import { useReducedMotion } from "./bits";
import { Catalog, type ListGroup } from "./Catalog";
import { Compare } from "./Compare";
import { ActionsCtx, EnvCtx, PaintCtx, type Actions, type Env, type Mode, type Paint } from "./context";
import { Detail } from "./Detail";
import { Figs } from "./Figures";
import { Readout } from "./Readout";

interface UiState {
  mode: Mode; level: Level; gender: Gender;
  session: string; qRaw: string; muscle: string | null; joint: string | null;
  picks: string[];
  hover: string | null; hoverJ: string | null; tap: string | null; tapJ: string | null;
  ca: string; cb: string;
  hl: string | null; flash: { u: string; n: number; scroll: boolean } | null;
}

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
// useLayoutEffect warns during server rendering; this runs only in the browser anyway
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Atlas({ data, children }: { data: AtlasData; children?: ReactNode }) {
  const model = useMemo(() => buildModel(data), [data]);
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

  /* ----- which exercise is open: follows the URL, updated instantly on click ----- */
  const routeId = idFromPath(pathname);
  const routeSel = routeId && model.byId[routeId] ? routeId : null;
  const [sel, setSel] = useState<string | null>(routeSel);
  useEffect(() => { setSel(routeSel); }, [routeSel]);

  const [st, setSt] = useState<UiState>(() => {
    const ids = model.exercises.map((e) => e.id);
    return {
      mode: "browse", level: "basic", gender: "male", session: "all", qRaw: "", muscle: null, joint: null, picks: [],
      hover: null, hoverJ: null, tap: null, tapJ: null,
      ca: ids.indexOf("back-squat") >= 0 ? "back-squat" : ids[0],
      cb: ids.indexOf("leg-press") >= 0 ? "leg-press" : ids[Math.min(1, ids.length - 1)],
      hl: null, flash: null,
    };
  });
  const stRef = useRef(st), selRef = useRef(sel);
  stRef.current = st;
  selRef.current = sel;
  const set = useCallback((patch: Partial<UiState> | ((s: UiState) => Partial<UiState>)) =>
    setSt((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);

  /* saved body type and detail level (read after hydration so server and client HTML match) */
  useEffect(() => {
    const g = store.get("atlas-gender"), l = store.get("atlas-level");
    set({ gender: g === "female" ? "female" : "male", level: l === "advanced" ? "advanced" : "basic" });
  }, [set]);

  /* ----- scrolling after renders ----- */
  const pending = useRef<{ panel?: "detail" | "mode"; restore?: string }>({});
  const scrollPanelIfNeeded = (always: boolean) => {
    const el = panelRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || (always && window.innerWidth < 900)) window.scrollTo({ top: window.scrollY + top - 12, behavior: "auto" });
  };
  useIsoLayoutEffect(() => {
    const p = pending.current;
    if (p.panel) { scrollPanelIfNeeded(p.panel === "detail"); p.panel = undefined; }
    if (p.restore && !sel) {
      const c = document.querySelector<HTMLElement>('.ex[data-id="' + p.restore + '"]');
      if (c) { c.scrollIntoView({ block: "center" }); c.focus({ preventScroll: true }); }
      p.restore = undefined;
    }
  });

  const v = useMemo(() => makeView(model, st.level), [model, st.level]);

  /* ----- actions ----- */
  const actions = useMemo<Actions>(() => {
    const smooth = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
    const open = (id: string, scroll = true) => {
      setSel(id);
      set({ hover: null, hoverJ: null });
      if (scroll) pending.current.panel = "detail";
      router.push(exercisePath(id), { scroll: false });
    };
    const close = (restore: boolean) => {
      const was = selRef.current;
      setSel(null);
      if (restore && was) pending.current.restore = was;
      router.push("/", { scroll: false });
    };
    const setMode = (m: Mode) => {
      set({ mode: m, hover: null, tap: null, hoverJ: null, tapJ: null, hl: null, flash: null });
      pending.current.panel = "mode";
    };
    const setMuscle = (u: string | null) => {
      set((s) => ({ muscle: u, joint: u ? null : s.joint }));
      if (selRef.current) close(false);
    };
    const setJoint = (j: string | null) => {
      set((s) => ({ joint: j, muscle: j ? null : s.muscle }));
      if (selRef.current) close(false);
    };
    const toCompare = (a: string, b: string) => { set({ ca: a, cb: b, picks: [] }); setMode("compare"); };
    const unitOf = (m: string) => makeView(model, stRef.current.level).unitOf(m);

    return {
      setGender(g) { if (g === stRef.current.gender) return; set({ gender: g }); store.set("atlas-gender", g); },
      setLevel(l) {
        if (l === stRef.current.level) return;
        set((s) => ({ level: l, muscle: null, hover: null, tap: null, hoverJ: null, tapJ: null, hl: null, flash: null, joint: l === "basic" ? null : s.joint }));
        store.set("atlas-level", l);
      },
      setMode(m) {
        const s = stRef.current;
        if (m === s.mode) return;
        if (m === "compare") {
          if (s.picks.length === 1) set({ ca: s.picks[0], cb: bestMatch(model, s.picks[0]) });
          set({ picks: [] });
        }
        setMode(m);
      },
      setSession(s) { set({ session: s }); },
      setQuery(raw) { set({ qRaw: raw }); },
      setMuscle,
      setJoint,
      clearFilter() { set({ joint: null }); setMuscle(null); },
      openDetail(id) { open(id); },
      closeDetail(restore) { close(restore); },
      togglePick(id) {
        const picks = stRef.current.picks.slice(), i = picks.indexOf(id);
        if (i >= 0) picks.splice(i, 1); else picks.push(id);
        if (picks.length >= 2) toCompare(picks[0], picks[1]);
        else set({ picks });
      },
      clearPicks() { set({ picks: [] }); },
      compareNow() { const a = stRef.current.picks[0]; if (a) toCompare(a, bestMatch(model, a)); },
      compareClosest(id) { toCompare(id, bestMatch(model, id)); },
      setCompare(slot, id) { set(slot === "a" ? { ca: id, tap: null, tapJ: null, hl: null, flash: null } : { cb: id, tap: null, tapJ: null, hl: null, flash: null }); },
      swapCompare() { set((s) => ({ ca: s.cb, cb: s.ca, tap: null, hl: null, flash: null })); },
      hover(kind, id) {
        const s = stRef.current;
        if (id == null) {
          if ((kind === "muscle" && s.hover) || (kind === "joint" && s.hoverJ)) set({ hover: null, hoverJ: null });
          return;
        }
        if (kind === "joint") { set({ hoverJ: id, hover: null }); return; }
        const u = unitOf(id);
        if (u) set({ hover: u, hoverJ: null });
      },
      pickOnMap(kind, id, fromMini) {
        const s = stRef.current, compare = s.mode === "compare";
        if (kind === "joint") {
          set({ hoverJ: null });
          if (compare) { set({ tapJ: id, tap: null }); return; }
          setJoint(s.joint === id && !selRef.current ? null : id);
        } else {
          const u = unitOf(id);
          if (!u) return;
          set({ hover: null });
          if (compare) {
            set((x) => ({ tap: u, tapJ: null, hl: u, flash: { u, n: (x.flash?.n || 0) + 1, scroll: !fromMini && window.innerWidth >= 900 } }));
            return;
          }
          setMuscle(s.muscle === u && !selRef.current ? null : u);
        }
        if (fromMini) panelRef.current?.scrollIntoView({ behavior: smooth(), block: "start" });
      },
      tapRow(u) { set({ tap: u, tapJ: null, hl: u }); },
      highlight(u) { if (stRef.current.hl !== u) set({ hl: u }); },
      scrollToPanel() { panelRef.current?.scrollIntoView({ behavior: smooth(), block: "start" }); },
    };
  }, [model, router, set]);

  /* Escape closes the open exercise */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape" && selRef.current && stRef.current.mode === "browse") actions.closeDetail(true); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [actions]);

  /* ----- derived view state ----- */
  const env = useMemo<Env>(() => ({ model, v, gender: st.gender, level: st.level, reduceMotion }), [model, v, st.gender, st.level, reduceMotion]);
  const cmp = st.mode === "compare";

  const paint = useMemo<Paint>(() => {
    const cls: Record<string, string> = {};
    if (cmp) {
      const A = v.X(model.byId[st.ca]), B = v.X(model.byId[st.cb]);
      Object.keys(v.units).forEach((u) => { const a = A[u] || 0, b = B[u] || 0; cls[u] = a || b ? "c" + cat(a, b) : "dim"; });
    } else if (sel) {
      const e = model.byId[sel];
      v.P(e).forEach((u) => (cls[u] = "pri"));
      v.S(e).forEach((u) => (cls[u] = "sec"));
    } else if (st.muscle) cls[st.muscle] = "pri";
    let activeJoints: string[] = [];
    if (v.adv) {
      if (cmp) activeJoints = uniq(model.byId[st.ca].joints.concat(model.byId[st.cb].joints));
      else if (sel) activeJoints = model.byId[sel].joints;
      else if (st.joint) activeJoints = [st.joint];
    }
    return { cls, hl: st.hl, activeJoints };
  }, [cmp, v, model, st.ca, st.cb, st.muscle, st.joint, st.hl, sel]);

  const groups = useMemo<ListGroup[]>(() => {
    const q = st.qRaw.trim().toLowerCase();
    const jName = (j: string) => JOINTS[j]?.name ?? j;
    const muscles = new Map(model.data.muscles.map((m) => [m.id, m]));
    const groupName = new Map(model.data.groups.map((g) => [g.id, g.name]));
    const matches = (e: (typeof model.exercises)[number]) => {
      if (q) {
        const hay = (e.name + " " + e.variant + " " + (e.kind || "") + " " +
          Object.keys(e.scores).map((m) => (muscles.get(m)?.short || "") + " " + (groupName.get(model.groupOf[m] || "") || "")).join(" ") + " " +
          e.joints.map(jName).join(" ")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      if (st.muscle && !v.trains(e, st.muscle)) return false;
      if (st.joint && e.joints.indexOf(st.joint) < 0) return false;
      if (st.session !== "all" && e.category !== st.session) return false;
      return true;
    };
    const EX = model.exercises;
    if (st.muscle) {
      const m = st.muscle;
      return [{ title: "Trains " + v.uShort(m).toLowerCase(), items: EX.filter(matches).sort((a, b) => (v.X(b)[m] || 0) - (v.X(a)[m] || 0)) }];
    }
    if (st.joint) return [{ title: jName(st.joint), items: EX.filter(matches).sort((a, b) => (b.kind ? 1 : 0) - (a.kind ? 1 : 0)) }];
    const cats = st.session === "all" ? model.data.categories : model.data.categories.filter((c) => c.id === st.session);
    return cats.map((c) => ({ title: c.name, items: EX.filter((e) => e.category === c.id && matches(e)) })).filter((g) => g.items.length);
  }, [model, v, st.qRaw, st.muscle, st.joint, st.session]);

  const order = useMemo(() => uniq(groups.flatMap((g) => g.items.map((e) => e.id))), [groups]);
  const selEx = sel ? model.byId[sel] : null;
  const i = sel ? order.indexOf(sel) : -1;
  const prev = i > 0 ? model.byId[order[i - 1]] : null;
  const next = i >= 0 && i < order.length - 1 ? model.byId[order[i + 1]] : null;
  const showTray = !cmp && st.picks.length > 0;

  return (
    <EnvCtx.Provider value={env}>
      <ActionsCtx.Provider value={actions}>
        <PaintCtx.Provider value={paint}>
          <div className={"wrap" + (showTray ? " has-tray" : "")} id="app" data-level={st.level}>
            {children}
            <header className="top">
              <div>
                <div className="kicker">Strength training reference</div>
                <h1>Exercise <span>Atlas</span></h1>
                <p className="lede">Pick an exercise to see how it&apos;s done and which muscles it trains, tap any muscle to find the exercises that hit it, or compare two exercises muscle by muscle.</p>
              </div>
              <dl className="stats">
                <div><dt>Exercises</dt><dd>{model.exercises.length}</dd></div>
                <div><dt>Body areas</dt><dd>{model.data.categories.length}</dd></div>
                <div><dt>{v.adv ? "Muscles" : "Muscle groups"}</dt><dd>{Object.keys(v.units).length}</dd></div>
              </dl>
            </header>

            <main className="layout">
              <section className="map card" aria-label="Muscle map">
                <div className="map-top">
                  <h2 className="sec-title">Muscle map</h2>
                  <div className="legend">
                    {cmp ? (<><span><i className="sw c0" />A harder</span><span><i className="sw c3" />Even</span><span><i className="sw c6" />B harder</span></>)
                      : (<><span><i className="sw pri" />Primary</span><span><i className="sw sec" />Secondary</span></>)}
                    {v.adv && <span><i className="sw jt-sw" />Joint</span>}
                  </div>
                </div>
                <Figs pfx="m" />
                <Readout mode={st.mode} hover={st.hover} hoverJ={st.hoverJ} tap={st.tap} tapJ={st.tapJ} sel={sel} muscle={st.muscle} joint={st.joint} ca={st.ca} cb={st.cb} />
              </section>

              <section className="panel card" id="panel" ref={panelRef}>
                <div className="toggles">
                  <div className="tg"><span>Body</span>
                    <div className="seg sm" role="group" aria-label="Body type">
                      {(["male", "female"] as const).map((g) => <button key={g} type="button" aria-pressed={st.gender === g} onClick={() => actions.setGender(g)}>{g === "male" ? "Male" : "Female"}</button>)}
                    </div>
                  </div>
                  <div className="tg"><span>Detail</span>
                    <div className="seg sm" role="group" aria-label="Level of detail">
                      {(["basic", "advanced"] as const).map((l) => <button key={l} type="button" aria-pressed={st.level === l} onClick={() => actions.setLevel(l)}>{l === "basic" ? "Basic" : "Advanced"}</button>)}
                    </div>
                  </div>
                </div>
                <div className="modebar">
                  <div className="seg" role="group" aria-label="Mode">
                    {(["browse", "compare"] as const).map((m) => <button key={m} type="button" aria-pressed={st.mode === m} onClick={() => actions.setMode(m)}>{m === "browse" ? "Browse" : "Compare"}</button>)}
                  </div>
                </div>
                <Catalog hidden={cmp || !!selEx} session={st.session} qRaw={st.qRaw} muscle={st.muscle} joint={st.joint} groups={groups} picks={st.picks} />
                {!cmp && selEx && <Detail e={selEx} prev={prev} next={next} picks={st.picks} />}
                {cmp && <Compare ca={st.ca} cb={st.cb} flash={st.flash} />}
              </section>
            </main>

            {showTray && (
              <div className="tray" role="status" aria-live="polite">
                <b className="badge a">A</b>
                <span className="tray-name">{model.byId[st.picks[0]]?.name}</span>
                <span className="tray-msg">Add one more to compare</span>
                <button type="button" className="tray-go" onClick={actions.compareNow}>Compare now</button>
                <button type="button" className="tray-x" aria-label="Clear compare selection" onClick={actions.clearPicks}>×</button>
              </div>
            )}
            <p className="foot-note">Form demos are simplified loops of the start and end positions; use &quot;Watch a video demo&quot; for real footage. Primary and secondary muscles follow typical EMG and training research and shift with technique, grip and stance.</p>
          </div>
        </PaintCtx.Provider>
      </ActionsCtx.Provider>
    </EnvCtx.Provider>
  );
}
