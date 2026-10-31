# SlimeTribe — Phase 11 · Tiché archivy (0.11)

Hratelná kampaň pokračuje ze Zelené hráze přes Hlasy bažin do Tichých archivů. Hráčská nabídka a kontextové souboje z opravy UX zůstávají výchozí cestou. Editory jsou pouze v Dílně.

Otevři vydané HTML přímo přes `file://` a zvol **Nová hra**, případně **Načíst uloženou hru**. Nepotřebuješ server, instalaci, síť ani Three.js. HTML obsahuje modely, procedurální grafiku i syntetizovanou hudbu a zvuky Eldor. ZIP slouží pro zdrojový kód a vývojové testy.

## Co přidává Q03

- Autorskou adventure mapu archivních sálů s krystaly, jmenovkami a směrem k aktuálnímu cíli.
- Plynulý přenos družiny, zdraví, many a rozhodnutí z Q02. Dokončené Q01/Q02 se uchovají jako omezená historie uložené kampaně.
- Dvě generované nekro bitvy: vstupní pečetě a obrana jádra. Stejné ovládání výběru, přesunu, útoku a léčení jako v dosavadní hře.
- Tři čitelné zdroje: původní otisk 132, opis 170 a závislý komentář 191. Po přečtení všech se otevře centrální porovnání se všemi texty. Není potřeba si je pamatovat ani hledat panel.
- Ověření nezávislého svědectví. Špatná odpověď ukáže vodítko a dovolí další pokus; nic nezničí ani trvale nezablokuje.
- Volbu uchovat originály / odnést bezpečnou kopii bez vědomí / omezit přístup. Každá uchová nezbytný fragment; rozdílné zacházení s pamětí se ukládá pro další kapitoly.
- Cutscény a explicitní konec po upoutávce na Hory tří svědků. Q04 zatím není hratelná.

Toto je první zmenšená hratelná Q03 podle dodaného Quest Design Docu. Obranu dvou krystalových pečetí zatím představuje běžný střet s jejich strážemi. Samostatné taktické ukazatele zdraví krystalů, držení dvou uzlů několik kol a vlny nepřátel nejsou implementované. Závěrečné odhalení skutečné Čtvrté přísahy zůstává až pro Q04.

## Jak projít Tichými archivy

1. Po příchodu můžeš na odpočívadle jednou zotavit celou družinu. Potom promluv přes **E** se strážcem pečetí.
2. Odraz první stráže a vrať se do příběhu.
3. Přečti tři označená svědectví v libovolném pořadí. Směrová šipka ukazuje další nepřečtený zdroj.
4. V porovnání vyber nezávislý původní otisk kliknutím nebo 1–3. Chybnou volbu můžeš opravit. Nabídka a ukládání fungují i tady.
5. Před obranou jádra je na stejném odpočívadle dostupné druhé a poslední zotavení. Potom otevři jádro přes E.
6. Vyhraj druhý střet, rozhodni o paměti a sleduj závěr kapitoly.

Pauza, dialogy a porovnání mají viditelné obrazovky. Předčasná interakce s jádrem vypíše důvod přímo ve hráčském pohledu. Pohyb, kamera a souboje se ovládají stejně jako v předchozí opravě: **WASD**, pravé tlačítko a tažení pro kameru, **C** za záda, **E** interakce; v bitvě klik na spojence / zem / nepřítele.

## Uložení a editor

Ukládá se celá výprava, nikoli jen pozice: přečtená svědectví, vodítko, spotřebovaná zotavení, průběh bitev, dialog, porovnání, rozhodnutí i cutscéna. Starší uložená Q02 může pokračovat do Q03 po skončení přechodové scény. Starý teaser s větou o nehratelné třetí misi se při načtení upraví.

V **Dílně → Adventure** je vzor Q03 a samostatný neutrální test. Test není pokračováním rozehrané kampaně; vytvoří novou samostatnou výpravu. Původní `Game.Adventure`, `Game.Battle`, `Game.Scene`, `Game.Save`, `monstersList` i autorská API zůstávají zachovaná. `Game.Quest.Q03` přidává stejný způsob práce s kapitolou jako dosavadní Q02; `SlimeTribe.q03` zpřístupňuje autorské vstupy.

## Vývoj a ověření

```sh
python3 build.py
python3 tests/run.py --native --gpu
```

Node a Python patří pouze k vývojovým testům. `--native` používá dostupný nativní Canvas; `--gpu` lokální Mesa EGL pro skutečné GLSL testy. Nic se automaticky neinstaluje.

Nové testy procházejí všech 18 kombinací pořadí tří zdrojů a tří etických voleb, skutečné bitvy s běžnou AI, porážku/opakování, konečný počet zotavení, odmítnutí poškozeného stavu a přenos kampaně. Rozšířený test hráčského rozhraní projde Q01 → Q02 → Q03 přes skutečné registrované vstupy, klávesovou chůzi a E, včetně chyby v porovnání, uložení a návratu.

DOM/Canvas a mock WebGL harness se nevydávají za skutečný prohlížečový playtest. V tomto prostředí je Chromium blokované; celkový vzhled a pocit z ovládání v uživatelově prohlížeči proto zůstávají k ručnímu ověření. Samostatné shaderové testy přes Mesa EGL skutečně kompilují a rasterizují GLSL.

Předchozí oprava ovládání je popsaná v `docs/Player-UX-0.10.1.md`; starší dokumentace popisuje stav příslušných vydání. Aktuální výsledky jsou v `tests/results.json` a příslušných `.log` souborech.
