# Verifica della versione 0.1.0 — 5 novembre 2026

## Completato

- Compilazione Rollup: superata, plugin.js e plugin.min.js prodotti.
- Controllo Svelte/TypeScript: zero errori, zero warning.
- Sei test automatici: tutti superati (classe/regata errate, duplicati, coordinate impossibili/future, dati zero, tracce ordinate, antimeridiano, finestra temporale, HTML escaping, estrattore IMOCA con fixture).
- Pagina ufficiale aperta nel browser: caricamento della regata e della classifica osservato.

## Non verificato

- Raccolta completa in Chromium: il download del browser Playwright in questo ambiente restituisce un archivio vuoto/non valido. Il raccoglitore non ha quindi prodotto una flotta live verificata. `data/fleet.json` resta intenzionalmente vuoto: il plugin segnala dati non disponibili.
- Funzionamento dentro Windy, resa su telefoni e tablet e ciclo apri/chiudi: da provare con account e hosting Windy.
- Pubblicazione: richiede repository reale e chiave Windy Plugins API.
- App native: supporto generale introdotto da Windy v49; accesso del plugin privato non garantito, indicazioni Windy richiedono approvazione per app native.
- Permesso di ripubblicazione dei dati e limiti del provider: da chiarire con il titolare.

Questa è una prima implementazione compilata, non una release live già installabile. Il workflow di raccolta deve essere eseguito con successo prima di pubblicare.
