# SlimeTribe — fáze 6: cutscény a Sequencer

Jeden HTML soubor pro `file://`, s přepínačem WebGL 3D / čtyřpanelové Canvas diagnostiky. Bez serveru, síťových prostředků, npm nebo runtime závislostí. Předchozí adventure editor, scénářové bloky, generované bitvy, původní morph modely a Eldor hudba/SFX zůstávají zachované.

## Rychlé vyzkoušení

1. Otevři `dist/SlimeTribe-Phase6_....html` dvojklikem a klikni na **Cutscény** v horní liště.
2. **+ Ukázka s úvodním Blueprint blokem** přidá osmivteřinovou scénu do draftu mapy a jednorázovou startovní událost. Obsah již existujících událostí se zachová.
3. **▶ / ❚❚ Náhled** přehrává náhled editoru. Posuvník dole umožňuje tiché procházení časem; vlevo jsou vlastnosti scény a vybraného klíče.
4. V **Adventure editoru** stiskni **Spustit mapu**. Cutscéna se přehraje před předáním ovládání hráči. Můžeš ji pozastavit nebo přeskočit.
5. Ulož projekt během cutscény a znovu načti JSON v panelu Projekt: pokračuje ze stejného času a scénářového bloku.

## Editor

Spodní časová osa je přes celou šířku okna. Adaptuje Eldor Sequencer na konkrétní data a originální modely SlimeTribe; obecné voxel postavy ani staré Eldor game demo nejsou součástí runtime.

| Stopa | Úpravy |
|---|---|
| Kamera | Čas, světová pozice XYZ a cílový bod XYZ |
| Postavy / animace | Postava, morph klip, pozice x/z a rotace |
| Titulky · hudba · SFX | Text, skladba nebo Stop, jednorázový zvuk |
| Zatmívačka | Čas a krytí 0–1 |

Kliknutí na klíč jej vybere. Tažení mění čas s krokem 0,05 s; čas lze zadat i přesně v inspektoru. Tlačítko + na stopě přidává klíč v aktuálním čase. Posuvník měřítka mění šířku časové osy. Horizontální posun zajišťuje scrollbar. Kamera má povinný klíč v čase 0; kolidující kamerové/fade/stejné actor klíče validátor odmítne a zachová původní draft.

Vlastnosti scény: ID, název, délka 0,1–300 s a lineární nebo plynulá interpolace. Zkrácení délky nesmí nechat klíče mimo scénu. Kamera používá světové souřadnice se středem mapy v 0,0,0. Postavy používají gridové x 0–11, z 0–9; pohyb mezi klíči je vizuální interpolace, bez gridových kolizí. Rotace jsou v radiánech a přecházejí kratším směrem.

Obsazení lze přidávat, mazat, přejmenovávat a měnit mezi čtyřmi původními rodinami s příslušnými klipy a procedurálními frakcemi. Žádné páté modely. Změna rodiny nahradí nepodporované klipy hodnotou stand. Jde o samostatné vizuální aranžmá; klíče nepřesouvají skutečné jednotky, nemění HP/manu a neobcházejí pravidla adventure/battle.

Náhled je oddělený od rozehrané hry. Úpravy mají lokální Undo/Redo adventure draftu; horní Undo v Cutscénách používá stejnou historii mapy. Mapový JSON i celý projekt obsahují cutscény. Přejmenování scény opraví Blueprint reference; smazání referencované scény se odmítne.

## Herní návaznost

Nový blok **Přehrát cutscénu** lze vložit mezi existující akce scénáře. Událost čeká na dokončení nebo přeskočení scény a potom pokračuje přesně dalším blokem. Lze řetězit více scén a následně spustit bitvu. Vstup „Návrat z vítězné bitvy“ může přehrát další scénu nad adventure mapou.

Při cutscéně se zastaví herní pohyb, bojové akce a změny tahů. Základní `mode` zůstává adventure/battle a samostatný `game.cutscene` řídí přehrávání; konec obnoví původní herní pohled. Přeskočení neprovádí zmeškané audio cues. Herní důsledky patří do následujících Blueprint bloků, takže přeskočení a normální dokončení mají stejný výsledek.

