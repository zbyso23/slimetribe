# SlimeTribe — Phase 11.5 · Adventure jako začátek hry

**Mobilní rozložení:** souboj má kompaktní karty, stav tahu v krátké liště a příkazy ve spodní řadě. Běžná nápověda nezakrývá scénu; jmenovky jednotek na telefonu nahrazují malé proužky zdraví. Podrobnosti zdraví a pohybu zůstávají u vybrané postavy, celý přehled je v Družině. Mobilní kamera rámuje bojiště do prostoru mimo ovládání a stejná matice se používá pro výběr dotykem. Adventure má menší cílový panel a skryté překrývající se světové jmenovky.

**Dotyková oprava:** herní texty, jmenovky, ikony a šipky mají zakázané označování a Safari touch callout. Dlouhé podržení ovládacího prvku neotevírá kontextovou nabídku hry. Textová pole editorů si zachovávají běžné psaní a výběr.

**Opravený začátek:** intro po dokončení i přeskočení předá okamžitě ovládání Adventure. Žádný povinný potvrzovací dialog ani automatický boj. Projdi okolí, promluv přes E s uprchlíky a se Seren; teprve pak se můžeš u označené hlídky vědomě připojit k obraně přes E. Pouhý příchod na její místo boj nespustí. V této části neběží žádný časový limit a neodečítají se záchranné kroky.

Nový začátek spustíš přes **Nová hra**. Starší uložené výpravy pokračují ve svém dosavadním bodě a nevracejí se před již rozehranou bitvu.

Hráčské rozhraní dostalo jednotný fantasy vzhled, jasnější hierarchii a nové praktické nástroje. Hratelný obsah zůstává Q01 → Q02 → Q03. Toto vydání nepřidává další kapitolu ani nemění bojové statistiky.

**Vydané HTML otevři přímo přes `file://`.** Žádná instalace, server, CDN ani Three.js. Všechny modely, materiály, písně, syntezátor, ikony i styly jsou uvnitř. Pro hraní nepotřebuješ rozbalovat zdrojový ZIP.

## Co je nové

- **Hlavní nabídka:** samostatná obrazová a ovládací část, výrazné pokračování/nová hra, informace o rozehrané kapitole. Dílna je vedlejší vstup; otevření nové hry při rozehrané výpravě nejprve nabídne možnost zůstat u ní.
- **Původní modely v UI:** malé portréty vznikají projekcí skutečných morph meshů. Nejde o nové postavy, obrázky z internetu ani náhradu herních modelů. Projekce se ukládá do cache a respektuje XYZ kalibraci.
- **Adventure:** čitelný aktuální úkol a směr, menší mapa, kontextová interakce, stav družiny a přímý vstup do jejího přehledu. Tipy ovládání lze skrýt; cíle a interakce zůstávají.
- **Battle:** portréty, oddělené zdraví a mana, jasně vybraná postava a hotová akce, samostatná oblast příkazů. Klik na spojence / zem / nepřítele stále vybírá / přesouvá / útočí. Žádné přepínače Pohyb/Útok.
- **Dialogy:** výrazný mluvčí, samostatné možnosti bez předvolené etické odpovědi. Enter na zaměřeném tlačítku aktivuje právě jeho; mimo možnosti sám nevybírá první odpověď. Čísla 1–3 fungují dál. Porovnání Q03 má oddělené karty zdrojů a vodítko nahoře.
- **Deník (J):** aktuální cíl a poslední události bez jednotlivých debug záznamů zranění.
- **Družina:** všechny čtyři postavy, aktuální zdraví/mana a stručné vysvětlení jejich rolí.
- **Nastavení:** skutečná hlasitost syntetizátoru, větší text, vyšší kontrast, omezení animací a volitelné rychlé tipy. Předvolby cestují s uloženým projektem.
- **Dotyk:** kompaktní lišta, větší ovládací plochy a pohybový panel; tažení prstem v adventure pohledu otáčí kameru. Vícedotykový pohyb a otáčení mají oddělené pointer ID. Zrušení dotyku kameru uvolní.

Deník, nastavení a přehled družiny pozastaví hru i zvuk. Návrat obnoví stejný stav; otevření nastavení z již pozastavené nabídky samo hru nespustí. Okna lze mezi sebou přepnout horní lištou nebo zavřít křížkem či Esc. Na úzké obrazovce najdeš Nastavení a Ovládání v Nabídce.

## Ovládání

| Oblast | Vstup |
|---|---|
| Průzkum | WASD / šipky / dotykový panel |
| Kamera v průzkumu | pravé tlačítko a tažení / tažení prstem; C vrátí pohled za postavu |
| Objekt / rozhovor | E nebo kontextové tlačítko |
| Souboj | klik na spojence, volné pole, nepřítele |
| Jednotky / schopnosti | 1–4, Tab další; H léčení, K kouzlo |
| Vyčkat / konec tahu | mezerník / Enter, pokud klávesnici nepoužívá konkrétní tlačítko |
| Deník | J nebo ikona knihy |
| Okna / pauza | Esc nebo Nabídka |

Nastavení omezení pohybu se týká animací rozhraní; nezastavuje animace postav ani nemění rychlost hry. Systémové `prefers-reduced-motion` platí vždy. Čitelnost je podpořená explicitními texty, názvy ikon a viditelným keyboard fokusem; stav postavy není označený pouze barvou.

## Zdrojová struktura a kompatibilita

`src/player.css` obsahuje hráčský styl a breakpointy. `build.py` jej vloží přímo do runtime při sestavení HTML; žádné CSS se za běhu nestahuje. `src/game/game.player.js` vlastní nabídku, hráčský HUD, deník, družinu, nastavení a klávesnici. Q03 doplňuje vlastní obsah přes dosavadní `game.quest.q03.ui.js`. Nevzniká další konkurenční hráčský HUD.

Původní `Game.Adventure`, `Game.Battle`, `Game.Scene`, `Game.Save`, `monstersList` a editorová API zůstávají. Herní stav má stejné schéma. Volitelné předvolby jsou v `PRJ.playerUI` s vlastní verzí 1 a validací; starší projekty bez tohoto pole používají výchozí hodnoty.

Editory zůstávají v Dílně; tato fáze přepracovává především hráčskou vrstvu, nikoli všechny vnitřní formuláře editorů. Vzorové mapy, scénáře, cutscény a Eldor audio nástroje zůstávají dostupné. Podrobnosti kampaně a dosavadní omezení Q03 jsou v `docs/Q03-0.11.md` a předchozím `docs/Q03-Release-0.11.md`. Q04 se zatím nehraje.

## Ověření

```sh
python3 build.py
python3 tests/run.py --native --gpu
```

Nové UI testy ověřují skutečné události ovládání, hlasitost, předvolby/save/load, ochranu rozehrané výpravy, pauzu, modal priority, dotykové otáčení/zrušení a explicitní příběhové volby. Dosavadní test přehraje Q01 → Q02 → Q03 přes nové rozhraní včetně skutečných bitev s běžnou AI. Výsledky a logy jsou v `tests`.

DOM/Canvas a mock WebGL nejsou skutečný browserový playtest. Chromium zde prostředí blokuje; rozložení v konkrétním prohlížeči a ruční pocit z ovládání proto zůstávají k ověření. Samostatné shaderové testy skutečně kompilují a rasterizují GLSL přes Mesa EGL. Vývojové závislosti patří pouze testům; hra je samostatné vanilla JS HTML.
