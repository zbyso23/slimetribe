# SlimeTribe — fáze 10: procedurální materiály a shaderová laboratoř

Vlastní renderer Eldoru nyní používá výraznější materiály ve hře i v editoru. Původní MD2 modely, pravidla battle/adventure, ovládání, XYZ kalibrace, Q01/Q02, cutscény a audio zůstávají zachované. Distribuce je jediný samostatný HTML soubor pro `file://`, bez serveru, CDN, Three.js a runtime instalací.

## Vyzkoušení

1. Otevři HTML a v horní liště vyber **Materiály · před/po**.
2. Levá polovina má základní vzhled, pravá stejné objekty s materiály. Obě sdílejí kameru, geometrii i čas animace. Vedle původního slizu je voda a runový sloup.
3. Vyber model, animaci a povrch; uprav drsnost, mokrost, záři a rychlost. Táhni kamerou nebo použij kolečko.
4. Vyzkoušej zásah, léčení a rozpad. Posuvník rozpadu mění množství zbývajícího povrchu. Lze přepnout na jediný pohled nebo materiály úplně vypnout.
5. V **Modely** jsou stejné materiálové parametry pod XYZ kalibrací. Uložení projektu i export HTML je zachovají.

V 2D režimu zůstávají čtyři diagnostické pohledy a CPU geometrie. Nejde o emulaci GLSL ani o shaderové A/B porovnání; pro ty použij 3D. Hra nadále začíná výcvikovou mapou, případně pokračuje z vloženého stavu. RPG test bez scénáře je dál v liště. Větší výškový svět tato fáze nepřidává.

## Povrchy a efekty

| Povrch | Použití |
|---|---|
| Mokrý sliz | Odlesk podle pohledu a světla, světlý okraj a jemné pulzování |
| Živé runy | Barevná emise, světelné pásy a pulzování; výchozí u magican |
| Přízračná aura | Barevný okraj a svit; jde o stylizovaný neprůhledný povrch |
| Matný základ | Původní osvětlení a textury; parametry efektů jsou vypnuté |
| Voda | Analyticky animované normály a barva hladiny, odlesk; nemění geometrii ani fyziku |
| Bažina | Tlumenější mokrý povrch s pomalejším pohybem |
| Přízemní mlha | Výška a vzdálenost ve světě; jemný pohyb v adventure a laboratoři |

Materiály jsou výchozím stavem zapnuté. Tlačítko je může globálně vypnout, včetně mlhy a bojových povrchových efektů. Battle má přízemní mlhu vždy vypnutou kvůli čitelnosti. Mokré buňky a runové/pool rekvizity se vykreslují samostatně; běžné skály a podlaha nepřebírají shader posledního modelu.

Herní animační adaptér spouští krátký zásah nebo léčivý svit na cíli. Smrt přidává postupný rozpad. Tyto efekty nepřenášejí poškození ani nemění statistiky; přísluší pouze vykreslení. Pauza zastaví jejich čas a načtení jiného stavu vyčistí přechodné události.

Nejde o kompletní PBR/HDR systém: není tu screen-space odraz, bloom, fyzikální voda ani dynamické stínové mapy. Cílem jsou čitelné stylizované povrchy, které lze vypnout a jejichž přínos lze přímo porovnat.

## Uložení a struktura

- Volitelná `project.visual = {version:1, enabled:boolean, mist?:0..1, models:{...}}`. Chybějící data používají výchozí materiály, takže se starší projekty načtou.
- Materiál jedné rodiny má `preset`, `roughness` 0..1, `wetness` 0..1, `glow` 0..2 a `speed` 0..3. Rodiny zůstávají slizak, healer, magican a octopus. Nastavení nemění kolize ani logickou orientaci modelu.
- `src/material-shader.glsl` obsahuje vlastní materiálovou část fragment shaderu. `build.py` ji vloží do převzatého rendereru a zachová překlad pro WebGL1.
- `src/game/game.materials.js` obsahuje validaci, nastavení, izolaci uniformů, seskupení rekvizit, přechodné efekty a A/B laboratoř. API je `Game.Materials` / `SlimeTribe.materials`.
- RPG terén rozděluje mokrou podlahu od pevné geometrie. Původní nefilterované `terrainMesh()` zůstává pro diagnostiku stejné.
- Každý modelový draw i scéna mají úklid materiálového stavu; A/B vrací viewport a scissor. Dynamické popisky laboratoře se nezdvojují v exportovaném HTML.

Kalibrace a RPG ovládání z fáze 9.2 jsou popsány v `docs/RPG-0.9.2.md`. Historické popisy Q01/Q02 a editorů jsou v ostatních souborech `docs`.

## Testování

```sh
python3 build.py
python3 tests/run.py
# Volitelný nativní Canvas pro diagnostické rastry:
python3 tests/run.py --native
# Navíc skutečný GLSL software raster přes lokální Mesa EGL:
python3 tests/run.py --native --gpu
```

Build/Node/Python slouží pouze vývoji. Hotové HTML žádný build ani další knihovny nepotřebuje. Vývojové `--native` používá dostupný `@napi-rs/canvas`; `--gpu` vyžaduje lokální Mesa EGL, softwarový OpenGL ES a Pillow. Nic se automaticky neinstaluje. Příslušné cesty může určit `CODEX_PRIMARY_RUNTIME_NODE` a `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

Toto vydání prošlo 16 sadami včetně:

- dosavadních testů modelů, kalibrace, DSP, battle, editorů, scénářů, cutscén, Q01/Q02, přenosu kampaně a RPG ovládání;
- validace materiálových parametrů, atomického odmítnutí vadného importu, resetu, uložení a HTML exportu;
- stejného herního stavu před a po A/B zobrazení, nerovnoměrné šířky pixelů při lichém rozlišení, globálního vypnutí a úklidu GL stavu i po výjimce;
- ovládání materiálů v modelovém editoru, rozpadu v náhledu, pozastaveného času a vyčištění událostí po načtení;
- skutečné kompilace/linkování GLSL ES 3.00 a přeložené ES 1.00 varianty, nikoli jen mock volání;
- skutečné rasterizace původního MD2 meshe přes Mesa llvmpipe: změny pixelů pro materiály, odlesk podle drsnosti, animovanou vodu/runy/léčení, mlhu, deterministický pozastavený čas a úplné zmizení při dokončeném rozpadu.

Výsledky jsou v `tests/results.json`, `tests/shader-gpu-results.json` a příslušných logách. Skupiny kontrol nejsou měřením řádkového/větvového pokrytí. Shaderové PNG jsou interní ověřovací výstupy a nejsou součástí zdrojového archivu.

GLSL byl skutečně zkompilován a vykreslen v softwarovém OpenGL ES. Toto není browserový WebGL test: konkrétní prohlížeč, GPU ovladač, celkový vzhled labu v browseru a poslech zde zůstávají neověřené.
