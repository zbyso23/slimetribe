# SlimeTribe — oprava hráčského UX (0.10.1)

Toto vydání přepracovává začátek a ovládání hry. Výchozí obrazovkou je hráčská nabídka a Nová hra začíná příběhem Zelené hráze. Editory, shaderová laboratoř a testovací mapy jsou v oddělené Dílně. Nový herní obsah se nepřidává.

Hotový HTML soubor otevři přes `file://`. Nepotřebuje instalaci, server, CDN ani Three.js. Původní čtyři modelové rodiny, procedurální materiály a audio, Q01/Q02 a dosavadní autorská API zůstávají součástí aplikace.

## Začátek hry

1. **Nová hra** spustí intro.
2. Scénu lze nechat doběhnout nebo přeskočit tlačítkem, Esc či Enterem.
3. Navazující příběhový dialog je uprostřed herního pohledu. Klikni na **Pokračovat** nebo stiskni Enter.
4. Začne první souboj. Žádné potvrzení už neleží schované pod jinými panely.
5. Po vítězství použij **Pokračovat v příběhu**, rozhodni o bráně a pokračuj v průzkumu.

Příběh někdy záměrně zastaví pohyb. V takové chvíli je viditelný centrální dialog nebo volba; není potřeba odcházet do testovací mapy. První krok v záchranném okně Q01 vyvolá varování před záplavou — Enter jej potvrdí a chůze může pokračovat.

## Souboj bez režimů Pohyb/Útok

| Vstup | Výsledek |
|---|---|
| Klik na živého spojence / jeho kartu | Vybere postavu, i když předchozí postava ještě dokončuje animaci |
| Klik na volné dostupné místo | Přesune vybranou postavu |
| Klik na nepřítele | Útok; mág automaticky používá kouzlo |
| Nepřítel není hned v dosahu, ale lze dojít | Postava dojde a pak zaútočí jedním příkazem |
| Cíl je dál než celý zbývající pohyb | Postava se přiblíží; rozhraní výslovně uvede, že na tento cíl dosáhne až v dalším tahu |
| Léčit / H | Připraví volitelnou schopnost léčitele; potom vyber zraněného spojence |
| Esc / pravý klik při cílení schopnosti | Zruší schopnost |
| 1–4 | Vybere člena družiny |
| Tab | Další postava, která ještě může jednat |
| Mezerník | Vyčkat s vybranou postavou |
| Enter | Ukončit tah družiny |

Spojence lze vybírat bez přepnutí do jakéhokoli pohybového režimu. Základní útok také nemá vlastní režim. Schopnosti zůstávají volitelné a jejich cílení je výslovně označené. Chybějící mana a nemožná cesta vracejí čitelný důvod.

Po vyřízené akci se nabídne další použitelná postava; pokud už jednali všichni, přejde tah na protivníka. Ruční výběr jiné připravené postavy během animace se zachová. Plánovaná akce je vázaná na svého aktéra, nikoli na později vybranou postavu.

Zdraví a zbývající pohyb jsou na kartách družiny, nad jednotkami jsou malé jmenovky a zdraví. Výběr na mapě vychází z vykresleného morph meshe; pevný velký hit-kruh už nepohlcuje kliknutí na sousední zem. Při najetí se ukazuje zamýšlená akce a zranění/léčení.

## Průzkum a příběh

- WASD / šipky pohybují Slizákem. Pravé tlačítko s tažením otáčí kameru, C ji vrací za postavu.
- Aktuální úkol je vlevo nahoře, mapa vpravo. Směrová šipka ukazuje k hlavnímu cíli, objekty mají jmenovky přímo ve světě.
- Na místě objektu se objeví konkrétní tlačítko **E · Ventil**, **E · Uprchlíci**, **E · Tábor léčitelů** apod.
- Volby mají čitelné názvy a následky; interní OPEN/HOLD/PARTIAL nebo CARE/FORCE/NEGOTIATE se hráči nepředkládají jako ovládací režimy.
- Pauza a nápověda zastaví pohyb, boj i čas cutscény. Po návratu nevzniká neviditelný pozastavený stav.
- Uložit a načíst lze v nabídce. Běžná chyba načítání se vypíše přímo tam; dosavadní výprava se nepřepíše vadným souborem.
- Dílna zůstává přístupná z nabídky. Návrat ze samotné Dílny před zahájením hry vede do nabídky, nikoli do neoznačené výcvikové mapy. Spuštění autorské mapy otevře hráčské rozhraní.
- Po aktuálně posledním teaseru Q03 hra výslovně oznámí, že další kapitola zatím není hratelná.

