// Regulile standard NPS: 0-6 detractori, 7-8 pasivi, 9-10 promotori.

export const CATEGORIES = ['detractor', 'passive', 'promoter'];

export function categorize(score) {
  if (!isValidScore(score)) {
    throw new RangeError(`Scor NPS invalid: ${score}`);
  }
  const n = Number(score);
  if (n <= 6) return 'detractor';
  if (n <= 8) return 'passive';
  return 'promoter';
}

export function isValidScore(score) {
  // Atentie: Number(null), Number('') si Number([]) dau 0, deci nu ne bazam doar pe conversie.
  if (typeof score !== 'number' && typeof score !== 'string') return false;
  if (typeof score === 'string' && score.trim() === '') return false;
  const n = Number(score);
  return Number.isInteger(n) && n >= 0 && n <= 10;
}

// Primeste o lista de raspunsuri ({ score }) si intoarce indicatorii agregati.
export function summarize(responses) {
  const distribution = Array.from({ length: 11 }, () => 0);
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let sum = 0;

  for (const r of responses) {
    if (!isValidScore(r.score)) continue;
    const score = Number(r.score);
    distribution[score] += 1;
    sum += score;
    const cat = categorize(score);
    if (cat === 'promoter') promoters += 1;
    else if (cat === 'passive') passives += 1;
    else detractors += 1;
  }

  const total = promoters + passives + detractors;
  const pct = (n) => (total === 0 ? 0 : (n / total) * 100);
  // NPS-ul se raporteaza ca numar intreg intre -100 si +100.
  const nps = total === 0 ? null : Math.round(pct(promoters) - pct(detractors));

  return {
    total,
    promoters,
    passives,
    detractors,
    promoterPct: round1(pct(promoters)),
    passivePct: round1(pct(passives)),
    detractorPct: round1(pct(detractors)),
    nps,
    average: total === 0 ? null : round1(sum / total),
    distribution,
  };
}

// Marja de eroare (95%) pentru NPS, utila cand esantionul e mic.
// Formula standard pe varianta scorurilor -1 / 0 / +1.
export function marginOfError(summary) {
  const { total, promoters, detractors } = summary;
  if (total < 2) return null;
  const p = promoters / total;
  const d = detractors / total;
  const mean = p - d;
  const variance = p + d - mean * mean;
  return round1(196 * Math.sqrt(variance / total)); // 1.96 * sd * 100
}

export function label(nps) {
  if (nps === null) return 'fără date';
  if (nps >= 50) return 'excelent';
  if (nps >= 20) return 'bun';
  if (nps >= 0) return 'de îmbunătățit';
  return 'critic';
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
