"use strict";(()=>{var e={};e.id=1375,e.ids=[1375],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92718:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>k,patchFetch:()=>v,requestAsyncStorage:()=>f,routeModule:()=>h,serverHooks:()=>w,staticGenerationAsyncStorage:()=>A});var r={};n.r(r),n.d(r,{GET:()=>m,POST:()=>g});var s=n(49303),a=n(88716),i=n(60670),o=n(87070),c=n(9487),d=n(70446),l=n(28309),u=n(14749),p=n(52325);async function m(e,{params:t}){let n=(0,d.cw)(),r=(0,d.vz)();if(!r&&(!n||n.workspaceSlug!==t.workspaceSlug))return o.NextResponse.json({error:"Unauthorized"},{status:401});if(n&&!r&&!(0,l.Fs)(n.roles,"advanced_intelligence.view"))return o.NextResponse.json({error:"Forbidden"},{status:403});let{searchParams:s}=new URL(e.url),a=s.get("assessmentId"),i=s.get("candidateId"),u=await c._.workspace.findUnique({where:{slug:t.workspaceSlug}});if(!u)return o.NextResponse.json({error:"Workspace not found"},{status:404});let p={workspaceId:u.id};a&&(p.assessmentId=a),i&&(p.candidateId=i);let m=await c._.developmentBlueprint.findMany({where:p,orderBy:{createdAt:"desc"}});return o.NextResponse.json(m)}async function g(e,{params:t}){let n=(0,d.cw)(),r=(0,d.vz)();if(!r&&(!n||n.workspaceSlug!==t.workspaceSlug))return o.NextResponse.json({error:"Unauthorized"},{status:401});if(n&&!r&&!(0,l.Fs)(n.roles,"advanced_intelligence.generate"))return o.NextResponse.json({error:"Forbidden"},{status:403});if((0,p.C6)("intelligence_development")){let e=(0,p._f)("intelligence_development");return o.NextResponse.json(e.body,{status:e.status})}try{let{assessmentId:r,candidateId:s,targetRole:a,viewType:i}=await e.json();if(!r||!s)return o.NextResponse.json({error:"assessmentId und candidateId sind erforderlich"},{status:400});let d=await c._.workspace.findUnique({where:{slug:t.workspaceSlug}});if(!d)return o.NextResponse.json({error:"Workspace not found"},{status:404});let l=await c._.assessment.findFirst({where:{id:r,workspaceId:d.id}});if(!l)return o.NextResponse.json({error:"Assessment nicht gefunden"},{status:404});let m=await c._.consolidatedScore.findMany({where:{assessmentId:r,candidateId:s}}),g=await c._.competencyNode.findMany({where:{competencyModel:{workspaceId:d.id}}}),h=new Map(g.map(e=>[e.id,{name:e.name,description:e.description}])),f=m.map(e=>{let t=h.get(e.competencyNodeId);return{competency:t?.name||e.competencyNodeId,description:t?.description||"",score:e.normalizedValue??e.consolidatedValue,variance:e.variance,outlier:e.outlierFlag,overridden:null!==e.moderatorOverride}}),A=await c._.predictiveProfile.findFirst({where:{assessmentId:r,candidateId:s,workspaceId:d.id},orderBy:{createdAt:"desc"}}),w=`Du bist ein Experte f\xfcr Executive Development und Coaching-Architektur.

Erstelle einen umfassenden Entwicklungsplan basierend auf den Assessment-Ergebnissen.

ASSESSMENT: ${l.name}
ZIELROLLE: ${a||"Executive Leadership"}

KOMPETENZ-BEWERTUNGEN:
${f.map(e=>`- ${e.competency}: ${e.score?.toFixed(2)||"k.A."} (Varianz: ${e.variance?.toFixed(2)||"k.A."}${e.outlier?", Ausrei\xdfer":""}${e.overridden?", moderiert":""})`).join("\n")}

${A?`RISIKOINDIKATOREN (aus pr\xe4diktiver Analyse):
${JSON.stringify(A.riskIndicators,null,2)}`:""}

Antworte ausschlie\xdflich in validem JSON:
{
  "focusAreas90d": [
    {
      "area": "Fokusbereich",
      "priority": "hoch|mittel|niedrig",
      "currentState": "Aktuelle Einsch\xe4tzung",
      "targetBehavior": "Zielverhalten in 90 Tagen",
      "actions": ["Konkrete Ma\xdfnahme 1", "Ma\xdfnahme 2"],
      "ifUnaddressedRisk": "Risiko bei Nichtbearbeitung"
    }
  ],
  "growthTargets6m": [
    {
      "target": "Wachstumsziel",
      "measurableShift": "Messbarer Verhaltensindikator",
      "milestones": ["Meilenstein 1", "Meilenstein 2"],
      "supportNeeded": "Ben\xf6tigte Unterst\xfctzung"
    }
  ],
  "positioningGoals12m": [
    {
      "goal": "Positionierungsziel",
      "strategicRationale": "Strategische Begr\xfcndung",
      "successIndicators": ["Erfolgskennzahl 1"]
    }
  ],
  "coachingQuestions": [
    {
      "theme": "Thema",
      "question": "Coaching-Frage",
      "purpose": "Zweck der Frage"
    }
  ],
  "suggestedInterventions": [
    {
      "type": "coaching|training|mentoring|shadowing|project_assignment|360_feedback",
      "title": "Ma\xdfnahme",
      "description": "Beschreibung",
      "duration": "Zeitrahmen",
      "priority": "hoch|mittel|niedrig"
    }
  ],
  "riskMitigationSteps": [
    {
      "risk": "Identifiziertes Risiko",
      "mitigationAction": "Gegenma\xdfnahme",
      "timeline": "Zeitplan",
      "owner": "Verantwortlich (HR/Coaching/Kandidat/F\xfchrungskraft)"
    }
  ],
  "confidenceScore": 0.0-1.0,
  "summary": "Zusammenfassung des Entwicklungsplans"
}

Wichtig:
- 3-5 Fokusfelder f\xfcr 90 Tage
- 3-4 Wachstumsziele f\xfcr 6 Monate
- 2-3 Positionierungsziele f\xfcr 12 Monate
- 5-8 Coaching-Fragen
- 4-6 Interventionsvorschl\xe4ge
- 2-4 Risikominderungsschritte
- Alle Texte auf Deutsch
- Basiere Empfehlungen NUR auf den vorhandenen Daten`,k=await (0,p.LP)({featureName:"intelligence_development",taskName:"development_blueprint_generation",route:"/api/w/[slug]/intelligence/development",input:w,options:{systemPrompt:"Du bist ein KI-Assistent f\xfcr Executive Development. Antworte nur in validem JSON.",responseFormat:"json",maxTokens:4096}});if("aiDisabled"in k)return o.NextResponse.json({error:"AI temporarily disabled",feature:"intelligence_development"},{status:503});let v="string"==typeof k.data?JSON.parse(k.data):k.data,I=await c._.developmentBlueprint.create({data:{assessmentId:r,candidateId:s,workspaceId:d.id,focusAreas90d:v.focusAreas90d||[],growthTargets6m:v.growthTargets6m||[],positioningGoals12m:v.positioningGoals12m||[],coachingQuestions:v.coachingQuestions||[],suggestedInterventions:v.suggestedInterventions||[],riskMitigationSteps:v.riskMitigationSteps||[],confidenceScore:v.confidenceScore||0}});return await (0,u.A)({workspaceId:d.id,userId:n?.userId,action:"development_blueprint.generated",entityType:"DevelopmentBlueprint",entityId:I.id,details:{assessmentId:r,candidateId:s,viewType:i||"full"}}),o.NextResponse.json({...I,summary:v.summary||"",_aiLabel:"KI-gest\xfctzte Analyse",_transparency:"Dieser Entwicklungsplan wurde durch KI generiert und sollte durch Coaching-Experten validiert werden."})}catch(e){return console.error("Development blueprint generation error:",e),o.NextResponse.json({error:"Fehler bei der Erstellung des Entwicklungsplans"},{status:500})}}let h=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/w/[workspaceSlug]/intelligence/development/route",pathname:"/api/w/[workspaceSlug]/intelligence/development",filename:"route",bundlePath:"app/api/w/[workspaceSlug]/intelligence/development/route"},resolvedPagePath:"/home/runner/workspace/app/api/w/[workspaceSlug]/intelligence/development/route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:f,staticGenerationAsyncStorage:A,serverHooks:w}=h,k="/api/w/[workspaceSlug]/intelligence/development/route";function v(){return(0,i.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:A})}},14749:(e,t,n)=>{n.d(t,{A:()=>s});var r=n(9487);async function s(e){try{await r._.auditLog.create({data:{workspaceId:e.workspaceId,userId:e.userId??null,action:e.action,entityType:e.entityType,entityId:e.entityId??null,details:e.details??null,ipAddress:e.ipAddress??null}})}catch(e){console.error("Audit log write failed:",e)}}},9487:(e,t,n)=>{n.d(t,{_:()=>s});var r=n(53524);let s=globalThis.prisma??new r.PrismaClient},28309:(e,t,n)=>{n.d(t,{Fs:()=>c,_N:()=>d});let r=["workspace.manage","users.create","users.read","users.update","users.delete","users.import","assessments.create","assessments.read","assessments.update","assessments.delete","assessments.assign_candidates","candidates.create","candidates.read","candidates.update","reports.read","reports.create","competencies.manage","requirements.manage","audit.read","theme.manage","exerciselibrary.upload","exerciselibrary.manage","brandrules.manage","requirements.match_exercises","advanced_intelligence.view","advanced_intelligence.generate","advanced_intelligence.export"],s=["assessments.read","assessments.update","candidates.create","candidates.read","candidates.update","users.read","exerciselibrary.upload","exerciselibrary.manage"],a=["assessments.read","candidates.read","reports.read","advanced_intelligence.view"],i={MASTER_ADMIN:[...r,"cross_workspace.access"],WORKSPACE_ADMIN:r,ADMIN:r,MODERATOR:["assessments.create","assessments.read","assessments.update","assessments.assign_candidates","candidates.create","candidates.read","candidates.update","reports.read","reports.create","requirements.manage","users.read","exerciselibrary.manage","requirements.match_exercises","advanced_intelligence.view","advanced_intelligence.generate"],OBSERVER:["assessments.read","candidates.read","reports.read"],PROJECT_OFFICE:s,PROJECT_ASSISTANT:s,CLIENT:a,HR_CLIENT:a,CANDIDATE:["candidate.own_assessment"]};function o(e){let t=new Set;for(let n of e){let e=i[n];if(e)for(let n of e)t.add(n)}return t}function c(e,t){return o(e).has(t)}function d(e,t){let n=o(e);return t.some(e=>n.has(e))}["MASTER_ADMIN","WORKSPACE_ADMIN","ADMIN","MODERATOR","OBSERVER","PROJECT_OFFICE","PROJECT_ASSISTANT","CLIENT","HR_CLIENT","CANDIDATE"].filter(e=>"CANDIDATE"!==e),["MASTER_ADMIN","WORKSPACE_ADMIN","MODERATOR","OBSERVER","PROJECT_OFFICE","CLIENT","CANDIDATE"].filter(e=>"CANDIDATE"!==e)},70446:(e,t,n)=>{n.d(t,{ER:()=>d,FY:()=>g,P:()=>p,Sm:()=>h,Ub:()=>u,aU:()=>m,cw:()=>f,dX:()=>A,vz:()=>l});var r=n(71615);let s="edp_master_auth",a="edp_workspace_auth",i="edp_user_session",o="authenticated",c="true"===process.env.DEV_BYPASS_AUTH&&!1;function d(){(0,r.cookies)().set(s,o,{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function l(){return!!c||r.cookies().get(s)?.value===o}function u(){(0,r.cookies)().delete(s)}function p(e){(0,r.cookies)().set(a,e,{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function m(){return c?"main":r.cookies().get(a)?.value??null}function g(){(0,r.cookies)().delete(a)}function h(e){(0,r.cookies)().set(i,JSON.stringify(e),{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function f(){let e=r.cookies().get(i)?.value;if(e)try{return JSON.parse(e)}catch{return null}return c?{userId:"dev-bypass-user",workspaceSlug:"main",roles:["ADMIN"]}:null}function A(){(0,r.cookies)().delete(i)}},52325:(e,t,n)=>{n.d(t,{_f:()=>d,LP:()=>m,C6:()=>o,KR:()=>g});var r=n(30088);class s{constructor(){this.key="openai",this.name="OpenAI",this.region="US/Global",this.client=new r.ZP({apiKey:process.env.AI_INTEGRATIONS_OPENAI_API_KEY,baseURL:process.env.AI_INTEGRATIONS_OPENAI_BASE_URL})}isAvailable(){return!!process.env.AI_INTEGRATIONS_OPENAI_API_KEY}getClient(){return this.client}async chat(e){let t=e.options?.model||"gpt-4o",n=[];e.options?.systemPrompt&&n.push({role:"system",content:e.options.systemPrompt}),n.push({role:"user",content:e.input});let r=await this.client.chat.completions.create({model:t,messages:n,temperature:e.options?.temperature??.7,max_tokens:e.options?.maxTokens??4096});return{data:r.choices[0].message.content,provider:this.key,model:t,usage:r.usage?{promptTokens:r.usage.prompt_tokens,completionTokens:r.usage.completion_tokens,totalTokens:r.usage.total_tokens}:void 0}}async generateStructured(e){let t;let n=e.options?.model||"gpt-4o",r=`Du bist ein Experte f\xfcr Executive Assessment Center und Kompetenzdiagnostik.
Antworte ausschlie\xdflich im angegebenen JSON-Schema-Format.
${e.options?.context?`
Kontext: ${JSON.stringify(e.options.context)}`:""}`,s=e.schema?`${e.input}

Antworte im folgenden JSON-Schema:
${JSON.stringify(e.schema,null,2)}`:e.input,a=await this.client.chat.completions.create({model:n,messages:[{role:"system",content:e.options?.systemPrompt||r},{role:"user",content:s}],temperature:e.options?.temperature??.5,max_tokens:e.options?.maxTokens??8192,response_format:{type:"json_object"}}),i=a.choices[0];try{t=JSON.parse(i.message.content||"{}")}catch{t=i.message.content}return{data:t,provider:this.key,model:n,usage:a.usage?{promptTokens:a.usage.prompt_tokens,completionTokens:a.usage.completion_tokens,totalTokens:a.usage.total_tokens}:void 0}}async transcribeAudio(e,t,n){let r=new File([e],t,{type:"audio/wav"});return(await this.client.audio.transcriptions.create({file:r,model:n||"gpt-4o-mini-transcribe",response_format:"json"})).text}}class a{isAvailable(){return!1}async chat(e){throw Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}async generateStructured(e){throw Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}constructor(){this.key="neuland",this.name="Neuland AI",this.region="EU (DSGVO)"}}class i{isAvailable(){return!1}async chat(e){throw Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}async generateStructured(e){throw Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}constructor(){this.key="azure_eu",this.name="Azure OpenAI EU",this.region="EU (Azure)"}}function o(e){return"true"===process.env.AI_DISABLED||(process.env.AI_FEATURES_DISABLED||"").split(",").map(e=>e.trim()).filter(Boolean).includes(e)}function c(e){return{aiDisabled:!0,content:null}}function d(e){return{status:503,body:{error:"AI temporarily disabled",feature:e}}}let l={openai:new s,neuland:new a,azure_eu:new i};function u(){let e=process.env.ACTIVE_LLM_PROVIDER||"openai",t=l[e];if(!t)return console.warn(`[LLM] Unknown provider "${e}", falling back to openai`),l.openai;if(!t.isAvailable()){console.warn(`[LLM] Provider "${e}" is not available, falling back to openai`);let t=l.openai;if(!t.isAvailable())throw Error("No LLM provider is available. Check AI_INTEGRATIONS_OPENAI_API_KEY.");return t}return t}function p(e,t,n,r,s,a,i){let o={timestamp:new Date().toISOString(),provider:e,feature:t,task:n,route:r,durationMs:s,success:a,...i?{error:i}:{}};return a?console.log(`[LLM] ✓ ${e}/${t} (${n}) [${r}] ${s}ms`):console.error(`[LLM] ✗ ${e}/${t} (${n}) [${r}] ${s}ms — ${i}`),o}async function m(e){let{taskName:t,featureName:n,route:r="unknown"}=e;if(o(n))return console.log(`[LLM] BLOCKED: ${n} (${t}) [${r}] — AI disabled`),c(n);let s=u(),a=Date.now();try{let i;return i=e.schema||e.options?.responseFormat==="json"?await s.generateStructured(e):await s.chat(e),p(s.key,n,t,r,Date.now()-a,!0),i}catch(o){let e=Date.now()-a,i=o instanceof Error?o.message:String(o);throw p(s.key,n,t,r,e,!1,i),o}}async function g(e,t,n){let r=n?.featureName||"audio_transcription",s=n?.route||"unknown";if(o(r))return console.log(`[LLM] BLOCKED: ${r} (transcribe) [${s}] — AI disabled`),c(r);let a=u();if("openai"!==a.key)throw Error("Audio transcription is only supported by the OpenAI provider.");let i=Date.now();try{let o=await a.transcribeAudio(e,t,n?.model);return p(a.key,r,"transcribe",s,Date.now()-i,!0),o}catch(n){let e=Date.now()-i,t=n instanceof Error?n.message:String(n);throw p(a.key,r,"transcribe",s,e,!1,t),n}}}};var t=require("../../../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),r=t.X(0,[9276,1615,5972,88],()=>n(92718));module.exports=r})();