- Pauza cutscény zastaví její čas i audio; pokračování obnoví hudbu podle jejího aktuálního času.
- Globální pauza hry zastaví hru a aktivní cutscénu. Náhled editoru má samostatné ovládání.
- Přechod z Hry do jiného panelu pozastaví herní čas; po návratu hudba naváže podle pozice cutscény.
- Náhled editoru se při opuštění panelu zastaví.
- Po konci se obnoví výchozí ambient/combat hudba odpovídající výslednému hernímu režimu.

Titulky platí do dalšího textového cue. Speciální text `[clear]` titulek skryje. Zatmívačka je interpolovaná a nepřekrývá titulky. V 2D diagnostice zůstávají pohledy pevně podle os; mění se pozice a morph snímky postav a debug ukazuje skutečnou kameru. Zatmívačka nepřekrývá debug čtvrtinu a titulky se zobrazují v horním levém pohledu. Perspektivní kameru ukazuje 3D režim.

## Hudba a SFX

Stejný Eldor tracker, syntezátor a generátor SFX jako v předchozí fázi. Transport podporuje časový offset: po načtení či pokračování se hudba obnoví na odpovídajícím trackerovém kroku. Jde o obnovu od hranice kroku s nově spuštěnými hlasy, ne bitově přesnou rekonstrukci doznívajících obálek, reverbu a fáze oscilátorů. SFX se po načtení znovu neprovádějí. Pro zvuk je potřeba běžné uživatelské odemknutí audia; zmeškaná SFX se po odemknutí nehromadí.

## Data a rozhraní

- `adventureMap.cuts`: slovník scén; každá má `{version:1,id,name,duration,interp,k,actors,actorKeys,cues,fadeKeys}`.
- `game.adventure.cuts`: kopie definic běžící výpravy, nezávislá na úpravách draftu.
- `game.cutscene`: `{id,t,paused,cursor,scenario}` nebo null; persistuje v JSON i samostatném HTML.
- `Game.Cutscene`: validace, sample, start/update/pause/skip, vzorkování hudby a hooky.
- `SlimeTribe.cutscenes`: editorové API pro get/create/demo/edit/seek/play/addKey/sample.
- Nové zdroje `game.cutscene.js`, `game.cutscene.render.js`, `game.cutscene.editor.js`.

Starší mapy a projekty bez `cuts` nebo `cutscene` se stále načítají. Stávající `Game.Adventure`, `Game.Battle`, `Game.Scenario`, `Game.Scene`, `Game.Save` a struktura zdrojových souborů zůstávají zachované. Celkový formát projektu/save zůstává v1, cutscéna má vlastní verzi 1. Limity: 32 scén, 16 postav, 128 kamerových a fade klíčů, 256 actor klíčů a cues na scénu. Validace odmítá neplatné reference i poškozený kurzor přehrávání bez výměny aktivních dat.

## Ověření a sestavení

`python3 build.py` vytvoří jediný distribuční HTML soubor. Ve `tests` jsou čisté Node testy: `cutscene.cjs`, `scenario.cjs`, `game.cjs`, `adventure-editor.cjs`, `models.cjs`, `dsp.cjs`, `runtime.cjs`.

Prověřeno: shodné dokončení při 30/60/120 FPS; každé cue jednou; uložení/načtení během scény a pauzy; žádný replay SFX; správný hudební krok při offsetu; přeskočení a navázání scénářových akcí; řetězení scén do generované bitvy; blokování tahů; atomické odmítnutí chybných dat; izolace náhledu; editorové Undo/Redo; validace audio referencí; skutečné Canvas rastry a cesta přes mock WebGL. Regrese pokrývá všechny původní modely, audio, adventure editor a celý souboj.

**Skutečné browserové klikání, zvukový výstup a WebGL raster nejsou zde ověřené:** prostředí blokuje spuštění Chromium. DOM harness, testy transportu a nativní Canvas to nenahrazují. `NATIVE_CANVAS=1 node tests/runtime.cjs` používá `@napi-rs/canvas` z `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; `MOCK_GL=1` prověří renderovací rozhraní a přepínač, `AUTO_FALLBACK=1` automatický fallback.

## Další práce

Stále jde o autorský a herní základ s výcvikovou mapou. Kanonický Q01 obsah, battle události pro jednotlivé tahy/porážku a rozsáhlejší větvený Blueprint graf zůstávají navazující prací. Historická dokumentace fáze 5 je v `docs/Scenarios-0.5.md`.
