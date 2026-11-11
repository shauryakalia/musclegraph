"use client";
import { createContext, useContext } from "react";
import type { Model, ViewHelpers } from "@/lib/model";
import type { Gender, Level } from "@/lib/types";

export type Mode = "browse" | "compare";

/** Changes only when the body type, detail level or motion preference changes. */
export interface Env {
  model: Model;
  v: ViewHelpers;
  gender: Gender;
  level: Level;
  reduceMotion: boolean;
}

/** What the muscle maps should show right now. */
export interface Paint {
  /** unit id → "pri" | "sec" | "c0".."c6" | "dim" */
  cls: Record<string, string>;
  /** unit outlined because a compare row is hovered or tapped */
  hl: string | null;
  activeJoints: string[];
}

/** Everything the UI can do. The object is stable for the life of the page. */
export interface Actions {
  setGender(g: Gender): void;
  setLevel(l: Level): void;
  setMode(m: Mode): void;
  setSession(s: string): void;
  setEquip(e: string): void;
  setSkill(l: string): void;
  setQuery(raw: string): void;
  setMuscle(u: string | null): void;
  setJoint(j: string | null): void;
  clearFilter(): void;
  openDetail(id: string): void;
  closeDetail(restoreFocus: boolean): void;
  togglePick(id: string): void;
  clearPicks(): void;
  compareNow(): void;
  compareClosest(id: string): void;
  setCompare(slot: "a" | "b", id: string): void;
  swapCompare(): void;
  /** hover over a muscle or joint on a map (null to clear) */
  hover(kind: "muscle" | "joint", id: string | null): void;
  /** click on a muscle or joint on a map */
  pickOnMap(kind: "muscle" | "joint", id: string, fromMini: boolean): void;
  /** a compare-table row was clicked */
  tapRow(u: string): void;
  highlight(u: string | null): void;
  scrollToPanel(): void;
}

export const EnvCtx = createContext<Env | null>(null);
export const PaintCtx = createContext<Paint>({ cls: {}, hl: null, activeJoints: [] });
export const ActionsCtx = createContext<Actions | null>(null);

export const useEnv = () => useContext(EnvCtx)!;
export const usePaint = () => useContext(PaintCtx);
export const useActions = () => useContext(ActionsCtx)!;
