# SlimeTribe — fáze 5: adventure scénáře

Jeden samostatný HTML soubor pro `file://`, s přepínačem 3D / 2D v horní liště. Bez WebGL automaticky zůstane aktivní čtyřpanelový Canvas fallback. Projekt ani rozehraná hra se při přepnutí neresetují. Původní modely, procedurální textury, Eldor audio a API z předchozích fází zůstávají základem.

## Vyzkoušení

1. Otevři `dist/SlimeTribe-Phase5_....html` dvojklikem.
2. V Adventure editoru sjeď pod mapové nástroje k části **Scénář · Blueprint bloky**.
3. Stiskni **Nahradit ukázkovým scénářem**. Přepíše pouze události draftu; lze vrátit Undo. Rozehraná výprava se nemění.
4. **Spustit mapu** zahájí novou výpravu. Úvod nabídne volbu Opatrně / Rychle a zapíše příznak `careful`.
5. Navštiv pamětní kámen: interakce spustí další zprávu. První vítězný střet po návratu do adventure změní cíl a otevře dialog.
6. Ulož projekt během dialogu a znovu načti JSON v panelu Projekt. Otevře se stejný blok; volby i hotové události zůstanou zachované.

## Scénářové bloky

Událost obsahuje stabilní ID, název, vstup, volitelnou podmínku a pořadí akcí. Editor ukazuje `VSTUP → PODMÍNKA → AKCE`; jde o první omezený editor bloků pro konkrétní hru, ne celý obecný graf Eldoru.

| Vstup | Kdy nastane |
|---|---|
| Start mapy | Při spuštění nové výpravy |
| Vstup do oblasti | Po příchodu na pole uvnitř obdélníku |
| Interakce s objektem | Po použití kamene nebo pramene |
| Návrat z vítězné bitvy | Po potvrzení návratu na adventure mapu |

Podmínka vyžaduje hodnotu pojmenovaného boolean příznaku. Chybějící příznak má hodnotu Ne. Nevyhovující vstup se nespotřebuje; pozdější vstup může událost spustit. Již dokončená událost se neopakuje. Pořadí souběžných událostí odpovídá pořadí v seznamu; podmínka se kontroluje při spuštění konkrétní události.

| Akce | Výsledek |
|---|---|
| Dialog / zpráva | Pozastaví ovládání do potvrzení |
| Dialogová volba | Dvě odpovědi nastaví příznak na Ano / Ne |
| Nastavit příznak | Zapíše pojmenovanou boolean hodnotu |
| Změnit cíl | Zobrazí aktuální cíl a zapíše deník |
| Změnit terén | Změní typ povrchu a průchodnost jednoho pole |
| Spustit bitvu | Spustí existující střet s jeho seedem / ruční mapou |

Bitva musí být poslední blok události. Návaznost se řeší samostatnou událostí po vítězství. Scénář může spustit střet mimo jeho původní políčko; návrat a opakování po porážce zachovají skutečnou výchozí pozici hrdiny. Battle mapy zůstávají primárně generované, adventure mapa je autorská.

Nelze blokovat pole s objektem či střetem. Zablokování aktuálního pole hrdiny se odmítne a zapíše do deníku; změna jeho terénu je povolená. Pokud scénář zablokuje další pole probíhající cesty, pohyb se při pokusu o vstup zastaví na posledním legálním poli. Scénář může záměrně uzavřít cesty; autor odpovídá za jejich následné otevření.

## Data, save a API

- `adventureMap.scenario`: `{version:1,rules:[...]}`; součást mapového JSON a projektu.
- `game.adventure.scenario`: definice běžící výpravy, oddělená od upravovaného draftu.
- `game.campaign.scenario`: příznaky, cíl, hotová ID, fronta a rozečtený dialog s indexem akce.
- Starší mapy a savy bez scénářů zůstávají přijímané. Formát projektu a základního save zůstává v1, scénář má vlastní verzi 1.
- Validátor odmítne neznámé bloky, poškozený dialog, neplatné reference a duplicity bez výměny aktivního stavu. Bloky neobsahují vykonávaný JS.
- Změna ID objektu/střetu v inspektoru upraví reference scénáře. Mazání referencovaného objektu se odmítne; nejprve uprav nebo smaž související událost.
- Limity: 64 událostí, 24 akcí na událost, 128 zapisovaných příznaků, text 500 znaků, název 80 znaků. Všechny události jsou v této fázi jednorázové.

Nové moduly:

- `src/game/game.scenario.js`: `Game.Scenario`, validace, vykonávání a hooky známých Adventure/Battle metod.
- `src/game/game.scenario.editor.js`: inspektor scénářových bloků a dialogové UI.
- `src/game/game.scene.mode.js`: `Game.Scene.Mode`, přepnutí renderu se zachováním WebGL kontextu a samostatnou Canvas vrstvou.

Původní soubory `game.adventure.js`, `game.battle.js`, `game.save.js`, mapový editor a `game.html.js` zůstávají rozpoznatelné. Veřejné API navíc: `SlimeTribe.scenario`, `SlimeTribe.renderMode`; stávající `Game.Adventure` a `Game.Battle` dál řídí pohyb a pravidla.

## Ověření

Prošly testy scénářů, starších map/savů, dialogu po reloadu, obou větví volby, jednorázových událostí, změny terénu, scripted bitvy a jejího retry, návratu do adventure, vazeb po přejmenování, atomického odmítnutí chybných dat a zastavení animovaného pohybu dialogem. Regrese pokrývají kompletní bitvu, 100 generovaných map, všech 520 morph snímků modelů, audio a editorové undo/redo.

Integrační test běží v DOM harnessu; přepnutí WebGL ↔ Canvas je prověřené s mock WebGL a skutečným nativním Canvas. Čtyři pohledy mají raster test a projekční test všech 120 polí. Skutečný browserový test není proveden: spouštění Chromium je v prostředí blokované. Nezaměňovat DOM harness a nativní Canvas za ověřený browser.

Spuštění testů: `node tests/scenario.cjs`, `game.cjs`, `adventure-editor.cjs`, `models.cjs`, `dsp.cjs`, `runtime.cjs`. Pro nativní raster `NATIVE_CANVAS=1 node tests/runtime.cjs` s modulem `@napi-rs/canvas` pod `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; `MOCK_GL=1` prověří přepínání z WebGL, `AUTO_FALLBACK=1` automatický fallback. `python3 build.py` vytvoří jeden HTML výstup bez externích závislostí pro běh.

## Navazující práce

Časová osa cutscén, kamera/animace/audio cue, rozšíření událostí o battle tahy a porážku, rozvětvený graf bloků a skutečný příběhový Q01 obsah ještě nejsou součástí této fáze. Současná mapa slouží k testování authoringu a herní návaznosti.
