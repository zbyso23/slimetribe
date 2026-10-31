"""Run the independent rule suites and DOM integration gates; no browser claim."""
from pathlib import Path
import argparse,datetime,json,os,shutil,subprocess,sys,time
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--native',action='store_true',help='Use optional @napi-rs/canvas from CODEX_PRIMARY_RUNTIME_NODE_MODULES');args=parser.parse_args()
node=os.environ.get('CODEX_PRIMARY_RUNTIME_NODE') or shutil.which('node')
if not node:raise SystemExit('Node.js is required for the source test suite.')
jobs=[(n,n,{}) for n in ['models','calibration','dsp','game','adventure-editor','scenario','cutscene','quest','q02','campaign','rpg','rpg-orientation','runtime']]+[('runtime-gl','runtime',{'MOCK_GL':'1'})]
results=[]
for label,name,extra in jobs:
 env=os.environ.copy();env.pop('MOCK_GL',None);env.pop('AUTO_FALLBACK',None);env.pop('NATIVE_CANVAS',None);env.update(extra)
 if args.native:env['NATIVE_CANVAS']='1'
 started=time.monotonic();p=subprocess.run([node,str(root/'tests'/f'{name}.cjs')],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (root/'tests'/f'{label}.log').write_text(p.stdout);result={'suite':label,'exit_code':p.returncode,'assertion_groups_passed':p.stdout.count('PASS '),'seconds':round(time.monotonic()-started,3)};results.append(result);print(('PASS' if p.returncode==0 else 'FAIL')+' '+label,flush=True)
 if p.returncode:print(p.stdout,flush=True)
report={'version':1,'created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'native_canvas':args.native,'browser_verified':False,'suites':results,'all_passed':all(r['exit_code']==0 for r in results),'note':'Assertion groups are not line/branch coverage. Mock WebGL and DOM harness are not browser tests.'}
(root/'tests/results.json').write_text(json.dumps(report,indent=2));sys.exit(0 if report['all_passed'] else 1)
