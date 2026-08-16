import express from "express";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";

const app=express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

const PORT=process.env.PORT||8080;
const JWT_SECRET=process.env.JWT_SECRET||"CHANGE_ME_IN_PRODUCTION";
const DB_FILE=process.env.DB_FILE||"./vibetube-db.json";

const seedVideos=[
 {id:"1",title:"Paisagem cinematográfica",channel:"Vibe Studio",category:"Tecnologia",views:12000,duration:261,src:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"},
 {id:"2",title:"Natureza em movimento",channel:"Vídeos Demo",category:"Música",views:8400,duration:138,src:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"},
 {id:"3",title:"Experiência de vídeo HTML5",channel:"Web Lab",category:"Jogos",views:21000,duration:372,src:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}
];

function loadDB(){
 try{return JSON.parse(fs.readFileSync(DB_FILE,"utf8"))}
 catch{return {users:[],playlists:{},history:{},resume:{}}}
}
let db=loadDB();
function saveDB(){fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2))}
function syncRecord(current, incoming, deviceId){
 const now=Date.now();
 if(!current) return {value:incoming,updatedAt:now,version:1,deviceId};
 if(Number(incoming?.updatedAt||0) >= Number(current.updatedAt||0))
   return {value:incoming,updatedAt:now,version:Number(current.version||0)+1,deviceId};
 return current;
}
function hashPassword(password,salt=crypto.randomBytes(16).toString("hex")){
 const hash=crypto.scryptSync(password,salt,64).toString("hex");
 return `${salt}:${hash}`;
}
function checkPassword(password,stored){
 const [salt,hash]=String(stored).split(":");
 if(!salt||!hash)return false;
 const candidate=crypto.scryptSync(password,salt,64).toString("hex");
 return crypto.timingSafeEqual(Buffer.from(hash,"hex"),Buffer.from(candidate,"hex"));
}
function token(user){return jwt.sign({sub:user.id,email:user.email},JWT_SECRET,{expiresIn:"30d"})}
function auth(req,res,next){
 const h=req.headers.authorization||"";
 if(!h.startsWith("Bearer "))return res.status(401).json({error:"unauthorized"});
 try{req.user=jwt.verify(h.slice(7),JWT_SECRET);next()}catch{return res.status(401).json({error:"invalid_token"})}
}

app.get("/api/health",(req,res)=>res.json({ok:true,version:"3.5"}));
app.get("/api/videos",(req,res)=>res.json(seedVideos));
app.get("/api/videos/:id",(req,res)=>{
 const v=seedVideos.find(x=>x.id===req.params.id);
 v?res.json(v):res.status(404).json({error:"not_found"});
});
app.get("/api/search",(req,res)=>{
 const q=String(req.query.q||"").toLowerCase();
 res.json(seedVideos.filter(v=>(v.title+" "+v.channel+" "+v.category).toLowerCase().includes(q)));
});

app.post("/api/auth/register",(req,res)=>{
 const email=String(req.body.email||"").trim().toLowerCase();
 const password=String(req.body.password||"");
 if(!email||password.length<8)return res.status(400).json({error:"email_and_password_required"});
 if(db.users.some(u=>u.email===email))return res.status(409).json({error:"email_exists"});
 const user={id:crypto.randomUUID(),email,password:hashPassword(password),createdAt:new Date().toISOString()};
 db.users.push(user);saveDB();
 res.json({token:token(user),user:{id:user.id,email:user.email}});
});
app.post("/api/auth/login",(req,res)=>{
 const email=String(req.body.email||"").trim().toLowerCase(),password=String(req.body.password||"");
 const user=db.users.find(u=>u.email===email);
 if(!user||!checkPassword(password,user.password))return res.status(401).json({error:"invalid_credentials"});
 res.json({token:token(user),user:{id:user.id,email:user.email}});
});
app.get("/api/me",auth,(req,res)=>{
 const u=db.users.find(x=>x.id===req.user.sub);
 u?res.json({id:u.id,email:u.email}):res.status(404).json({error:"not_found"});
});

app.get("/api/playlists",auth,(req,res)=>{
 const x=db.playlists[req.user.sub];
 res.json(x||{items:[],updatedAt:null,version:0});
});
app.put("/api/playlists",auth,(req,res)=>{
 const incoming={items:Array.isArray(req.body?.items)?req.body.items:(Array.isArray(req.body)?req.body:[]),updatedAt:Number(req.body?.updatedAt||0)};
 db.playlists[req.user.sub]=syncRecord(db.playlists[req.user.sub],incoming,String(req.body?.deviceId||"unknown"));
 saveDB();res.json({ok:true,...db.playlists[req.user.sub]});
});

app.get("/api/history",auth,(req,res)=>res.json(db.history[req.user.sub]||{items:[],updatedAt:null,version:0}));
app.put("/api/history",auth,(req,res)=>{
 const incoming={items:Array.isArray(req.body?.items)?req.body.items:(Array.isArray(req.body)?req.body:[]),updatedAt:Number(req.body?.updatedAt||0)};
 db.history[req.user.sub]=syncRecord(db.history[req.user.sub],incoming,String(req.body?.deviceId||"unknown"));
 saveDB();res.json({ok:true,...db.history[req.user.sub]});
});

app.get("/api/resume",auth,(req,res)=>res.json(db.resume[req.user.sub]||null));
app.put("/api/resume",auth,(req,res)=>{
 const body=req.body||{};
 db.resume[req.user.sub]={videoId:String(body.videoId||""),positionMs:Number(body.positionMs||0),queue:Array.isArray(body.queue)?body.queue:[],index:Number(body.index||0),updatedAt:new Date().toISOString()};
 saveDB();res.json({ok:true,resume:db.resume[req.user.sub]});
});

app.listen(PORT,()=>console.log(`VibeTube API v3.5 on :${PORT}`));