Kolize navíc dovolují bezpečně vystoupit ze stávajícího překryvu, pokud se kořen právě zavřel za postavou. Nepovolují vstup do nové překážky, skrz zeď ani mimo mapu.

## Co způsobovalo původní potíže

Příběhový adaptér přidával blokující dialog do panelu. Další adaptéry před něj přidaly questový přehled, RPG nápovědu, minimapu a testovací tlačítka. Hra čekala na potvrzení, ale dialog mohl být mimo viditelnou část. Výchozí spuštění navíc končilo v adventure editoru.

Hráčská vrstva nyní skládá jedinou obrazovku podle priority: nabídka/nápověda, cutscéna, dialog, výsledek souboje, souboj, konec kapitoly, průzkum. Původní zásobník autorských panelů se v ní nevykresluje.

## Zdrojová struktura

- `src/game/game.player.js`: hráčská nabídka, HUD, centrální dialogy, cíle, klávesnice, načítání, přechody a čekající kontextový příkaz.
- `src/game/game.battle.intent.js`: čisté plánování záměru kliknutí. Nemění stav; vlastní pohyb a akci dále ověřuje `Game.Battle`.
- `src/game/game.scene.pick.js`: výběr podle projekce stejné geometrie a kalibrace jako při vykreslení.
- `Game.Player` / `SlimeTribe.player` poskytují hráčskou vrstvu. `Game.Adventure`, `Game.Battle`, `Game.Scene`, `Game.Save`, katalogy i editorová API zůstávají rozpoznatelné.
- Podrobnosti dosavadních materiálů jsou v `docs/Materials-0.10.md`, RPG základu v `docs/RPG-0.9.2.md` a kampaně v dalších dokumentech.

## Ověření

```sh
python3 build.py
python3 tests/run.py --native --gpu
```

`--native` je volitelný nativní Canvas; `--gpu` skutečná kompilace/rasterizace GLSL přes Mesa EGL. Pro běžné vývojové pravidlové testy stačí `python3 tests/run.py`. Tyto závislosti patří pouze vývojovým testům; hotové HTML je samostatné.

V tomto vydání prošlo 19 sad. Nové kontroly zahrnují:

- celé hráčské průchody Q01 i Q02 přes nové UI, skutečné souboje s normální AI, pohyb klávesami a E interakce; zdraví nepřátel se v těchto průchodech nenastavuje ručně;
- intro → viditelný blokující dialog → potvrzení → bitvu, první varování při průzkumu a pokračování po jeho potvrzení;
- výběr myší a 1–4 při původně nastaveném Útoku/Kouzlu, výběr během naplánovaného útoku, přiblížení a navazující útok správného aktéra;
- klik na sousední zem, který už nepolkne hit-kruh, zobrazení/ukončení stavu probíhající akce a čitelné cílení léčení;
- zachování pauzy a nápovědy, odmítnutí vadného načtení bez přepsání výpravy, pokračování po uložení a oddělení Dílny;
- původní modely, DSP, editory, pravidla soubojů a kampaně, shaderové GL testy a regresní testy chůze.

Výsledky a logy jsou v `tests`. DOM/Canvas a mock WebGL průchody se nevydávají za skutečný browserový test. Pokus o spuštění Chromium zde končí na `socket() failed: Operation not permitted`; ani nástroj desktopu se v tomto prostředí nespustil. GLSL testy přes Mesa skutečně běží, ale celkový vzhled a pocit z ovládání v konkrétním prohlížeči zůstávají k ověření. Další funkce nejsou součástí tohoto opravného vydání.
