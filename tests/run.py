"""Run the independent rule suites and DOM integration gates; no browser claim."""
from pathlib import Path
import argparse,datetime,json,os,shutil,subprocess,sys,time
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--gpu',action='store_true',help='Compile/rasterize GLSL with local Mesa EGL');parser.add_argument('--native',action='store_true',help='Use optional @napi-rs/canvas from CODEX_PRIMARY_RUNTIME_NODE_MODULES');args=parser.parse_args()
node=os.environ.get('CODEX_PRIMARY_RUNTIME_NODE') or shutil.which('node')
if not node:raise SystemExit('Node.js is required for the source test suite.')
jobs=[(n,n,{}) for n in ['models','calibration','materials','dsp','game','adventure-editor','scenario','cutscene','quest','arrival','q02','q03','q04','recipes','quest-objects','i18n','toxic','campaign','rpg','rpg-orientation','battle-intent','player','ui','runtime']]+[('runtime-gl','runtime',{'MOCK_GL':'1'}),('player-gl','player',{'MOCK_GL':'1'}),('ui-gl','ui',{'MOCK_GL':'1'}),('mobile','mobile',{'MOCK_GL':'1'}),('toxic-ui','toxic-ui',{}),('toxic-ui-gl','toxic-ui',{'MOCK_GL':'1'}),('recipes-ui','recipes-ui',{'MOCK_GL':'1'}),('i18n-ui','i18n-ui',{}),('i18n-ui-gl','i18n-ui',{'MOCK_GL':'1'}),('quest-objects-ui','quest-objects-ui',{'MOCK_GL':'1'})]
results=[]
for label,name,extra in jobs:
 env=os.environ.copy();env.pop('MOCK_GL',None);env.pop('AUTO_FALLBACK',None);env.pop('NATIVE_CANVAS',None);env.update(extra)
 if args.native:env['NATIVE_CANVAS']='1'
 started=time.monotonic();p=subprocess.run([node,str(root/'tests'/f'{name}.cjs')],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (root/'tests'/f'{label}.log').write_text(p.stdout);result={'suite':label,'exit_code':p.returncode,'assertion_groups_passed':p.stdout.count('PASS '),'seconds':round(time.monotonic()-started,3)};results.append(result);print(('PASS' if p.returncode==0 else 'FAIL')+' '+label,flush=True)
 if p.returncode:print(p.stdout,flush=True)
if args.gpu:
 started=time.monotonic();p=subprocess.run([sys.executable,str(root/'tests/shader-gpu.py')],cwd=root,env=os.environ.copy(),text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (root/'tests/shader-gpu.log').write_text(p.stdout);results.append({'suite':'shader-gpu','exit_code':p.returncode,'assertion_groups_passed':p.stdout.count('PASS '),'seconds':round(time.monotonic()-started,3)});print(('PASS' if p.returncode==0 else 'FAIL')+' shader-gpu',flush=True)
 if p.returncode:print(p.stdout,flush=True)
report={'version':1,'created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'native_canvas':args.native,'native_shader_gpu':args.gpu,'browser_verified':False,'suites':results,'all_passed':all(r['exit_code']==0 for r in results),'note':'Assertion groups are not line/branch coverage. Mock WebGL and DOM harness are not browser tests.'}
(root/'tests/results.json').write_text(json.dumps(report,indent=2));sys.exit(0 if report['all_passed'] else 1)
