# SlimeTribe — Phase 12.8 · CZ / EN (0.12.4)

Přepnutí: **Nastavení → Jazyk → Čeština / English**. Jde o hráčské texty: nabídky, ovládání, informace o družině, úkoly, volby, dialogy, titulky, deník a stav otravy. Dílna a její vývojářské diagnostiky zatím zůstávají česky. Toto vydání připravuje lokalizaci před cestou z hor; nepřidává zatím Q05 ani závěrečné romantické setkání.

## Gramatika

- Sedm ručně zadaných pádů jmen: `nom`, `gen`, `dat`, `acc`, `voc`, `loc`, `ins`. Např. Nara / Nary / Naře / Naru / Naro / Naře / Narou; Seren / Serena / Serenovi / Serena / Serene / Serenovi / Serenem.
- Explicitní rod postav a autorské varianty vět. Stav otravy rozlišuje „Slizák byl otráven“, „Nara byla otrávena“, „Jádro bylo otráveno“. Neodvozuje rod automaticky z koncovky jména.
- Jazykové větve číslovek přes vestavěné `Intl.PluralRules`, české i anglické tvary zůstávají napsané v katalogu. Ověřeno 0, 1, 2, 4, 5, 11, 21, 101, 1,5 a 2,5. Česká desetinná čárka se vykreslí přes `Intl.NumberFormat`.
- Předložkové varianty lze autorovat podle entity: například „s Narou“ a „se Serenem“. Nejde o univerzální automatický skloňovač češtiny.
- Opravené existující mužské tvary „se Serenem“ a „zeptej se Serena“ v hráčských textech. Starší uložené formulace mají kompatibilní překladové aliasy.

## Obsah a kompatibilita

Katalogy v `src/locales/story.json`, `ui.json` a `runtime.json` mají dohromady **513 záznamů CZ/EN**, vedle gramatických šablon v jádře. Příběhový katalog pokrývá všech 179 neprázdných textových/názvových záznamů čtyř kapitol včetně čtyř jemných výměn Seren/Nara. Přeložené je také samostatné setkání u cisterny.

Původní mapy a pravidla zůstávají v kanonické češtině. Kompatibilní prezentační adaptér převádí známé texty na stabilní klíče; nepřepisuje ID objektů, příběhové příznaky, pořadí akcí ani uložené scénáře. Neznámé autorské texty map zůstanou v původním znění, dokud pro ně nevznikne překlad. Chybějící klíč je viditelný jako `[key]` a eviduje se v `Game.I18n.missing`; chybějící jazyková varianta má český fallback.

Přepnutí jazyka zachovává pauzu, čas právě běžící cutscény i otevřený příběhový blok. Dialogy a titulky se přepnou bez opětovného spuštění události. Volba jazyka je v projektu v `locale: {version: 1, language: 'cs' | 'en'}` a přenáší se JSON/HTML exportem.

`campaign.journal` ukládá překladový klíč, parametry a záložní kanonický text; staré `campaign.log` zůstává zachované pro původní API. Stav otravy už zapisuje parametrizované události. U existujících známých zpráv se ukládá klíč automaticky; starší/dynamické texty využívají zpětně kompatibilní adaptér. Historie je omezená na 80 položek. Vlastní nebo historická zpráva bez známého překladu se nemaže ani neodhadovaně nepřekládá.

HTML obsahuje oba katalogy i veškerý runtime. Funguje přímo přes `file://`; nic se nestahuje a nejsou přidané knihovny ani npm závislosti.

## API a rozšiřování

- `Game.I18n.t(key, params, language?)` — jazykově napsaná šablona.
- `Game.I18n.name('nara', 'dat', 'cs')` — `Naře`.
- `Game.I18n.entity('nara')` — typovaný parametr entity.
- `Game.log(Game.I18n.event('poison.applied', {target: Game.I18n.entity('nara')}))` — uložit událost, přeložit při zobrazení.
- `SlimeTribe.i18n.setLanguage('en')` — stejné přepnutí jako v nastavení.
- `Game.I18n.text(canonicalText)` — kompatibilní adaptér známých starších textů. Nové šablony je vhodné psát rovnou s pojmenovanými klíči a parametry.

Klíče katalogů při úpravách nepřečíslovávej ani nemaž; mohou být uložené v deníku. Změní-li se český autorský text, uprav jeho `cs` pod stejným klíčem a odpovídající `en`. Pro vlastní obsah přidej vlastní pojmenovaný klíč a entity s výslovnými tvary. `build.py` katalogy vloží do výsledného HTML; tento vývojový krok není požadavkem pro hraní.

## Ověření

**33 testovacích sad prošlo.** Nové testy pokrývají pády a rody, předložkové varianty, číslovky včetně desetinných, shodu klíčů/parametrů CS a EN, pokrytí textů kapitol, deník a starší save, odmítnutí neplatných údajů, přepnutí během dialogu/cutscény a zachování herního stavu. Vzorkované hráčské obrazovky Q01–Q04 prošly kontrolou zbytků českého textu. Překladový adaptér mění jen text a čitelné atributy; HTML ve vloženém překladu escapuje, nikdy jej nevykonává.

Zachované jsou také regrese celého průchodu Q01–Q04, původní modely, otrava a vykreslení procedurálních receptů. `python3 tests/run.py --native --gpu` používá pravidlové testy, DOM/Canvas/mockGL a skutečný Mesa EGL raster. Nejde o Chromium ani vizuální test na iPhonu; ty tu nadále nejsou k dispozici. Anglické texty mají první autorský překlad; závěrečná jazyková korektura a kontrola zalamování na zařízeních zůstávají součástí dokončení hry.
