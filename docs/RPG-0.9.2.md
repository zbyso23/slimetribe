# SlimeTribe — fáze 9.2: vstup, testovací adventure a XYZ kalibrace

Adventure má přímé ovládání Slizáka z třetí osoby. Perspektivní kamera sleduje postavu; pohyb je plynulý, má kruhové kolize, normovanou diagonálu a pevný simulační krok. Battle zůstává původní taktická tahová hra. Příběhové Q01/Q02, důsledky, generované střety a cutscény navazují na fázi 8.

Jediný výsledný HTML soubor otevři přes `file://`. Hra nepotřebuje instalaci, server, npm, Three.js, CDN ani síť. Zachovává původní čtyři modelové rodiny a procedurální textury, synth, tracker a SFX z Eldoru. Jediný dokument obsahuje také editory a čtyřpanelovou 2D diagnostiku.

## Opravy 9.2

- Opravená konkrétní regrese: `lostpointercapture` na herním canvasu mazalo i držené klávesy. Uvolnění kamery nyní ukončí pouze rozhlížení. Test na původní fázi 9.1 selže a na nové projde; očekávaný původní neúspěch je v `tests/repro-phase9.1.log`.
- Klávesnice funguje přes zachytávací listenery, fyzický `code` i náhradní `key`. Canvas lze explicitně zaměřit. Uvolnění klávesy, skrytí dokumentu, blur a opuštění hry správně uklidí vstup.
- **RPG · test bez scénáře** v liště spustí samostatnou testovací mapu bez automatických dialogů, časových oken a questů. Přepíše aktuální běh hry; rozpracovanou výpravu si před testem ulož. Jsou tu pevné překážky, E interakce, pramen a jedno generované setkání pro test návratu z battle.
- V herním pohledu jsou trvalá tlačítka pro držený pohyb myší/touch. Nepřekreslují se s panelem při vstupu do další buňky. Jejich pointer stav je nezávislý na klávesnici.
- Ukazatel pod tlačítky zobrazuje držené vstupy, průběžné souřadnice, pauzu, dialog, konec kapitoly, blokovaný směr a případnou runtime chybu. `SlimeTribe.rpg.diagnostics()` nabízí stejná data pro rozbor. Chyby se neskrývají před běžným browserovým logem.
- Nový start Q02 míří do mapy směrem k táboru. Pokud by výchozí směr měl méně než dvě volné buňky, použije se volnější směr; uložená kamera se nemění.
- **Modely → XYZ rotation offset · kalibrace**: nezávislý lokální offset X/Y/Z v rozsahu −180 až 180°, reset, uložení projektu a HTML export. Pořadí je X → Y → Z před natočením a umístěním postavy do světa. Nuly zachovávají dosavadní vzhled, včetně battle. Dřívější automatický RPG základ −90° se nemění; dodatečný Y offset jej může kompenzovat.
- Offsety jsou zvlášť pro čtyři původní rodiny a platí shodně pro nativní render i CPU diagnostiku. Nemění kolize, jednotkové statistiky ani logický směr chůze. Nastavení je volitelná `project.modelCalibration`, staré projekty fungují bez ní.

Pro ověření chůze nejprve použij tlačítko **RPG · test bez scénáře**, drž W nebo šipku na obrazovce a sleduj, že souřadnice průběžně klesá. Kamera v testu míří dopředu do mapy. Adventure v horní liště označuje editor; běžící mapa je pod **Hra**. Hra nadále používá současnou plochu 12 × 10, nejde o nový velký svět.

## Opravy 9.1

- Obnovená korekce těla MD2 o −90°, kterou původní `MD2CharacterComplex.js` používal na samotném meshi. Slizák v adventure má čelo ve směru pohybu, nikoli bok. Výchozí kamera vidí záda.
- Natočení postavy se ukládá odděleně od orbitální kamery; vydrží uložení, návrat z bitvy a změnu pohledu. Starší save fáze 9 bez něj zůstávají čitelné.
- **C / Za postavu** vrátí kameru za aktuální směr postavy bez pohybu či příběhového kroku.
- Směr při skluzu podél stěny vychází ze skutečného posunu. Numericky nulový posun nespouští běh. Dialog, blur a pauza zastaví animaci pohybu.
- Kamera má explicitní režim adventure / battle / cutscene; testy ověřují prioritu i přirozený konec cutscény a přesný návrat RPG kamery. Filmové záběry cutscén se zachovávají; široký záběr neznamená přepnutí pravidel na battle. V nativním pohledu je cutscéna označena ve statusu.

## Ovládání

| Vstup | Adventure |
|---|---|
| W / šipka nahoru | Dopředu vzhledem ke kameře |
| S / šipka dolů | Dozadu |
| A, D / šipky vlevo, vpravo | Do stran vzhledem ke kameře |
| Pravé tlačítko + tažení | Otočení a sklon kamery |
| Kolečko | Vzdálenost kamery |
| C / tlačítko Za postavu | Kamera za aktuální směr Slizáka |
| E / mezerník / tlačítko Použít | Objekt na aktuálním místě |
| Vstup do setkání | Automatický přechod do battle |

Minimapa drží sever nahoře. Bílá šipka ukazuje směr kamery, šedá překážky, žlutá objekty, tyrkysová prameny a červená nevyřešená setkání. Kliknutí do 3D adventure již nezadává cestu. V battle zůstává výběr jednotky, pohybu a cílů klikáním.

Načtení HTML otevře výcvikovou mapu. Pro příběh spusť nahoře **▶ Q01 · Zelená hráz**, nebo **Test Q02 · neutrální start**. Nová hra používá mapu připravenou v editoru. Ve 2D diagnostice fungují stejné klávesy a stejné herní události; pohledy zůstávají shora, z boku, zepředu a debug.

