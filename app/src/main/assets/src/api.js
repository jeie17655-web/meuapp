
const API_BASE=localStorage.getItem("apiBaseUrl")||"";
const TOKEN_KEY="vibetube-access-token";
const CACHE_KEY="vibetube-feed-cache-v3.8";
const DEVICE_ID=localStorage.getItem("vibetube-device-id")||crypto.randomUUID();
localStorage.setItem("vibetube-device-id",DEVICE_ID);
const demo=[
{id:"1",title:"Paisagem cinematográfica",channel:"Vibe Studio",cat:"Tecnologia",views:"12 mil",duration:"04:21",src:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"},
{id:"2",title:"Natureza em movimento",channel:"Vídeos Demo",cat:"Música",views:"8,4 mil",duration:"02:18",src:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"},
{id:"3",title:"Experiência de vídeo HTML5",channel:"Web Lab",cat:"Jogos",views:"21 mil",duration:"06:12",src:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}];

export const Auth={
 token:()=>localStorage.getItem(TOKEN_KEY)||"",
 setToken:t=>localStorage.setItem(TOKEN_KEY,t),
 logout:()=>localStorage.removeItem(TOKEN_KEY),
 loggedIn:()=>!!localStorage.getItem(TOKEN_KEY)
};
async function request(path,options={}){
 const headers={"Content-Type":"application/json",...(options.headers||{})};
 const token=Auth.token(); if(token)headers.Authorization="Bearer "+token;
 const r=await fetch(API_BASE+path,{...options,headers});
 if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||`HTTP ${r.status}`);
 return r.json();
}
async function get(path,fallback){
 if(!API_BASE)return fallback;
 try{return await request(path)}catch{return fallback}
}

async function cached(path,fallback){
  try{
    const r=await fetch(API_BASE+path);
    if(!r.ok)throw Error();
    const data=await r.json();
    localStorage.setItem(CACHE_KEY,JSON.stringify({path,data,at:Date.now()}));
    return data;
  }catch{
    try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");return c?.data||fallback}catch{return fallback}
  }
}
export const API={
 base:API_BASE,
 feed:()=>cached("/api/videos",demo),
 search:q=>cached("/api/search?q="+encodeURIComponent(q),demo.filter(v=>(v.title+v.channel+v.cat).toLowerCase().includes(q.toLowerCase()))),
 video:id=>get("/api/videos/"+encodeURIComponent(id),demo.find(v=>v.id===id)),
 register:async(email,password)=>{const x=await request("/api/auth/register",{method:"POST",body:JSON.stringify({email,password})});Auth.setToken(x.token);return x},
 login:async(email,password)=>{const x=await request("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});Auth.setToken(x.token);return x},
 me:()=>request("/api/me"),
 playlists:()=>request("/api/playlists"),
 savePlaylists:p=>request("/api/playlists",{method:"PUT",body:JSON.stringify({items:p,deviceId:DEVICE_ID,updatedAt:Date.now()})}),
 history:()=>request("/api/history"),
 saveHistory:h=>request("/api/history",{method:"PUT",body:JSON.stringify({items:h,deviceId:DEVICE_ID,updatedAt:Date.now()})}),
 resume:()=>request("/api/resume"),
 saveResume:r=>request("/api/resume",{method:"PUT",body:JSON.stringify(r)})
};
