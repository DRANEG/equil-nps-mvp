// Limitator simplu, in memorie: o fereastra glisanta per cheie (de obicei IP-ul).
// Nu avem nevoie de Redis pentru o instalare pe un singur server.
export function createLimiter({ max, windowMs, name = 'limita' }) {
  const hits = new Map();

  const curata = (now) => {
    for (const [key, times] of hits) {
      const recente = times.filter((t) => now - t < windowMs);
      if (recente.length) hits.set(key, recente);
      else hits.delete(key);
    }
  };

  return {
    name,
    // Inregistreaza o incercare si spune daca s-a depasit limita.
    hit(key, now = Date.now()) {
      if (hits.size > 5000) curata(now); // plafon de memorie
      const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
      times.push(now);
      hits.set(key, times);
      const depasit = times.length > max;
      return {
        ok: !depasit,
        ramase: Math.max(0, max - times.length),
        retryAfterSec: depasit ? Math.ceil((windowMs - (now - times[0])) / 1000) : 0,
      };
    },
    // Verifica fara sa consume o incercare.
    check(key, now = Date.now()) {
      const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
      return { ok: times.length < max, ramase: Math.max(0, max - times.length) };
    },
    reset(key) {
      if (key === undefined) hits.clear();
      else hits.delete(key);
    },
    size() {
      return hits.size;
    },
  };
}

// IP-ul clientului. In spatele unui reverse proxy (Caddy, Nginx) adresa reala
// vine in X-Forwarded-For, dar antetul poate fi falsificat de oricine daca nu
// esti chiar in spatele propriului proxy -- de aceea e nevoie de TRUST_PROXY=1.
export function clientIp(req, { trustProxy = process.env.TRUST_PROXY === '1' } = {}) {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const primul = String(forwarded).split(',')[0].trim();
      if (primul) return primul;
    }
  }
  return req.socket?.remoteAddress || 'necunoscut';
}
