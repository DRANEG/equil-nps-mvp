// Îmbunătățire progresivă a sondajului: dacă nu e semnal, răspunsul se salvează
// pe telefon și pleacă singur când revine conexiunea. Fără JavaScript, formularul
// funcționează normal prin POST.
(function () {
  var CHEIE = 'equil-nps-coada';
  var CACHE = 'equil-nps-v2'; // acelasi nume ca in sw.js

  function coada() {
    try {
      return JSON.parse(localStorage.getItem(CHEIE) || '[]');
    } catch (e) {
      return [];
    }
  }

  function salveaza(lista) {
    try {
      localStorage.setItem(CHEIE, JSON.stringify(lista));
    } catch (e) {
      /* memoria plină sau mod privat: mergem mai departe */
    }
  }

  function trimite(date) {
    return fetch('/api/raspunsuri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date),
    }).then(function (r) {
      if (!r.ok && r.status >= 500) throw new Error('server');
      return r;
    });
  }

  function goleste() {
    var lista = coada();
    if (!lista.length) return;
    var ramase = [];
    var pasi = lista.map(function (date) {
      return trimite(date).catch(function () {
        ramase.push(date);
      });
    });
    Promise.all(pasi).then(function () {
      salveaza(ramase);
    });
  }

  window.addEventListener('online', goleste);
  goleste();

  var form = document.querySelector('form[data-sondaj]');
  if (!form) return;

  // La prima vizita, service worker-ul inca nu controla pagina, deci nu a putut
  // sa o retina. O punem noi in cache, ca a doua scanare sa mearga si fara semnal.
  if ('caches' in window) {
    caches.open(CACHE).then(function (c) {
      c.add(location.href).catch(function () {});
    }).catch(function () {});
  }

  form.addEventListener('submit', function (e) {
    var date = {};
    new FormData(form).forEach(function (valoare, cheie) {
      date[cheie] = valoare;
    });
    if (!date.score) return; // lăsăm validarea browserului să ceară nota

    e.preventDefault();
    var buton = form.querySelector('button[type=submit]');
    if (buton) {
      buton.disabled = true;
      buton.textContent = 'Se trimite…';
    }

    trimite(date)
      .then(function () {
        window.location.href = '/multumim?scor=' + encodeURIComponent(date.score);
      })
      .catch(function () {
        // Fără semnal: păstrăm răspunsul și îl trimitem mai târziu.
        var lista = coada();
        lista.push(date);
        salveaza(lista);
        window.location.href = '/multumim?scor=' + encodeURIComponent(date.score) + '&offline=1';
      });
  });
})();
