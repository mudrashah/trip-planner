export type ModeKey = "flight" | "train" | "bus";
export type Budget = "Budget" | "Mid-range" | "Luxury";
export interface Opt { mode: ModeKey; op: string; cls: string; dep: string; arr: string; dur: string; p: number }

export const BUDGETS: Budget[] = ["Budget", "Mid-range", "Luxury"];
export const BUDGET_KEY: Record<Budget, "budget" | "mid" | "luxury"> = { Budget: "budget", "Mid-range": "mid", Luxury: "luxury" };
/** Minutes between consecutive stops on a day, used for the local-travel leg. */
export const HOP_MIN = [18, 25, 32, 15, 40, 22];
