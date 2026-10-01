import {it,expect} from "vitest";
import {pathCost} from "./path-cost";
it("excludes owned courses and subscriptions without zeroing provider prices",()=>{
 const owned={url:"https://scrimba.com/course",price:5000,signals:{already_owned:true,price_source:"scrimba_regional_plan",billing_interval:"year"}};
 expect(pathCost([{estimated_hours:100,resources:[owned,{url:"https://example.com/course",price:200}]}]).total).toBe(200);
 expect(owned.price).toBe(5000);
});
