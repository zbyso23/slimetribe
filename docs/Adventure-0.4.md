# Historická reference předchozí fáze 0.4

# SlimeTribe Adventure 0.4

Otevři HTML v `dist` dvojklikem. Výchozí záložka **Adventure editor** je hlavní autorská mapa; **Hra** přepíná adventure a battle. Runtime je vanilla JS a vlastní render Eldoru, bez Three.js, serveru, fetch a CDN. Čtyři původní geometrie a všech 520 animačních snímků zůstávají. Textury, hudba a zvuky jsou procedurální.

## Adventure editor

Tato verze je první scénářový editor s pevným rozměrem **12×10 polí**. Větší světy, výšky, knihovna krajinných objektů, cutscény, dialogové volby a blueprinty přijdou později. Editor ještě není finální svět SlimeTribe.

- **Louka / Bažina / Ruiny:** malování typu terénu klikáním nebo tažením přes 2D mřížku. Místní terén ovlivňuje generovanou battle mapu.
- **Překážka / Průchod:** nastaví nebo zruší neprůchodnost. Start ani objekt nelze nechtěně zazdít na stejném poli.
- **Start:** přesune výchozí pozici hrdiny.
- **Střet:** vloží místo bitvy. Ve Výběru upravíš ID, seed (0..4294967295) a frakci Bažinní/Nekro. Standardně se battle mapa vygeneruje; datový formát podporuje i ruční `battleMap` pro příběhové výjimky, bez zvláštního battle UI editoru.
- **Kámen:** mapa s textovou interakcí; vlastní text a ID upravíš v inspektoru.
- **Pramen:** jednou obnoví zdraví a manu žijících členů družiny. Neobživuje padlé. Využití se uloží do rozehrané kampaně.
- **Smazat objekt:** odstraní kámen, pramen nebo střet na vybraném poli; nemění terén.
- **Výběr:** vybere pole a jeho inspektor. Název a ID mapy lze měnit nad mřížkou.

Vpravo je živý 3D náhled; klikem lze upravit i projektované pole. Pravé tlačítko s tažením otáčí kameru, kolečko přibližuje. V nepřítomnosti WebGL funguje 2D editor, hudba, textury a soubory, ale není k dispozici 3D hra/náhled.

Editor má vlastní undo/redo (60 stavů, při malování stav po jednotlivých změněných polích). Hlásí kolize, neplatné ID/seed a nedostupné objekty. Rozpracovanou mapu s nedostupným místem lze uložit; **Spustit mapu** vyžaduje dosažitelnost všech objektů a střetů ze startu.

## Autorská mapa a rozehraná hra

`PRJ.adventureMap` je autorský draft. `PRJ.game` / `gameData` je rozehraná kampaň. Úpravy nebo import mapy nepřepisují aktuální adventure ani probíhající bitvu. Undo kampaně rovněž zachová draft.

**Spustit mapu** vytvoří novou výpravu z draftu s plnou družinou a nevyřešenými střety/prameny. Stará rozehraná kampaň se tím nahradí, takže ji lze předem uložit tlačítkem Projekt. **Nová výprava podle mapy** ve Hře znovu použije aktuální autorský draft.

Dva původní testovací střety zůstávají; výchozí mapa má navíc pamětní kámen a pramen. Vstup na střet automaticky zahájí battle, vstup na kámen/pramen vyvolá text/účinek a záznam v deníku.

## Soubory a file://

- **Mapa JSON:** samostatný formát `slimetribe.adventure-map`, verze 1: metadata, terén, blokace, start, střety, objekty. Neobsahuje rozehraný boj ani audio editor. Importuje se v Adventure editoru a až Spustit mapu jej přenese do hry.
- **Celý projekt JSON:** mapa/draft, celá rozehraná hra a editory textur/audio.
- **HTML:** úplné přenosné studio se současným projektem a čtyřmi modely. Otevře se znovu dvojklikem.

Načítání používá File API, ukládání Blob download. Nezávisí na localStorage/IndexedDB. Content Security Policy zakazuje síťová připojení. Exportované soubory mají postfix YYYYMMDDHHMMSS. Starší projekt bez autorské mapy získá mapu odvozenou ze svého adventure stavu; pokud hrdina stojí na objektu/střetu, migrace zvolí blízké volné pole pro start.

