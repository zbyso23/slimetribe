/* Bake all sub-primitives before GPU upload. Existing material batching draws the
   three recipes plus other matte architecture together in a single draw call. */
(function(P,V){
const mesh=V.mesh,cache=new Map();V.mesh=function(context){const key=JSON.stringify(context.props);if(cache.has(key))return cache.get(key);const geometry=mesh({...context,props:context.props.filter(p=>!P.recipes[p.kind])}).concat(P.batch(context.props.filter(p=>P.recipes[p.kind])));if(cache.size>=16)cache.delete(cache.keys().next().value);cache.set(key,geometry);return geometry};
const context=V.context;V.context=function(){const c=context(),editor=['Adventure','Cutscény'].includes(tab),props=editor?adventureDraft.props:tab==='Hra'&&gameData.mode==='adventure'?gameData.adventure.props:null;if(!props?.length)return c;return{...(c||{}),props:[...(c?.props||[]),...props]}};
})(Game.Scene.Props,Game.Quest.Visual);
