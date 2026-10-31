# SlimeTribe — Phase 12.9 · Questové objekty (0.12.5)

Odstraněné jsou univerzální osmiboké kužely, které RPG renderer kreslil nad každým interaktivním objektem a nevyřešeným střetem. Objekty teď používají složené procedurální recepty stejně jako okolní architektura.

## Vzhled podle významu

- Tábory, uprchlíci a ranění: malý přístřešek, zásoby a nádoba. Jde o místo setkání/zotavení, nikoli o nový typ postavy.
- Pramen: kamenný podstavec, mísa, okraj a oddělená vodní hladina.
- Původní krystal, opis a komentář: stojany s jedním, dvěma a třemi znaky; značení je z obou stran. Archivní jádro má vlastní krystalový držák.
- Fragment a usazeniny: malý podstavec s dvojicí vzorků.
- Místo rozhovoru: kamenná konzole s krystalem.
- Ústup a brány: průchozí kamenný rám.
- Ventily a přepínače: podstavec s potrubím, kolem a paprsky. Dříve vytvořené detailní ventily zůstávají zachované.
- Střet: nízký červený kruh a zkřížené prvky na okraji pole. Po vyřešení zmizí.
- Ostatní interakce a již vymodelované runy: nízký kruhový podklad místo dalšího kužele.

## Návaznost na existující hru

Vzhled se odvozuje ze sémantických rolí `quest.roles` a `quest.arrival`, nikoli z českých názvů nebo pevných ID. Přejmenování objektu přes editor proto nepřeruší jeho význam. Generické prameny a objekty vlastních map mají rozumný výchozí recept.

Kde už detailní rekvizita existuje, nepřidává se druhý solidní model. Některé obecné runové stojany se při zobrazení nahradí vhodnějším tvarem — například původním záznamem nebo archivním jádrem. Původní data map se tím nemění.

Využité prameny, tábory, přečtené záznamy a splněné části úkolů se vizuálně ztlumí. Barva je doplňková informace; názvy, cíle a pokyny přes E zůstávají v dosavadním hráčském rozhraní a v obou jazycích.

Solidní části nových interaktivních rekvizit stojí u zadního okraje pole. Uprostřed zůstává místo, kam hráč musí dojít pro E. Nebyly přidané blokované buňky ani změněné kolize, interakční pravidla, časování, příběhové volby nebo struktura uložené hry. Podoba se použije i ve starších savech.

Stejná geometrie funguje v Adventure, náhledu editoru a 2D pohledech. Značky Adventure nepřecházejí do Battle ani do běžících cutscén. U všech rekvizit celé scény zůstávají nejvýše čtyři společné materiálové draw cally; postavy a terén mají vlastní volání. Geometrie se peče a cachuje společně s architekturou.

**Modely a rotace postav nebyly upravené**, včetně Mága. Normalizace orientace Slizáka, Healera a Octopuse zůstává samostatným budoucím krokem.

## Kód a ověření

Všech 35 testovacích sad prošlo.

- `src/game/game.quest.objects.js`: čisté recepty a odvození vzhledu/stavu.
- `src/game/game.quest.objects.render.js`: napojení na společné vykreslení.
- `src/game/game.adventure.rpg.ui.js`: odstranění starého kuželového vykreslení objektů.
- `Game.QuestObjects`: veřejný read-only popis pro vlastní nástroje.

Testy ověřují všechny role Q01–Q04, odlišení archivních záznamů, odstranění duplicit, dosažitelnost objektů, ztlumení stavů, zánik vyřešených střetů, zachování volného středu pole, shodnou 2D geometrii, sdílené draw cally a nepřítomnost kuželů v terénní geometrii. Kontrolní otisky potvrzují nezměněné modelové jádro, kalibraci a RPG rotaci.

Mesa EGL skutečně rasterizuje všech 24 receptů okolí a questů s odřezáváním zadních stěn. Zachované jsou testy hraní Q01–Q04, otravy i CZ/EN. DOM/Canvas/mockGL a nativní raster nejsou Chromium ani ověření na iPhonu; skutečný browser tu nadále není ověřený.

Spuštění vývojových kontrol: `python3 build.py` a `python3 tests/run.py --native --gpu`. Výsledné HTML se hraje přes `file://`, bez serveru, knihoven a stahování.
