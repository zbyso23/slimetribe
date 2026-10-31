from pathlib import Path
import re,json,hashlib,datetime
ROOT=Path(__file__).resolve().parent
source=(ROOT/'vendor/Eldor-XV-source.html').read_text()
def cut(a,b): return source[source.index(a):source.index(b,source.index(a))]
mods=re.findall(r'<script data-eldor-source="([^"]+)">(.*?)</script>',source,re.S)
modules=[(n,s) for n,s in mods if n.startswith(('snd/','game/'))]
for n,s in modules:
 p=ROOT/'src'/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
project=json.JSONDecoder().raw_decode(source.split('let PRJ=',1)[1])[0]
project={k:project[k] for k in ['tex','songs','synthPatches','effects','samples'] if k in project}
project.update(format='slimetribe.foundation',version=1)
project['stage']={'width':12,'height':10,'blocked':[28,29,40,41,52,53,77,78,89,90],'actors':[{'id':'red','model':'slizak','faction':'red','x':2,'z':2},{'id':'healer','model':'healer','faction':'crown','x':3,'z':4},{'id':'mage','model':'magican','faction':'necro','x':8,'z':2},{'id':'guard','model':'octopus','faction':'swamp','x':8,'z':7}]}
campaign={name:json.loads((ROOT/('src/content/'+name+'.json')).read_text()) for name in ['q01','q02']}
(ROOT/'src/game/game.content.js').write_text('Game.Content='+json.dumps(campaign,ensure_ascii=False)+';')
assets={n:json.loads((ROOT/'vendor/models'/f'{n}.json').read_text()) for n in ['slizak','healer','magican','octopus']}
project['samples']={}
(ROOT/'src/default-project.json').write_text(json.dumps(project))
css='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>',source,re.S))
(ROOT/'src/eldor.css').write_text(css)
mathgl=cut('const M={persp','const ground=mk(')
mathgl=mathgl.replace("new URLSearchParams(location.search).get('force2d')==='1'", "new URLSearchParams(location.search).get('force2d')==='1'||document.documentElement.getAttribute?.('data-force2d')==='1'")
mathgl=mathgl.replace('mode==0?texture(t0,vu).rgb:vc*', 'mode==0?texture(t0,vu).rgb:mode==2?texture(t1,vu).rgb:vc*')
mathgl=mathgl.replace('uniform vec3 fogc;out vec4 o;', 'uniform vec3 fogc;uniform int matKind;uniform vec4 matParams;uniform float localMist;out vec4 o;').replace('float alpha=fx==8', (ROOT/'src/material-shader.glsl').read_text()+'\n float alpha=fx==8').replace("'fogc'].forEach", "'fogc','matKind','matParams','localMist'].forEach")
generator=cut('const TC=[0,1]', '// Eldor V')
audio=cut('let AC=null', 'function initEldorV()')
audio=audio.replace('function playM(name){','function playM(name,offset=0){if(arguments.length<2&&typeof Game!==\'undefined\'&&Game.Cutscene?.active()){const a=Game.Cutscene.current(),q=Game.Cutscene.musicAt(gameData.adventure.cuts[a.id],a.t);if(q?.name===name)offset=q.offset;}').replace('const env=audioEnv();tm=setInterval',"const start=Math.max(0,Math.floor(offset/dur));if(!song.loop&&start>=song.len*8){stopM();return}step=start%8;songBar=Math.floor(start/8)%song.len;const env=audioEnv();tm=setInterval")
unlock=cut("addEventListener('pointerdown',()=>{audioUnlocked", '// ELDOR CHARACTER SYSTEM')
daw=cut("let dawView='song'", 'function gamesPanel()').replace('ELDOR AUDIO WORKSTATION','SLIMETRIBE AUDIO WORKSTATION')
base=cut('const $=s=>','const P=')
# Exact renderer foundation and texture/audio code, no voxel geometry or legacy game.
(ROOT/'src/eldor-render.js').write_text(mathgl)
(ROOT/'src/eldor-textures.js').write_text(generator)
(ROOT/'src/eldor-transport.js').write_text(audio+unlock)
(ROOT/'src/eldor-daw.js').write_text(daw)
(ROOT/'src/eldor-base.js').write_text(base)
(ROOT/'src/origin.json').write_text(json.dumps({'source':'Eldor Studio XV user supplied HTML','sha256':hashlib.sha256(source.encode()).hexdigest(),'modules':[n for n,s in modules]},indent=2))
style='''body{margin:0;background:#09131d;color:#dbe9e9;font:14px system-ui}#nv{position:relative;display:flex;flex-wrap:wrap;gap:8px;padding:14px;background:#101f2d;border-bottom:1px solid #355268}main{display:flex;height:calc(100vh - 76px)}#pn{overflow:auto;padding:20px;width:370px;background:#0c1926}#cw{position:relative;flex:1;min-width:0}#cv{width:100%;height:100%;display:block}.brand{color:#63e6b2;font-weight:800;font-size:19px;margin-right:20px}button,input,select{font:inherit}button{cursor:pointer}.status{position:absolute;bottom:18px;left:20px;padding:12px;background:#09131ddd;border:1px solid #355268;border-radius:8px;pointer-events:none}.th{width:128px;height:128px;image-rendering:pixelated;margin:6px}#notice{color:#ebcf94}h2{color:#72dfbd}.adv-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:2px;margin:12px 0;touch-action:none}.adv-grid button{min-width:0;padding:0;height:27px;border:1px solid #ffffff20;border-radius:3px;font-size:14px}.adv-tools{display:flex;flex-wrap:wrap;gap:4px}.adv-tools button{font-size:12px;padding:5px}#pn textarea{display:block;width:95%}.adv-notice{color:#e4ca91}@media(max-width:760px){main{flex-direction:column;height:auto}#pn{width:auto;max-height:60vh}#cw{height:46vh;flex:none}}'''
style+='''#cine-timeline-bottom{height:250px;box-sizing:border-box;background:#101d2a;border-top:1px solid #4a6576;padding:10px;overflow:auto}.cine-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.cine-scroll{overflow:auto;max-height:195px}.cine-row{display:flex;align-items:center;height:40px}.cine-row>button{width:150px;flex:none;text-align:left;font-size:12px}.cine-rail{height:36px;position:relative;background:#19313d;flex:none}.cine-tick{position:absolute;top:0;font:9px monospace;color:#7d9ba8;border-left:1px solid #41616b;height:36px;pointer-events:none}.cine-key{position:absolute;top:11px;padding:0;width:20px;transform:translateX(-50%);background:#254a50;color:#ffe2a0;border:1px solid #86c3ac;touch-action:none;z-index:1}.cine-key.on{background:#8c6331}.cine-playhead{position:absolute;top:0;height:36px;border-left:2px solid #ef9f81;pointer-events:none;z-index:2}html[data-cine-editor="1"] main{height:calc(100vh - 330px);min-height:280px}#pn input[type=number]{max-width:85px}@media(max-width:760px){html[data-cine-editor="1"] main{height:auto}#cine-timeline-bottom{height:260px}}'''
header='''<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none';"><title>SlimeTribe · Phase 10 · Materials</title><style>'''+css+style+'''</style></head><body><nav id="nv"></nav><main><section id="pn"></section><section id="cw"><canvas id="cv"></canvas><div class="status" id="status"></div></section></main><section id="cine-timeline-bottom" style="display:none"></section>'''
mathgl+='\nlet useCanvas2D=isCanvas2D;\n'
script=base+'\nlet PRJ='+json.dumps(project)+';\nlet tab="Základ",G={paused:false},songBar=0,cs=0,hist=[],hi=-1;\n'+mathgl+generator+audio+unlock+daw+'\n'+(ROOT/'src/foundation.js').read_text()+'\n'+(ROOT/'src/model-stage.js').read_text()+'\n'+'\n'.join((ROOT/'src/game'/name).read_text() for name in ['monsters.js','game.init.variables.js','game.adventure.grid.js','game.adventure.js','game.battle.grid.js','game.battle.js','game.battle.ai.js','game.save.js','game.cutscene.js','game.scenario.js','game.scene.render.js','game.battle.animation.js','game.adventure.editor.js','game.content.js','game.quest.js','game.quest.q02.js','game.adventure.rpg.js','game.html.js','game.adventure.editor.ui.js','game.scene.fallback.js','game.scene.mode.js','game.scenario.editor.js','game.cutscene.render.js','game.cutscene.editor.js','game.quest.render.js','game.quest.ui.js','game.quest.q02.ui.js','game.adventure.rpg.ui.js','game.materials.js'])
header+= '<script data-source="slimetribe/model-core.js">'+(ROOT/'src/model-core.js').read_text()+'</script><script id="model-assets" type="application/json">'+json.dumps(assets,separators=(',',':'))+'</script>'
html=header+''.join('<script data-source="'+n+'">'+s+'</script>' for n,s in modules)+'<script id="foundation-runtime">'+script+'</script></body></html>'
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S')
(ROOT/'dist').mkdir(exist_ok=True)
out=ROOT/'dist'/('SlimeTribe-Phase10_'+stamp+'.html');out.write_text(html)
(ROOT/'build-path.txt').write_text(str(out));print(out)
