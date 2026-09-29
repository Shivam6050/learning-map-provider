"use server";
import {blendSkillLevel,getQuizForField} from "@/lib/onboarding/skill-quiz";
export async function assessStartingLevel(field:string,answers:number[]) {
 const quiz=getQuizForField(field);
 if(!quiz.length || answers.length!==quiz.length || answers.some((v,i)=>!Number.isInteger(v)||v<0||v>=quiz[i].options.length))throw new Error("Answer every question before checking your level.");
 return blendSkillLevel("beginner",answers,field);
}
