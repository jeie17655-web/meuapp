
const UI_STATE_KEY="vibetube-ui-v3.4";
const saveUIState=()=>{try{localStorage.setItem(UI_STATE_KEY,JSON.stringify({saved:st.saved,history:st.history,queue:st.queue,playlists:st.playlists,settings:st.settings}))}catch{}};

const NativeBridge={
  send(o){try{return !!window.NativePlayer?.postMessage(JSON.stringify(o))}catch{return false}},
  play(v){return this.send({type:"play",id:v.id,url:v.src,title:v.title,channel:v.channel})},
  pause(){return this.send({type:"pause"})}, resume(){return this.send({type:"resume"})},
  toggle(){return this.send({type:"toggle"})}, stop(){return this.send({type:"stop"})},
  seek(ms){return this.send({type:"seek",ms})}, seekBy(ms){return this.send({type:"seekBy",ms})},
  next(){return this.send({type:"next"})}, previous(){return this.send({type:"previous"})},
  speed(v){return this.send({type:"speed",value:v})}, volume(v){return this.send({type:"volume",value:v})},
  shuffle(v){return this.send({type:"shuffle",enabled:v})},
  repeat(v){return this.send({type:"repeat",mode:v})},
  queue(items,start=0){return this.send({type:"setQueue",items,start})},download(v){return this.send({type:"download",id:v.id,url:v.src})},removeDownload(v){return this.send({type:"removeDownload",id:v.id})}
};
window.addEventListener("message",e=>{
  try{
    const x=typeof e.data==="string"?JSON.parse(e.data):e.data;
    if(x.type==="playerState"){window.playerState=x;window.__nativeState?.(x)}
    if(x.type==="playerError")toast(x.message)
  }catch{}
});
NativeBridge.onState=s=>{};
window.__nativeState=s=>{ if(s.queue){window.nativeQueue=s.queue; st.nativeIndex=s.index; localStorage.setItem("vibetube-native-index",String(s.index));} 
  document.querySelectorAll("[data-progress]").forEach(e=>{
    e.max=s.durationMs>0?s.durationMs:1;e.value=s.positionMs||0
  });
  document.querySelectorAll("[data-playstate]").forEach(e=>e.textContent=s.isPlaying?"⏸":"▶");
  const pos=document.querySelector("[data-position]"),dur=document.querySelector("[data-duration]");
  if(pos)pos.textContent=fmt(s.positionMs); if(dur)dur.textContent=fmt(s.durationMs);
  const sp=document.querySelector("[data-speed]");if(sp)sp.textContent=(s.speed||1).toFixed(2)+"×";
};

async function syncPlaylist(name){
  const base=API.base;
  if(!base)return false;
  try{
    const r=await fetch(base+"/api/playlists/"+encodeURIComponent(name),{
      headers:{"Content-Type":"application/json"}
    });
    return r.ok;
  }catch{return false}
}
function restoreNativeQueue(){
  if(!window.NativePlayer || !st.queue.length)return;
  const items=st.queue.map(id=>videosById(id)).filter(Boolean);
  if(items.length) NativeBridge.queue(items,0);
}
const fmt=ms=>{if(!ms||ms<0)return"0:00";const x=Math.floor(ms/1000),m=Math.floor(x/60),s=x%60;return `${m}:${String(s).padStart(2,"0")}`};
document.querySelectorAll("[data-playstate]").forEach(e=>e.textContent=s.isPlaying?"⏸":"▶")});

const nativePlayer={
 available:()=>!!window.NativePlayer,
 send(o){try{window.NativePlayer?.postMessage(JSON.stringify(o));return true}catch(e){return false}},
 play(v){return this.send({type:"play",url:v.src,title:v.title,channel:v.channel})},
 pause(){return this.send({type:"pause"})},resume(){return this.send({type:"resume"})},stop(){return this.send({type:"stop"})}
};

