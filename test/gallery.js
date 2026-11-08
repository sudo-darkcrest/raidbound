const specs = [
 {s:'castle', L:[['fig',{race:'human',pose:'heroic',w:'hammer',off:'shield',helm:'great',cape:1,capeCol:'#3a0a14',pauld:'plate',emblem:'#ffd060',x:150,y:205,s:1.05}]]},
 {s:'peaks', L:[['fig',{race:'dwarf',pose:'aim',w:'crossbow',helm:'horned',pauld:'fur',x:140,y:205,s:1.1}],['beast',{t:'bird',x:235,y:120,s:.45}]]},
 {s:'arcane', L:[['fig',{race:'elf',pose:'castF',off:'staff',helm:'hair',robe:1,glowR:'#c8a0ff',x:140,y:205,s:1.05}]]},
 {s:'steppe', L:[['fig',{race:'orc',pose:'dual',w:'axe',off:'axe',oA:-30,helm:'mohawk',pauld:'spiked',x:150,y:205,s:1}]]},
 {s:'storm', L:[['fig',{race:'minotaur',pose:'staff',w:'totem',robe:1,glowL:'#8ab8ff',x:150,y:205,s:.95}]]},
 {s:'rooftops', L:[['fig',{race:'goblin',pose:'crouch',w:'dagger',off:'dagger',helm:'hood',x:150,y:205,s:1.2,eye:'#ffd060'}]]},
 {s:'volcano', L:[['dragon',{x:160,y:150,s:.9,breath:1}]]},
 {s:'crypthall', L:[['fig',{race:'skeleton',pose:'cast',robe:1,tatter:1,helm:'crown',dark:1,glowL:'#4aff9a',glowR:'#4aff9a',x:150,y:200,s:1.1,crownCol:'#8affc0',gem:'#4aff9a'}]]},
 {s:'forest', L:[['beast',{t:'wolf',x:150,y:200,s:1.2}]]},
 {s:'grove', L:[['beast',{t:'treant',x:150,y:205,s:.9}]]},
 {s:'altar', L:[['obj',{t:'potion',x:150,y:120,col:'#e0304a'}]]},
 {s:'altar', L:[['obj',{t:'ring',x:150,y:120,col:'#ff6a2a',sparks:1}]]},
 {s:'altar', L:[['obj',{t:'sword',x:150,y:110,s:.9}]]},
 {s:'altar', L:[['obj',{t:'helm',x:150,y:112}]]},
 {s:'void', L:[['fx',{t:'fireball',x:190,y:90}]]},
 {s:'sunken', L:[['beast',{t:'tentacle',x:120,y:210,s:1}],['beast',{t:'tentacle',x:200,y:215,s:.8,curl:-1}]]},
];
document.body.innerHTML = specs.map((s,i)=>`<img src="${RB.ART.uri(s,'g'+i)}" width="300" height="220" style="margin:4px;border:1px solid #333">`).join('');
