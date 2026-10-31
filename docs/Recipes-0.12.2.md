# SlimeTribe — Phase 12.6 · Procedurální architektura (0.12.2)

Vizuální mezikrok před cestou z hor. **Všechny existující rekvizity v Q01–Q04 používají složené procedurální recepty**, bez úprav mapových ID, herních událostí, kolizí a uložených pozic. Starší projekt dostane nové modely automaticky při otevření v této verzi. Kampaň zatím stále končí po Q04; propojení setkání u cisterny s přechodem do Q05 není součástí tohoto výtvarného kroku.

| Objekt | Nový recept |
|---|---|
| Hradba | Sokl, kamenné tělo, římsy, opěry a cimbuří |
| Věž | Osmiboký základ, dvanáctiboký dřík, prstence a otevřené cimbuří |
| Hráz | Základ, boky s opěrami, horní koruna a zasazený uzávěr |
| Most | Podklad, spodní nosníky, osm prken s mezerami a kovové čepy |
| Ventil | Kamenný podstavec, potrubí, kruhové ruční kolo a šest paprsků |
| Runa | Stupňovitý podstavec, zúžený kámen, hlavice a oboustranný zářící znak |
| Kořen | Zúžený kmen, pět kořenových ramen a zalomené větve |
| Krystal | Kamenná patka a tři různě vysoké hroty |
| Tůň | Dno, oddělená vodní hladina, oblé kamenné ostění a okrajové kameny |
| Cisterna | Dutá dvacetiboká stěna, horní kamenný lem, sediment a výpusť |
| Sběrný aparát | Nosná konstrukce, deska, dvě nádoby a spojovací vedení |
| Znamení | Stupňovitý sokl, pilíř, hlavice a znak čitelný z obou stran |

## Sloučení povrchů

`Game.Scene.Props.compile()` pracuje s hotovým receptem, bez závislosti na WebGL. U kvádrů provádí přesné odečtení zakrytých obdélníkových částí stěn, odstranění vnitřních společných ploch a spojování sousedních koplanárních ploch stejné barvy a materiálu. Například dva navazující kvádry se stejným povrchem dávají jeden obal o 12 trojúhelnících, místo původních 24. Částečně překrytá stěna se ořízne; pouhý test středu trojúhelníku se nepoužívá.

U válců a dalších zakřivených částí se odstraňují pouze celé trojúhelníky prokazatelně uvnitř jiného konvexního tělesa. U válce se testuje skutečný mnohoúhelníkový plášť včetně zúžení, nikoli větší ideální kružnice. Nejde o univerzální booleovský modelář; částečné průniky zakřivených ploch se netrimují.

Přesné ořezávání může u členitých průniků vytvořit více trojúhelníků než původní překrývající se primitiva. Proto `Game.Scene.Props.inspect()` uvádí skutečné počty; neslibuje pokles polygonů u každého receptu. Hlavní úspora vykreslovacích volání zůstává nezávislá na počtu primitiv.

## Vykreslení a kompatibilita

- Všechny statické rekvizity sdílejí nejvýše **čtyři draw cally podle povrchu**: kámen/dřevo/kov, voda, runy, kořeny. Nejde o čtyři volání pro každý objekt; jde o společné skupiny celé zobrazené mapy. Postavy a terén mají vlastní volání.
- Kámen u run a tůní zůstává matný; shader dostanou pouze vložky nebo hladina. Ořezání probíhá před rozdělením do materiálových skupin, takže dělení nevrací zakryté stěny.
- Geometrie se peče při změně obsahu a ukládá se do GPU bufferů. 2D diagnostika používá stejnou geometrii a omezenou CPU cache.
- Aktivace run mění jen zářící části. Q01 kolaps a Q02/Q04 proměnlivé kořeny/mosty stále respektují původní příznaky a blokovaná pole.
- Původní čtyři animované modelové rodiny, jejich procedurální skiny, hudba, souboje a veřejné `Game.Adventure`/`Game.Battle` API jsou zachované.
- HTML otevři přímo přes `file://`. Žádné runtime knihovny, server ani síť. Nové recepty jsou v `src/game/game.scene.recipes.js`.

## Ověření

Všech 30 testovacích sad prošlo.

Pravidlové testy ověřují sousední a překrývající se kvádry, plné vložení, duplicity, částečné překrytí, přesnou plochu obalu, hranice materiálů, skutečný facetový válec, normály a půdorysy všech dvanácti receptů. Integrace ověřuje materiálové skupiny a počet draw callů na Q01–Q04, cache i neměnnost hry při vykreslení. Mesa EGL skutečně vykresluje všech 12 typů s back-face culling; procházejí také testy původních kapitol a otravy.

Spuštění: `python3 build.py`, potom `python3 tests/run.py --native --gpu`. `--native` je volitelný Canvas testovacího prostředí, `--gpu` používá lokální Mesa EGL. Samostatná hra tyto vývojové závislosti nepotřebuje.

Skutečné Chromium a vizuální ověření na iPhonu nadále nejsou k dispozici. Softwarová výtvarná galerie a nativní raster testy nejsou prohlížečový test.
