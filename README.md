# Regate per Windy · versione 0.1.0

Plugin originale per seguire una flotta su Windy. Prima configurazione: **Route du Rhum 2026, IMOCA**. Interfaccia italiana per telefono, tablet e desktop.

## Funzioni

- Elenco della classe scelta dal tracker ufficiale: ricerca per barca/skipper, preferiti, mostra/nascondi singoli concorrenti o tutti.
- Posizioni e tracce colorate, 24 ore / 7 giorni / complete, inquadratura della flotta.
- Dettaglio barca, classifica e velocità/distanze disponibili, apertura del meteo nella posizione GPS.
- Ora GPS distinta dal tempo delle previsioni Windy; dati vecchi evidenziati dopo 180 minuti.
- Aggiornamento nominale ogni 10 minuti; cache locale e conservazione dell'ultimo file valido in caso di errore.

## Configurazione

`config/race.json` contiene nome, ID, classe, URL ufficiale, intervalli e URL del JSON. Non occorre modificare l'elenco dei concorrenti a mano. Cambiando regata o classe occorre rieseguire raccolta e build. Il connettore attuale supporta la struttura Geovoile verificata nel codice del tracker Route du Rhum: altre piattaforme richiedono un nuovo connettore, non basta cambiare URL.

`config/distribution.json` contiene repository GitHub reale, autore e `private: true`. `src/pluginConfig.ts` è generato automaticamente dalla build. Senza repository il plugin usa il server locale; con repository pubblico legge `data/fleet.json` dal branch `main`. Per repository privati impostare `race.dataUrl` a un endpoint HTTPS pubblico con CORS; non inserire token nel plugin.

## Prova locale su Linux Mint

Richiede Node.js **24** e npm.

```bash
npm ci
npx playwright install --with-deps chromium
npm run collect
npm run check
npm test
npm start
```

Aprire `https://localhost:9999/plugin.js` nel proprio browser e accettare personalmente il certificato di sviluppo. In Windy web usare la modalità sviluppo/caricamento da URL in `https://www.windy.com/plugins`. Il server ascolta solo sul computer locale: questo indirizzo non è utilizzabile dagli amici o dal telefono. La verifica nelle app native richiede la distribuzione descritta sotto.

Il raccoglitore legge gli oggetti del tracker nella pagina ufficiale con Chromium. Se cambiano struttura, classe o disponibilità, fallisce senza sostituire il file precedente. Non usa il tracker personale di Milan Koláček. Nessuna posizione dimostrativa viene presentata come reale.

## Pubblicazione e prove con amici

1. Creare nel proprio GitHub un repository e caricare questa cartella, inclusi `.github/workflows`, escludendo `node_modules`. Il branch previsto è `main`.
2. Inserire URL reale del repository e autore in `config/distribution.json`.
3. Eseguire in Actions `update-fleet` e verificare il file dati. GitHub pianifica poi la raccolta nominalmente ogni 10 minuti: gli avvii possono ritardare e non sono un servizio in tempo reale. Nei repository pubblici inattivi i workflow pianificati possono essere disabilitati; nei privati controllare i minuti del piano.
4. Creare una chiave **Windy Plugins API** su `https://api.windy.com/keys`, salvarla solo nel secret GitHub `WINDY_API_KEY`.
5. Eseguire `publish-plugin`: compila, verifica e carica su hosting Windy; il risultato contiene l'URL da condividere. Ogni release richiede un numero versione superiore.
6. Ogni amico usa il proprio account Windy e l'app aggiornata. Prima verificare l'installazione tramite URL nel browser. Windy documenta plugin privati condivisibili, ma le indicazioni per app native richiedono plugin pubblicati e approvati: la sola pubblicazione privata non garantisce accesso Android/iOS. Per la revisione occorrono anche screenshot reale e richiesta sul forum, da effettuare dopo il test.

**Stato di questa consegna:** codice e workflow predisposti; nessun repository remoto creato, nessuna chiave configurata e nessun plugin pubblicato. Le prove su dispositivi reali Android/iOS restano da eseguire. Vedere `docs/VERIFICA.md` per gli esiti effettivi.

## Dati e licenze

Implementazione originale: il progetto GGR è riferimento funzionale, il suo codice non è incluso. Le dichiarazioni TypeScript provengono dal template Windy; vedere `THIRD_PARTY.md`. La licenza del plugin non concede diritti sui dati della regata. Non è stata verificata una concessione esplicita alla ripubblicazione automatica dei dati Geovoile/organizzatore: chiarirla prima della distribuzione del feed. Il connettore usa proprietà interne e può richiedere manutenzione. L'accessibilità pubblica della pagina non costituisce autorizzazione al riuso.

Documentazione Windy: https://docs.windy-plugins.com/getting-started/publishing-plugin.html
Supporto mobile: https://www.windy.com/articles/43511
