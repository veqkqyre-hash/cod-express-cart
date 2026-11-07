import { spawn } from "node:child_process";
import { cp, mkdir, writeFile, readFile, stat, rm } from "node:fs/promises";
import path from "node:path";

const dest=path.resolve("static-preview");
const pub=path.resolve(".output/public");
const server=path.resolve(".output/server/index.mjs");
const routes=["/","/shop/","/cart/","/checkout/","/admin/","/contact/","/account/","/auth/","/wishlist/","/shipping/","/returns/","/terms/","/privacy/","/faq/","/blog/","/pos-display/"];
const exists=async p=>stat(p).then(()=>true,()=>false);
if (!await exists(server) || !await exists(pub)) throw Error("Build missing .output/server or .output/public");
await rm(dest,{recursive:true,force:true});
await mkdir(dest,{recursive:true});
await cp(pub,dest,{recursive:true});
const port="41987";
const child=spawn(process.execPath,[server],{env:{...process.env,NODE_ENV:"production",PORT:port,NITRO_PORT:port,HOST:"127.0.0.1"},stdio:"ignore"});
const origin="http://127.0.0.1:"+port;
try {
  let ready=false;
  for(let i=0;i<25;i++){try{const r=await fetch(origin+"/");if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}
  if(!ready) throw Error("SSR server did not respond");
  for(const route of routes){
    const response=await fetch(origin+route);
    const html=await response.text();
    if(!response.ok || !/^\s*<!doctype html/i.test(html) || /Something went wrong|This page didn't load/i.test(html)){
      throw Error("Cannot export "+route+" ("+response.status+")");
    }
    const dir=path.join(dest,route);
    await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,"index.html"),html);
  }
  const homepage=await readFile(path.join(dest,"index.html"),"utf8");
  if(/sb_secret_|SUPABASE_SERVICE_ROLE_KEY|-----BEGIN .*PRIVATE KEY-----/.test(homepage)) throw Error("Possible credential exposure");
  await writeFile(path.join(dest,"NOT_READY_FOR_PRODUCTION.txt"),"PREVIEW ONLY. TanStack server functions are not migrated to PHP. Never extract this artifact into the live cPanel document root.\n");
  console.log("Static preview exported (NOT PRODUCTION READY)");
}finally{child.kill("SIGTERM")}
