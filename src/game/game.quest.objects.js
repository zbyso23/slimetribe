/* Semantic quest props are presentation data derived from existing roles.
   They never change object IDs, collision cells, save data or interaction rules. */
Game.QuestObjects={};
(function(O,P){
const stone=[.42,.48,.43],dark=[.2,.28,.27],wood=[.47,.32,.19],gold=[.82,.65,.28],cyan=[.26,.77,.7],red=[.72,.21,.19];
const box=(x,y,z,w,h,d,color=stone,surface='matte')=>({shape:'box',x,y,z,w,h,d,color,surface});
const cyl=(x,y,z,w,h,d,color=stone,n=10,top=1,surface='matte')=>({shape:'cylinder',x,y,z,w,h,d,color,n,top,surface});
const ring=(x,y,z,r,t,color=gold,surface='matte',axis='y')=>({shape:'ring',x,y,z,r,t,color,surface,axis,n:16});
const beam=(a,b,r,color=wood)=>({shape:'beam',a,b,r,color,surface:'matte',n:8});
const base=[box(0,0,-.32,.65,.06,.26,dark),box(0,.06,-.32,.56,.045,.22,stone)];
const lectern=(glyphs,color=cyan)=>[...base,box(0,.105,-.32,.44,.38,.13,stone),box(0,.485,-.32,.5,.045,.18,gold),...[-.397,-.243].flatMap(z=>Array.from({length:glyphs},(_,i)=>box((i-(glyphs-1)/2)*.09,.2+(i%2)*.06,z,.035,.16,.022,color,'rune')))];
Object.assign(P.recipes,{
 objective_marker:[ring(0,.025,0,.32,.014,gold),...[-1,1].map(x=>box(x*.35,.014,0,.06,.022,.1,gold))],
 objective_camp:[{shape:'mesh',surface:'matte',color:[.35,.43,.28],triangles:[...[-1,1].flatMap(sign=>{const a=[sign*.32,.1,-.46],b=[0,.68,-.46],c=[0,.68,-.18],d=[sign*.32,.1,-.18];return[[a,b,c],[a,c,d],[a,c,b],[a,d,c]]})]},...[-.29,.29].map(x=>beam([x,.02,-.32],[0,.66,-.32],.035)),box(0,.65,-.32,.72,.055,.15,wood),...[-.26,.26].map(x=>box(x,.03,-.32,.16,.12,.2,wood)),cyl(0,.05,-.32,.22,.09,.18,dark),ring(0,.16,-.32,.105,.02,gold)],
 objective_spring:[...base,cyl(0,.105,-.32,.24,.13,.2,stone,12),{shape:'annulus',x:0,y:.235,z:-.32,r:.13,inner:.095,h:.06,n:16,color:stone,surface:'matte'},cyl(0,.24,-.32,.19,.025,.19,cyan,16,1,'water'),box(.17,.105,-.32,.07,.26,.09,stone),box(.1,.33,-.32,.19,.035,.08,stone)],
 objective_core:[...base,cyl(0,.105,-.32,.28,.08,.2,gold,8),cyl(0,.185,-.32,.2,.35,.16,cyan,6,.7,'rune'),cyl(0,.535,-.32,.14,.12,.112,cyan,6,0,'rune'),...[-.21,.21].map(x=>box(x,.105,-.32,.05,.43,.1,gold))],
 objective_record:lectern(1),objective_copy:lectern(2,[.55,.72,.92]),objective_commentary:lectern(3,[.7,.52,.78]),
 objective_fragment:[...base,cyl(0,.105,-.32,.25,.08,.2,stone,8),cyl(-.05,.185,-.32,.17,.23,.14,cyan,5,.75,'rune'),cyl(-.05,.415,-.32,.1275,.1,.105,cyan,5,0,'rune'),cyl(.12,.15,-.32,.1,.17,.09,gold,5,.5,'rune')],
 objective_meeting:[...base,...[-.23,.23].map(x=>cyl(x,.105,-.32,.12,.3,.12,stone,8)),box(0,.4,-.32,.58,.055,.18,stone),box(0,.455,-.32,.3,.035,.13,gold),cyl(0,.49,-.32,.1,.11,.1,cyan,6,.5,'rune')],
 objective_exit:[...[-.31,.31].map(x=>box(x,0,-.32,.1,.72,.17,stone)),box(0,.72,-.32,.72,.09,.2,stone),...[-.31,.31].flatMap(x=>[-.42,-.22].map(z=>box(x,.62,z,.04,.17,.035,cyan,'rune')))],
 objective_control:[...base,cyl(0,.105,-.32,.16,.24,.15,gold),ring(0,.49,-.32,.14,.025,gold,'matte','z'),...[-1,1].map(x=>beam([0,.49,-.32],[x*.14,.49,-.32],.015,gold)),beam([0,.35,-.32],[0,.63,-.32],.015,gold)],
 objective_battle:[ring(0,.025,0,.31,.018,red),box(0,0,-.34,.18,.055,.18,dark),beam([-.2,.08,-.34],[.2,.63,-.34],.025,stone),beam([.2,.08,-.34],[-.2,.63,-.34],.025,stone),box(0,.37,-.355,.1,.13,.025,red,'rune')]
});
O.kind=function(a,o){const d=a.quest,roles={...(d?.roles||{}),...(d?.arrival||{})},role=Object.keys(roles).find(k=>roles[k]===o.id);if(Object.hasOwn(o,'seed'))return'objective_battle';if(o.type==='spring')return'objective_spring';if(role==='camp'||role==='refugees'||role==='locals')return'objective_camp';if(role==='core')return'objective_core';if(role==='primary')return'objective_record';if(role==='copy')return'objective_copy';if(role==='commentary')return'objective_commentary';if(role==='evidence'||o.id==='sediment')return'objective_fragment';if(['escape','gate'].includes(role))return'objective_exit';if(['valveA','valveB','bypass','intake','bridge_switch'].includes(role))return'objective_control';if(['seren','envoy'].includes(role))return'objective_meeting';return'objective_record'};
O.spent=function(a,o,q){const role=Object.keys(a.quest?.roles||{}).find(k=>a.quest.roles[k]===o.id);return !!(a.usedObjects?.includes(o.id)||q&&(q.rested&&role==='camp'||q.escorted&&role==='refugees'||q.evidence&&role==='evidence'||q.witness&&role==='envoy'||q.sigils?.includes(role)||role?.startsWith('memory_')&&(q.memory?.includes(role)||q.sigils?.includes('moren'))||q.id==='q03'&&role==='camp'&&q.rests?.includes(q.stage==='core-ready'?'core':'seals')||q.nodes?.includes(o.id)||q.read?.includes(o.id)||q.valves?.includes(o.id)||q.flow?.bypass&&role==='bypass'||q.flow?.intake===false&&role==='intake'||q.bridgeMarks?.includes(role==='bank_a'?1:role==='bank_b'?2:0)))};
O.decorate=function(a,q,ambient){const roles=a.quest?.roles||{};return ambient.map(p=>{const o=a.objects?.find(o=>Math.abs(p.x-o.x)<.15&&Math.abs(p.z-o.y)<.15),role=o&&Object.keys(roles).find(k=>roles[k]===o.id);if(p.kind==='rune'&&['primary','copy','commentary','core','evidence','gate'].includes(role))return{...p,kind:O.kind(a,o),w:1,h:1,d:1,questObject:o.id,spent:O.spent(a,o,q)};return p})};
O.props=function(a,q=null,ambient=[]){if(!a?.objects||!a?.plane)return[];return[...a.objects,...(a.encounters||[]).filter(e=>!e.resolved)].flatMap(o=>{const existing=ambient.some(p=>Math.abs(p.x-o.x)<.15&&Math.abs(p.z-o.y)<.15),spent=O.spent(a,o,q),descriptor=kind=>({kind,x:o.x,z:o.y,w:1,h:1,d:1,questObject:o.id,spent});return existing?[descriptor('objective_marker')]:[descriptor('objective_marker'),descriptor(O.kind(a,o))]})};
const parts=P.parts;P.parts=function(p){const result=parts(p);return p.spent?result.map(s=>({...s,surface:s.surface==='water'?'water':'matte',color:s.color.map(v=>v*.42+.09)})):result};
})(Game.QuestObjects,Game.Scene.Props);
