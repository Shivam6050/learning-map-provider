import {request as httpsRequest} from "node:https";
import {request as httpRequest} from "node:http";
import {lookup} from "node:dns";
import {isSafeHttpUrl} from "./url-safety";
/** Resolve and validate at connection time. TLS still verifies the original hostname. */
export function publicPageFetch(raw:string, init:{signal?:AbortSignal;headers?:Record<string,string>}={}):Promise<Response> {
 if(!isSafeHttpUrl(raw))return Promise.reject(new Error("Unsafe destination"));
 const url=new URL(raw);
 return new Promise((resolve,reject)=>{
  const request=url.protocol==="https:"?httpsRequest:httpRequest;
  const req=request(url,{method:"GET",agent:false,signal:init.signal,headers:{...init.headers,"Accept-Encoding":"identity"},lookup:(hostname,options,callback)=>{
   lookup(hostname,{family:4},(error,address,family)=>{
    if(error)return callback(error,"",4);
    if(!isSafeHttpUrl("https://"+address))return callback(new Error("Non-public destination"),"",4);
    // Node may request an array for automatic address-family selection.
    if(options.all)callback(null,[{address,family}]);else callback(null,address,family);
   });
  }},res=>{
   const chunks:Buffer[]=[];let size=0;
   res.on("data",(chunk:Buffer)=>{size+=chunk.length;if(size>1_000_000){res.destroy(new Error("Page exceeds verification limit"));return;}chunks.push(chunk);});
   res.on("error",reject);
   res.on("end",()=>{
    const headers=new Headers();for(const [key,value] of Object.entries(res.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(", "):value);
    const status=res.statusCode || 502;
    resolve(new Response([204,205,304].includes(status)?null:Buffer.concat(chunks),{status,headers}));
   });
  });
  req.on("error",reject);req.end();
 });
}
