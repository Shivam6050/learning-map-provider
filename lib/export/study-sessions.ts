export type StudyStage = { id:string; title:string; description:string; estimated_hours:number };
export function studySessions(stages: StudyStage[], weeklyHours:number, date:string, time:string, days:number[]) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new Error('Choose a valid start date and time');
 const start=new Date(date+'T00:00:00Z');if(!Number.isFinite(+start)||start.toISOString().slice(0,10)!==date)throw new Error('Invalid date');
 const [h,m]=time.split(':').map(Number);const selected=[...new Set(days)].sort();
 if(h>23||m>59||!selected.length||selected.some(d=>!Number.isInteger(d)||d<0||d>6)||!Number.isFinite(weeklyHours)||weeklyHours<1||weeklyHours>80)throw new Error('Invalid study schedule');
 const weeklyMinutes=Math.round(weeklyHours*60), base=Math.floor(weeklyMinutes/selected.length),extra=weeklyMinutes%selected.length;
 if(h*60+m+base+(extra?1:0)>1440)throw new Error('Choose an earlier start time or more study days to fit your weekly hours');
 const result:{stage:StudyStage;start:string;end:string;minutes:number}[]=[];let day=0,slot=0,used=0;
 for(const stage of stages){let remaining=Math.round(stage.estimated_hours*60);if(!Number.isFinite(remaining)||remaining<0)throw new Error('Invalid stage duration');
 while(remaining>0){if(day>3650||result.length>=10000)throw new Error('Schedule exceeds export limit');
 const current=new Date(+start+day*86400000);if(!selected.includes(current.getUTCDay())){day++;continue;}
 const capacity=base+(slot%selected.length<extra?1:0);const minutes=Math.min(remaining,capacity-used);
 const from=new Date(+current+(h*60+m+used)*60000),to=new Date(+from+minutes*60000);
 const local=(d:Date)=>d.toISOString().replace(/[-:]/g,'').slice(0,15);
 result.push({stage,start:local(from),end:local(to),minutes});remaining-=minutes;used+=minutes;
 if(used===capacity){day++;slot++;used=0;}
 }}return result;
}
