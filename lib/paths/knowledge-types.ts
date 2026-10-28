export type KnowledgeQuestion={id:string;topic:string;prompt:string;options:string[]};
export type KnowledgeQuiz={version:string;questions:KnowledgeQuestion[]};
export type KnowledgeResult={correct:number;total:number;feedback:{id:string;topic:string;correct:boolean;selected:string;answer:string;explanation:string}[]};
export type KnowledgeResponse={ok:boolean;message:string;quiz?:KnowledgeQuiz;result?:KnowledgeResult};