## Příběh a přesuny

- Každý vstup do sousední logické buňky zachová původní `Game.Adventure.arrive`. Q01 počítá kroky záchranného okna a Q02 mění kořeny stejnými pravidly jako dříve.
- Kamera, stání, dialog ani cutscéna kroky nespotřebovávají. Návrat přes hranici buňky je další krok.
- Objekty vyžadují E. Ventily, důkaz, uprchlíky, tábor, místní, svědka a uzly tak lze používat vědomě. Původní programové API pohybu zůstává pro kompatibilitu dostupné.
- Při setkání se zachová přesná průběžná pozice a kamera. Po vítězství se družina vrátí na stejné místo s výslednými HP/manou.
- Checkpointy vracejí postavu do středu výchozí buňky checkpointu; orientace kamery zůstává. Obnova nepadá na zastaralé souřadnici RPG pozice.
- Uložení projektu a export HTML obsahují přesnou pozici a kameru. Staré save bez RPG dat se otevřou ve středu jejich původní buňky.
- Ztráta zaměření okna, opuštění hry, pauza a blokující dialog ruší držené ovládání. Klávesnice nepřebírá psaní do formulářů.

## Rozsah této fáze

Jde o první propojení Genesis způsobu hraní se současnou kampaní. Stávající autorské mapy mají nadále logickou plochu 12 × 10. Nový 3D pohled kreslí souvislý rovný terén s procedurálním materiálem, skalní překážky, příběhové rekvizity a značky objektů. Nejde ještě o velký výškový svět 4096 × 4096 z původního záměru Genesis.

Původní Genesis zdrojáky určily styl ovládání a kamery; jejich Three.js, jQuery, loader externích modelů a bitmapový heightmap runtime se nepřebírají. Dodaný archiv neměl odkazované modely, terénní PNG ani textury. Výškové mapy, větší světy, jejich editor a plný původní sběr/inventář/XP jsou další práce, nikoli funkce tohoto vydání. Q03 zůstává teaser.

## Struktura a API

- `src/game/game.adventure.rpg.js`: čistá pravidla pohybu, kolize, kamera, serializace a validace. `Game.Adventure.RPG` a stejný objekt `SlimeTribe.rpg`.
- `src/game/game.adventure.rpg.ui.js`: vstupní události, vizuální postava, minimapa a nativní render adventure.
- `Game.Adventure`, `Game.Battle`, `Game.Scene`, `Game.Save`, `Game.Quest`, `Game.Quest.Q02`, katalog jednotek i dosavadní editační API zůstávají rozpoznatelné.
- Nová volitelná `adventure.rpg` ukládá `{version:1,x,z,yaw,pitch,distance,facing?}`. Buňky `adventure.hero.x/y` zůstávají celá čísla. Pravidla a renderer mají oddělený stav.
- `RPG.update(dt,{forward,strafe})` používá pevný krok 1/120 s, rychlost 2.4 buňky/s, poloměr 0.16, kruh proti čtvercovým kolizím a oddělené osy. Velká mezera v čase je omezena na 0.25 s.
- `getPose`, `turn`, `camera`, `fits`, `interact`, `resetClock` jsou dostupné pro testy a další rozvoj. Čtení kamery nepostupuje hru.

## Testy a reprodukce

```sh
python3 build.py
python3 tests/run.py
# Volitelný skutečný Canvas raster s již dostupným @napi-rs/canvas:
python3 tests/run.py --native
```

Build je pouze vývojový balicí skript; uživatel spouští hotové HTML. Node je potřeba pouze k vývojovým testům. `CODEX_PRIMARY_RUNTIME_NODE` může určit jeho cestu; nativní Canvas hledá modul v `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

Čtrnáct sad testuje modely, DSP, základní battle, editor, scénáře, cutscény, Q01, Q02, přenos kampaně, nová RPG pravidla orientaci MD2, kalibraci a celé HTML ve dvou variantách integračního harnessu. RPG zahrnuje:

- celý RAF řetězec při držení klávesy přes čtyři buňky, opakované překreslování panelu, ztrátu pointer capture, myší/touch šipky, viditelnou chybu a restart testu;
- kalibraci XYZ proti nezávislým geometrickým očekáváním, zachování výchozí matice, uložení, HTML export, reset a atomické odmítnutí vadného importu;
- geometrii směru modelu ve 32 kombinacích kamery/pohybu, migraci starších save, návrat kamery za postavu a přirozený konec cutscény;
- shodný celý uložený stav při 30/60/120 FPS, normovanou diagonálu, stěny, okraje a zákaz průchodu rohem;
- výslovnou E interakci, jednorázový pramen, skutečně odehraný generovaný boj a návrat na přesnou pozici;
- Q01 ventil, tlak, checkpoint a automatický přenos do Q02 s archivovanou RPG pozicí;
- celou Q02 přes plynulý pohyb/E, obranný boj, tři uzly, CARE a checkpoint uzlů;
- poškozené save, staré save, kamerový boom, skutečně registrované klávesové/myší handlery, blur, pauzu, vstupní formuláře a přepnutí rendereru;
- software raster kontroly perspektivní kamery a MD2 geometrie, plus skutečné Canvas vykreslení tří diagnostických pohledů.

`tests/results.json` a logy obsahují výsledky vydání. Skupiny kontrol nejsou měřením řádkového/větvového pokrytí. DOM harness, mock WebGL a software raster nenahrazují prohlížeč. Skutečné browserové WebGL a poslech nebyly v tomto prostředí ověřeny; Chromium zde nelze spustit kvůli omezení socketů.
