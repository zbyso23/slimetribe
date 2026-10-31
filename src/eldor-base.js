const $=s=>document.querySelector(s),esc=s=>String(s).replace(/"/g,'&quot;'),hexc=h=>{h=String(h||'#ffffff');if(/^#[0-9a-f]{3}$/i.test(h))h='#'+[1,2,3].map(i=>h[i]+h[i]).join('');return[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255||0)};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