import {API} from "./api.js";
const KEY="vibetube-v2";let st=JSON.parse(localStorage.getItem(KEY)||'{"saved":[],"history":[],"queue":[],"playlists":{"Assistir mais tarde":[]},"settings":{"autoplay":false,"mini":true,"ads":true}}');let current=null;
const persist=()=>{localStorage.setItem(KEY,JSON.stringify(st));saveUIState()};const toast=t=>{const e=document.querySelector("#toast");e.textContent=t;e.style.display="block";clearTimeout(e.t);e.t=setTimeout(()=>e.style.display="none",1600)};
const shell=a=>`<header class="top"><button class="icon" onclick="app.home()">☰</button><div class="brand">Vibe<b>Tube</b></div><form class="search" onsubmit="event.preventDefault();app.search(this.q.value)"><input name="q" placeholder="Pesquisar"><button>🔎</button></form><button class="icon" onclick="app.settings()">⚙️</button></header><div class="shell"><nav class="nav">${[['home','🏠','Início'],['shorts','▶️','Shorts'],['subs','📺','Inscrições'],['history','🕘','Histórico'],['playlists','📚','Playlists'],['saved','🔖','Salvos'],['settings','⚙️','Configurações']].map(x=>`<button class="${a===x[0]?'on':''}" onclick="app.${x[0]}()">${x[1]} ${x[2]}</button>`).join("")}</nav><main class="main" id="main"></main></div><nav class="bottom"><button onclick="app.home()">🏠<span>Início</span></button><button onclick="app.search('')">🔎<span>Buscar</span></button><button onclick="app.queuePage()">▶️<span>Fila</span></button><button onclick="app.settings()">⚙️<span>Ajustes</span></button></nav><div id="mini" class="mini"></div>`;
const card=v=>`<article onclick="app.watch('${v.id}')" class="card"><div class="thumb">▶<span class="duration">${v.duration}</span></div><div class="meta"><div class="avatar"></div><div><div class="title">${v.title}</div><div class="muted">${v.channel}<br>${v.views} visualizações • há 2 dias</div></div></div></article>`;
const render=(a)=>`<div class="grid">${a.map(card).join("")}</div>`;
const app={
async init(){document.querySelector("#app").innerHTML=shell("home");this.home();setTimeout(()=>NativeBridge.send({type:"state"}),700)},
async home(){document.querySelector("#app").innerHTML=shell("home");const v=await API.feed();document.querySelector("#main").innerHTML=`<div class="chips">${["Todos","Música","Jogos","Tecnologia","Notícias"].map(x=>`<button class="chip" onclick="app.category('${x}')">${x}</button>`).join("")}</div>${render(v)}`},
async category(c){document.querySelector("#app").innerHTML=shell("home");const v=c==="Todos"?await API.feed(): (await API.feed()).filter(x=>x.cat===c);document.querySelector("#main").innerHTML=render(v)},
async search(q){document.querySelector("#app").innerHTML=shell("home");document.querySelector("#main").innerHTML=`<div class="filters"><span class="pill">Filtros</span><span class="pill">Data</span><span class="pill">Duração</span><span class="pill">Relevância</span></div>`+render(await API.search(q))},
async watch(id){current=await API.video(id);if(!current)return;st.history=[id,...st.history.filter(x=>x!==id)].slice(0,50);persist();document.querySelector("#app").innerHTML=shell();document.querySelector("#main").innerHTML=`<section class="page watch"><button class="back" onclick="app.home()">← Voltar</button><div class="panel">
<div id="nativePlayerBox" style="aspect-ratio:16/9;background:#000;border-radius:12px;display:grid;place-items:center">
  <button class="pill" onclick="app.nativePlay()">▶ Reproduzir com player Android</button><button class="pill" onclick="NativeBridge.download(current)">⬇ Offline</button><button class="pill" onclick="window.NativePlayer?.postMessage(JSON.stringify({type:'pip'}))">▣ PiP</button>
</div>
<div style="display:flex;align-items:center;gap:8px;margin-top:10px">
  <button class="icon" onclick="NativeBridge.previous()">⏮</button>
  <button class="icon" onclick="NativeBridge.toggle()" data-playstate>▶</button>
  <button class="icon" onclick="NativeBridge.next()">⏭</button>
  <span data-position>0:00</span>
  <input data-progress type="range" min="0" max="1" value="0" style="flex:1" oninput="NativeBridge.seek(this.value)">
  <span data-duration>0:00</span>
</div>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
  <button class="pill" onclick="NativeBridge.seekBy(-10000)">−10s</button>
  <button class="pill" onclick="NativeBridge.seekBy(10000)">+10s</button>
  <button class="pill" onclick="NativeBridge.speed(.5)">0.5×</button>
  <button class="pill" onclick="NativeBridge.speed(1)">1×</button>
  <button class="pill" onclick="NativeBridge.speed(1.5)">1.5×</button>
  <button class="pill" onclick="NativeBridge.speed(2)">2×</button>
  <button class="pill" onclick="NativeBridge.shuffle(true)">🔀</button>
  <button class="pill" onclick="NativeBridge.repeat(0)">↻ Off</button>
  <button class="pill" onclick="NativeBridge.repeat(1)">↻ Um</button>
  <button class="pill" onclick="NativeBridge.repeat(2)">↻ Todos</button>
</div>
</div><h2>${current.title}</h2><div class="muted">${current.channel} • ${current.views} visualizações</div><div class="actions"><button onclick="app.save()">🔖 ${st.saved.includes(id)?"Salvo":"Salvar"}</button><button onclick="app.addQueue('${id}')">＋ Fila</button><button onclick="app.channel('${current.channel}')">👤 ${current.channel}</button><button onclick="app.share()">↗ Compartilhar</button><button onclick="app.miniplayer()">▣ Mini-player</button></div><div class="comments"><b>Comentários</b><div class="comment">Comentários locais de demonstração.</div><div class="comment">A API pode ser conectada depois.</div></div><div class="queue"><b>Próximos</b>${st.queue.map(id=>API.video(id)).map(p=>p).length?st.queue.map(id=>videosById(id)).filter(Boolean).map(x=>`<div class="queue-item">${x.title}</div>`).join(""):"<div class='muted'>Fila vazia</div>"}</div></section>`},
async channel(n){const c=await API.channel(n);document.querySelector("#app").innerHTML=shell();document.querySelector("#main").innerHTML=`<section class="page"><div class="panel"><h1>${c.name}</h1><div class="muted">${c.subscribers} inscritos</div><p>${c.description}</p><button class="pill" onclick="toast('Inscrição salva localmente')">Inscrever-se</button></div><h2>Vídeos</h2>${render(c.videos)}</section>`},
nativePlay(){if(NativeBridge.play(current)){toast("Player Android iniciado")}else{toast("Abra no APK para usar o player nativo")}},
nativePause(){NativeBridge.pause()},
nativeResume(){NativeBridge.resume()},
nativeSeek(v){NativeBridge.seek(Number(v))}, save(){if(st.saved.includes(current.id))st.saved=st.saved.filter(x=>x!==current.id);else st.saved.push(current.id);persist();toast("Salvo localmente");this.watch(current.id)},
addQueue(id){if(!st.queue.includes(id))st.queue.push(id);persist();toast("Adicionado à fila")},
queuePage(){document.querySelector("#app").innerHTML=shell();document.querySelector("#main").innerHTML=`<section class="page"><h2>Fila de reprodução</h2><div class="queue">${st.queue.length?st.queue.map(id=>videosById(id)).filter(Boolean).map(v=>`<div class="queue-item"><span>▶</span><div><b>${v.title}</b><div class="muted">${v.channel}</div></div></div>`).join(""):"<div class='empty'>Fila vazia.</div>"}</div></section>`},
playlists(){document.querySelector("#app").innerHTML=shell("playlists");document.querySelector("#main").innerHTML=`<section class="page"><h2>Playlists</h2>${Object.entries(st.playlists).map(([n,a])=>`<div class="panel"><b>${n}</b><div class="muted">${a.length} vídeos</div></div>`).join("")}<button class="pill" onclick="app.newPlaylist()">＋ Nova playlist</button></section>`},
newPlaylist(){let n=prompt("Nome da playlist:");if(n){st.playlists[n]=[];persist();syncPlaylist(n);this.playlists()}},
saved(){document.querySelector("#app").innerHTML=shell("saved");let a=st.saved.map(videosById).filter(Boolean);document.querySelector("#main").innerHTML=`<section class="page"><h2>Salvos</h2>${a.length?render(a):"<div class='empty'>Nenhum vídeo salvo.</div>"}</section>`},
history(){document.querySelector("#app").innerHTML=shell("history");let a=st.history.map(videosById).filter(Boolean);document.querySelector("#main").innerHTML=`<section class="page"><h2>Histórico</h2>${a.length?render(a):"<div class='empty'>Histórico vazio.</div>"}</section>`},
shorts(){document.querySelector("#app").innerHTML=shell();document.querySelector("#main").innerHTML=`<section class="page"><h2>Shorts</h2>${render((awaitFeed()).slice(0,4))}</section>`},
subs(){document.querySelector("#app").innerHTML=shell("subs");document.querySelector("#main").innerHTML='<section class="page"><h2>Inscrições</h2><div class="panel">Conecte a API de contas para sincronizar canais.</div></section>'},
settings(){document.querySelector("#app").innerHTML=shell("settings");document.querySelector("#main").innerHTML=`<section class="page"><h2>Configurações</h2>${[['autoplay','Reprodução automática'],['mini','Mini-player'],['ads','Ocultar componentes publicitários da própria interface']].map(([k,n])=>`<div class="setting">${n}<button class="switch ${st.settings[k]?'on':''}" onclick="app.set('${k}',this)"><i></i></button></div>`).join("")}<div class="panel"><button class="pill" onclick="NativeBridge.send({type:'state'})">↻ Restaurar estado do player</button> <button class="pill" onclick="NativeBridge.send({type:'clearState'});toast('Estado nativo limpo')">Limpar estado</button></div><div class="panel"><b>Arquitetura APK</b><p class="muted">Frontend modular + API separada + PWA. Pode ser empacotado posteriormente com Capacitor ou WebView.</p></div></section>`},
set(k,e){st.settings[k]=!st.settings[k];e.classList.toggle("on");persist()},
miniplayer(){const m=document.querySelector("#mini");m.innerHTML=`<div class="mini-row"><video src="${current.src}" controls autoplay muted></video><div><b>${current.title}</b><div class="muted">${current.channel}</div></div><button class="mini-close" onclick="m.style.display='none'">×</button></div>`;m.style.display="block"},
share(){navigator.share?navigator.share({title:current.title,url:location.href}):navigator.clipboard?.writeText(location.href).then(()=>toast("Link copiado"))}
};
async function awaitFeed(){return await API.feed()} function videosById(id){return window._videos?.find(v=>v.id===id)} window._videos=[];API.feed().then(v=>window._videos=v);window.app=app;app.init();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
