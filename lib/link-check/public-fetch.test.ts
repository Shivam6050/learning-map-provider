import {it,expect,vi} from "vitest";
const state=vi.hoisted(()=>({address:"127.0.0.1"}));
vi.mock("node:dns",()=>({lookup:(_host:string,_options:unknown,callback:(error:null,address:string,family:number)=>void)=>callback(null,state.address,4)}));
vi.mock("node:https",async()=>{
 const {EventEmitter}=await import("node:events");
 return {request:(_url:URL,options:{lookup:(host:string,options:{all:boolean},callback:(error:Error|null,address:string,family?:number)=>void)=>void})=>{
  const req=new EventEmitter();return Object.assign(req,{end(){options.lookup("provider.example",{all:false},(error,address)=>req.emit("error",error || new Error("Pinned destination: "+address)));}});
 }};
});
import {publicPageFetch} from "./public-fetch";
it("rejects a public-looking hostname that resolves to a private IP",async()=>{state.address="10.0.0.1";await expect(publicPageFetch("https://provider.example/course")).rejects.toThrow("Non-public destination");});
it("passes the checked address directly to the connection lookup callback",async()=>{state.address="8.8.8.8";await expect(publicPageFetch("https://provider.example/course")).rejects.toThrow("Pinned destination: 8.8.8.8");});
