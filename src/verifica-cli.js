// Punctul de intrare pentru `npm run verifica`.
import { openDb } from './db.js';
import { verificaConfiguratie, verificaMediu, verificaDate, rezumat, scrieRaport } from './verifica.js';

const rapoarte = [verificaMediu(process.env), verificaConfiguratie(process.env)];

try {
  rapoarte.push(verificaDate(openDb()));
} catch (err) {
  rapoarte.push({ blocante: [{ titlu: 'Nu pot deschide baza de date', detaliu: err.message }], atentionari: [], bune: [] });
}

const raport = rezumat(...rapoarte);
console.log('Verificare înainte de lansare — Equil NPS');
scrieRaport(raport);
process.exit(raport.blocante.length ? 1 : 0);
