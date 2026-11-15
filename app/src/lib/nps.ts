// Calculul Net Promoter Score.
// 0-6 detractori, 7-8 pasivi, 9-10 promotori. NPS = %promotori - %detractori, in [-100, 100].

export type Category = "DETRACTOR" | "PASSIVE" | "PROMOTER";

export function categoryOf(score: number): Category {
  if (score <= 6) return "DETRACTOR";
  if (score <= 8) return "PASSIVE";
  return "PROMOTER";
}

export interface NpsSummary {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  /** null cand nu exista raspunsuri */
  nps: number | null;
}

export function summarize(scores: number[]): NpsSummary {
  const total = scores.length;
  let promoters = 0, passives = 0, detractors = 0;
  for (const s of scores) {
    const c = categoryOf(s);
    if (c === "PROMOTER") promoters++;
    else if (c === "PASSIVE") passives++;
    else detractors++;
  }
  const nps = total === 0 ? null : Math.round(((promoters - detractors) / total) * 100);
  return { total, promoters, passives, detractors, nps };
}

export const CATEGORY_LABEL: Record<Category, string> = {
  DETRACTOR: "Detractor",
  PASSIVE: "Pasiv",
  PROMOTER: "Promotor",
};