## Hra a battle

Adventure pohyb respektuje překážky. Battle mapa se generuje deterministicky ze seedu a místního terénu; armády mají průchozí nástupní pruhy. Ruční battle mapa nesmí blokovat nástupní pozice.

V bitvě vyber spojence, akci a cíl. Pohyb spotřebovává body; sousední útok/léčení do 3 polí/kouzlo do 4 polí spotřebuje jednu akci a ukončí pohyb. Cena many a stav družiny jsou v panelu. Vyčkat ukončí akci, Ukončit tah předá řízení AI. Magican používá svůj skutečný spell klip; Octopus je kontaktní bojovník bez magie.

Po vítězství se vrací zdraví a mana do družiny a encounter se označí za vyřešený. Smrt hrdiny znamená porážku. Opakování z checkpointu obnoví družinu a stejnou mapu. JSON/HTML ukládá i rozehraný střet; vizuální animace se po načtení rekonstruuje na uloženém logickém stavu.

Boj používá původní katalog statistik a nákladů, ale deterministický damage bez původní náhodné složky. Finální balancování a efekty kouzel ještě nejsou hotové.

## Struktura známá ze SlimeTribe

Zdrojové soubory v `src/game/` zachovávají rozdělení `game.adventure.js`, `game.adventure.grid.js`, `game.battle.js`, `game.battle.grid.js`, `game.battle.ai.js`, `game.battle.animation.js`, `game.init.variables.js` a `game.html.js`.

Nové soubory jsou `game.adventure.editor.js` (datové operace) a `game.adventure.editor.ui.js` (UI/náhled). Veřejné API je pod `Game.Adventure.Editor` (`fromState`, `structure`, `check`, `apply`, `start`). `Game.Adventure.Events.objectAtHero`, `useObject` a `interact` obsluhují objekty. `Game.Save` kontroluje i jejich jednorázové použití.

Zůstávají `Game.Adventure`, `Game.Battle`, `Game.Scene`, oddělené `gameData.adventure/battle`, `monstersList`, `spellsList` a rozpoznatelné vlastnosti `plane`, `selection`, `world`, `healthRemain`, `manaRemain`, `speedRemain`. Přenos není úplně signaturově kompatibilní kopií historického Three.js API.

## Ověření

Prošly testy:

- Úpravy terénu, umístění startu/objektů, inspektor, odmítnutí kolizí, duplicitních ID, neplatných seedů a textu nad limitem.
- Zachování rozehrané hry včetně bitvy při editaci/importu draftu.
- Dosažitelnost, odmítnutí spuštění neprůchozího scénáře bez změny hry a oprava průchodu.
- Spuštění autorského scénáře, textové interakce a přenos vlastního seedu/frakce do battle.
- Pramen obnovuje jen živé členy, neobživuje padlé a po save/load zůstává vyčerpaný.
- Migrace mapy ze stavu rozehrané bitvy.
- V DOM/Canvas a mock WebGL harnessu: inicializace editoru, undo/redo, inspektor, mapový JSON import/export, zachování draftu při chybném importu, spuštění draftu a HTML export.
- Regrese battle, 100 seedů, návrat/checkpointy, rozehraný save, modely/520 snímků, výběr 120 polí, pohyb 30/60/120 FPS, textury a audio.

**Skutečné klikání/tažení v prohlížeči, vzhled, GPU kompilace GLSL a slyšitelné Web Audio zatím nejsou ověřené.** Prostředí blokuje spuštění Chromium. Harness ověřuje kód a API, není náhradou browserového/visuálního testu. Playwright test je přiložen, ale nebyl zde úspěšně spuštěn.

## Reprodukce

`python3 build.py` vytvoří jediné HTML v `dist`, bez npm/bundleru/transpileru. Zdrojový balíček obsahuje Eldor referenci, čtyři originální geometrie a oddělené nové JS moduly.

Po sestavení spusť Node testy `tests/adventure-editor.cjs`, `tests/game.cjs`, `tests/models.cjs`, `tests/dsp.cjs`, `tests/runtime.cjs`. `MOCK_GL=1 node tests/runtime.cjs` projde renderovací API bez skutečného GPU. Playwright test `tests/smoke.cjs` vyžaduje vlastní Chromium/Playwright; volitelně `SLIME_CHROMIUM` a `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.
