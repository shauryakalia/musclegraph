"use client";
import { Fragment, memo } from "react";
import { JOINTS } from "@/lib/anatomy";
import { REGIONS, type Exercise } from "@/lib/types";
import { uniq } from "@/lib/model";
import { AddButton, Thumb } from "./bits";
import { useActions, useEnv } from "./context";

export interface ListGroup { title: string; items: Exercise[] }

interface Props {
  hidden: boolean; session: string; qRaw: string; muscle: string | null; joint: string | null;
  groups: ListGroup[]; picks: string[];
}

/** Search, body-area chips, muscle/joint filter and the grouped exercise list. */
export const Catalog = memo(function Catalog(p: Props) {
  const { model, v, gender } = useEnv();
  const act = useActions();
  const EX = model.exercises;
  const chips = [{ id: "all", name: "All", n: EX.length }].concat(
    model.data.categories.map((c) => ({ id: c.id, name: c.name, n: EX.filter((e) => e.category === c.id).length })),
  );
  const selValue = p.muscle || (p.joint ? "j:" + p.joint : "");

  return (
    <div id="catalog" hidden={p.hidden}>
      <div className="cat-head">
        <h2 className="sec-title">Exercises</h2>
        <label className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input id="q" type="search" placeholder="Search exercises" autoComplete="off" aria-label="Search exercises" value={p.qRaw} onChange={(ev) => act.setQuery(ev.target.value)} />
        </label>
        <div className="chips">
          {chips.map((c) => (
            <button key={c.id} className="chip" type="button" aria-pressed={p.session === c.id} onClick={() => act.setSession(c.id)}>
              {c.name}<b>{c.n}</b>
            </button>
          ))}
        </div>
        <div className="filter-row">
          <label className="sel">
            <span>{v.adv ? "Filter" : "Muscle"}</span>
            <select aria-label="Filter by muscle" value={selValue} onChange={(ev) => { const val = ev.target.value; if (val.indexOf("j:") === 0) act.setJoint(val.slice(2)); else act.setMuscle(val || null); }}>
              <option value="">{v.adv ? "All muscles and joints" : "All muscle groups"}</option>
              {REGIONS.map((r) => {
                const ids = Object.keys(v.units).filter((k) => v.units[k].region === r && EX.some((e) => v.trains(e, k)));
                return ids.length ? (
                  <optgroup key={r} label={r}>{ids.map((k) => <option key={k} value={k}>{v.units[k].name}</option>)}</optgroup>
                ) : null;
              })}
              {v.adv && (
                <optgroup label="Joints">{Object.keys(JOINTS).map((j) => <option key={j} value={"j:" + j}>{JOINTS[j].name}</option>)}</optgroup>
              )}
            </select>
          </label>
          <button className="clear" type="button" hidden={!(p.muscle || p.joint)} onClick={act.clearFilter}>Clear</button>
        </div>
      </div>
      <div id="list">
        {p.groups.length ? (
          p.groups.map((g) => (
            <Fragment key={g.title}>
              <div className="grp"><h3>{g.title}</h3><span>{g.items.length}</span></div>
              {g.items.map((e) => <Card key={e.id} e={e} muscle={p.muscle} picked={p.picks.indexOf(e.id) >= 0} picks={p.picks} gender={gender} />)}
            </Fragment>
          ))
        ) : (
          <div className="empty">No exercises match. Try clearing the search or filter.</div>
        )}
      </div>
    </div>
  );
});

function Card({ e, muscle, picked, picks, gender }: { e: Exercise; muscle: string | null; picked: boolean; picks: string[]; gender: "male" | "female" }) {
  const { v } = useEnv();
  const act = useActions();
  const sc = muscle ? v.X(e)[muscle] || 0 : 0;
  const pool = v.P(e).length ? v.P(e) : v.S(e).slice(0, 2);
  return (
    <div className={"exrow" + (picked ? " picked" : "")} data-row={e.id}>
      <button className="ex" type="button" data-id={e.id} onClick={() => act.openDetail(e.id)}>
        <Thumb e={e} gender={gender} />
        <span className="ex-t">
          <span className="ex-n">{e.name}</span>
          <span className="ex-v">{e.variant}</span>
          <span className="tags">
            {e.kind && <span className="tag kind">{e.kind}</span>}
            {uniq(pool.map(v.uShort)).slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
          </span>
        </span>
        {muscle && (sc >= 4 ? <span className="role pri">Primary</span> : <span className="role sec">Secondary</span>)}
      </button>
      <AddButton id={e.id} size="sm" picks={picks} />
    </div>
  );
}
