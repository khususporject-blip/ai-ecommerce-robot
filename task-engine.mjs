const RETRYABLE=new Set(["provider_timeout","rate_limit","temporary_unavailable"]);
export function createTask(input={}){return{id:String(input.id||`task-${Date.now().toString(36)}`),type:String(input.type||"generic"),status:"QUEUED",attempts:0,max_attempts:Math.max(1,Math.min(5,Number(input.max_attempts)||3)),payload:input.payload||{},created_at:new Date().toISOString()};}
export function nextTask(tasks=[]){return tasks.find(t=>t?.status==="QUEUED"||t?.status==="RETRY")||null;}
export function resolveTask(task,errorCode=null){if(!task)return null;if(!errorCode)return{...task,status:"DONE",completed_at:new Date().toISOString()};const attempts=(task.attempts||0)+1;return{...task,attempts,status:RETRYABLE.has(errorCode)&&attempts<task.max_attempts?"RETRY":"FAILED",last_error:errorCode};}
