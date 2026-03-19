"use strict";exports.id=7504,exports.ids=[7504],exports.modules={26729:(e,t,n)=>{n.d(t,{KR:()=>a,Tf:()=>o,Ut:()=>c,aq:()=>l,h7:()=>u,sA:()=>d});var r=n(52325);let s=`Du bist ein Experte f\xfcr Executive Assessment Center und Kompetenzdiagnostik.
Analysiere den folgenden Text (ein Transkript oder eine Anforderungsanalyse) und extrahiere daraus einen strukturierten Vorschlag f\xfcr ein Assessment Center.

Antworte ausschlie\xdflich in validem JSON mit folgender Struktur:
{
  "targetRole": {
    "title": "Rollenbezeichnung",
    "level": "Ebene (z.B. C-Level, Direktor, Senior Manager)",
    "context": "Kurze Beschreibung des Kontexts und der Organisation"
  },
  "successCriteria": ["Erfolgskriterium 1", "Erfolgskriterium 2", ...],
  "competencies": [
    {
      "name": "Kompetenzdom\xe4ne",
      "nodeType": "domain",
      "description": "Beschreibung",
      "children": [
        {
          "name": "Einzelkompetenz",
          "nodeType": "competency",
          "description": "Beschreibung",
          "anchors": ["Verhaltensanker 1", "Verhaltensanker 2"]
        }
      ]
    }
  ],
  "risks": ["Risiko/Red Flag 1", "Risiko/Red Flag 2"],
  "exercises": [
    {
      "name": "\xdcbungsname",
      "type": "presentation|interview|group_discussion|case_study|role_play|in_tray|psychometric|other",
      "duration": 30,
      "instructions": "Kurze Anweisungen",
      "difficultyLevel": "standard|erh\xf6ht|hoch",
      "competencyMappings": ["Kompetenzname 1", "Kompetenzname 2"]
    }
  ],
  "scale": {
    "name": "Bewertungsskala",
    "type": "likert",
    "points": [
      {"value": 1, "label": "Deutlich unter Erwartung", "description": "Kompetenz nicht erkennbar"},
      {"value": 2, "label": "Unter Erwartung", "description": "Kompetenz ansatzweise erkennbar"},
      {"value": 3, "label": "Entspricht Erwartung", "description": "Kompetenz klar erkennbar"},
      {"value": 4, "label": "\xdcber Erwartung", "description": "Kompetenz deutlich ausgepr\xe4gt"},
      {"value": 5, "label": "Deutlich \xfcber Erwartung", "description": "Kompetenz herausragend"}
    ]
  },
  "weightings": [
    {"competencyName": "Kompetenzname", "weight": 1.0}
  ],
  "assessmentName": "Name des Assessment Centers",
  "assessmentDescription": "Beschreibung"
}

Wichtig:
- Erstelle 4-8 Kompetenzen, gruppiert in 2-4 Dom\xe4nen
- Erstelle 3-6 \xdcbungen passend zur Zielrolle
- Gewichtungen sollten sich auf 1.0 summieren (pro \xdcbung)
- Ber\xfccksichtige die Schwierigkeitsstufe der \xdcbungen
- Alle Texte auf Deutsch`;function i(e){return"object"==typeof e&&null!==e&&"aiDisabled"in e}async function a(e,t){let n=await (0,r.KR)(e,t,{featureName:"audio_transcription",route:"/lib/ai/transcribeAudio"});if(i(n))throw Error("AI ist deaktiviert: Audio-Transkription nicht verf\xfcgbar.");return n}async function o(e){let t=await (0,r.LP)({taskName:"extract_proposal",featureName:"competency_generation",route:"/lib/ai/extractProposal",input:e,options:{systemPrompt:s,responseFormat:"json",maxTokens:8192}});if(i(t))throw Error("AI ist deaktiviert: Proposal-Extraktion nicht verf\xfcgbar.");return t.data}async function l(e,t){let n=`Du bist ein Assessment-Center-Berater, der interaktiv ein Assessment Center plant.
Du befindest dich im Schritt: ${t}.
Stelle gezielte Fragen, um die n\xf6tigen Informationen zu sammeln.
Antworte auf Deutsch, professionell und pr\xe4gnant.
Wenn du gen\xfcgend Informationen hast, fasse zusammen und frage nach Best\xe4tigung.`,s=e.map(e=>`${"user"===e.role?"Benutzer":"Berater"}: ${e.content}`).join("\n\n"),a=await (0,r.LP)({taskName:"co_creation_question",featureName:"competency_generation",route:"/lib/ai/coCreationQuestion",input:s||"Starte die Beratung.",options:{systemPrompt:n,maxTokens:2048}});return i(a)?"AI ist derzeit deaktiviert. Bitte versuchen Sie es sp\xe4ter erneut.":String(a.data)||""}async function u(e){try{let t=await (0,r.LP)({taskName:"generate_tags_title",featureName:"exercise_analysis",route:"/lib/ai/generateTagsAndTitle",input:`Titel: ${e.title}
Typ: ${e.type}${e.description?`
Beschreibung: ${e.description}`:""}${e.fileName?`
Dateiname: ${e.fileName}`:""}${e.sourceContext?`
Urspr\xfcnglich konzipiert f\xfcr: ${e.sourceContext}`:""}${e.author?`
Autor: ${e.author}`:""}`,options:{systemPrompt:`Du bist ein Experte f\xfcr Assessment Center und Kompetenzdiagnostik. Analysiere die folgenden Informationen \xfcber einen Assessment-Baustein und generiere:
1. Einen spezifischen, beschreibenden Titel (suggestedTitle) basierend auf dem Inhalt. Format: "[\xdcbungstyp] – [Kontext/Unternehmen] – [Kurzbeschreibung]" z.B. "Interview-Leitfaden – Varexia SE – CFO-Nachfolge Strategiegespr\xe4ch"
2. 5-10 relevante Tags auf Deutsch, die UNBEDINGT enthalten sollen (wenn aus den Informationen ableitbar):
   - Name des simulierten Unternehmens (z.B. "Varexia SE", "TechCorp GmbH")
   - Rolle/Position (z.B. "CFO", "Vorstandsvorsitzender", "Bereichsleiter")
   - Gespr\xe4chspartner / wer spricht mit wem (z.B. "Mitarbeitergespr\xe4ch", "Vorstandsdialog", "Kundengespr\xe4ch")
   - Kompetenzen und Themen (z.B. "Strategisches Denken", "Konfliktmanagement")
   - Methode/Format (z.B. "Einzelinterview", "Gruppendiskussion", "Rollenspiel")

Antworte ausschlie\xdflich in validem JSON: {"suggestedTitle": "...", "tags": ["Tag1", "Tag2", ...]}`,responseFormat:"json",maxTokens:512,model:"gpt-4o"}});if(i(t))return{tags:[],suggestedTitle:e.title};let n=t.data,s=Array.isArray(n.tags)?n.tags.filter(e=>"string"==typeof e&&e.trim().length>0):[],a="string"==typeof n.suggestedTitle&&n.suggestedTitle.trim()?n.suggestedTitle.trim():e.title;return{tags:s,suggestedTitle:a}}catch(t){return console.error("AI tag+title generation failed:",t),{tags:[],suggestedTitle:e.title}}}async function c(e){return(await u(e)).tags}let m=`Du bist ein Experte f\xfcr Executive Assessment Center und Kompetenzdiagnostik.
Analysiere den folgenden Text — dies ist ein Mitschrieb, eine Zusammenfassung oder ein Transkript einer Anforderungsanalyse.
Extrahiere alle verf\xfcgbaren Informationen und generiere Empfehlungen.

Antworte ausschlie\xdflich in validem JSON mit folgender Struktur:
{
  "analysisDate": "Datum der Anforderungsanalyse (z.B. 15.03.2025) oder '' wenn unbekannt",
  "analysisForm": "telefonisch|remote|pers\xf6nlich oder '' wenn unbekannt",
  "participants": ["Name 1", "Name 2"],

  "company": "Unternehmensname oder '' wenn unbekannt",
  "targetRole": "Ziel-Funktion/Rolle oder '' wenn unbekannt",
  "startDate": "Besetzung ab wann oder '' wenn unbekannt",

  "assessmentDate": "Durchf\xfchrungstermin oder '' wenn unbekannt",
  "assessmentType": "pr\xe4sent|remote|hybrid oder '' wenn unbekannt",
  "assessmentDuration": "Dauer in Stunden oder '' wenn unbekannt",

  "leadConsultant": {"firstName": "", "lastName": "", "role": "Berater", "phone": "", "email": ""},
  "secondConsultant": {"firstName": "", "lastName": "", "role": "Zweit-Berater", "phone": "", "email": ""} oder null,
  "additionalObservers": [{"firstName": "", "lastName": "", "role": "", "phone": "", "email": ""}],

  "candidates": [{"firstName": "", "lastName": "", "currentRole": "", "currentCompany": "", "phone": "", "email": ""}],

  "specificQuestions": ["Ausf\xfchrliche spezifische Fragestellung 1", "Fragestellung 2"],
  "successCriteria": ["Stellenspezifisches Erfolgsmerkmal 1 (was muss der Kandidat besonders gut k\xf6nnen)", "Erfolgsmerkmal 2"],

  "competencies": [
    {"name": "Kompetenzname", "description": "Kurzbeschreibung der Kompetenz im Kontext der Anforderung", "selected": true}
  ],
  "assessmentModules": [
    {
      "name": "Modulname (z.B. Strategische Fallstudie)",
      "type": "presentation|interview|case_study|role_play|group_discussion|in_tray|fact_finding|psychometric|other",
      "description": "Was dieses Modul beobachtbar macht und warum es passt",
      "adaptationNotes": "Wie dieses Modul spezifisch f\xfcr diese Anforderung angepasst werden sollte",
      "generationPrompt": "Detaillierter Prompt/Anweisung zur Erstellung dieses Assessment-Bausteins: Beschreibe Szenario, Aufgabenstellung, Zeitrahmen, erwartetes Verhalten, Bewertungskriterien",
      "selected": true
    }
  ]
}

Wichtige Regeln:
- Extrahiere NUR Informationen, die tats\xe4chlich im Text enthalten sind. Felder ohne Info = leer lassen ('')
- Bei Erfolgsmerkmalen: Formuliere pr\xe4gnant, was der Kandidat insbesondere gut k\xf6nnen muss (z.B. "versteht es, komplexe Zusammenh\xe4nge einfach zu vermitteln")
- Generiere 3-8 stellenspezifische Erfolgsmerkmale
- Bei Kompetenzen: Extrahiere relevante Anforderungskriterien/Kompetenzen, die im Assessment beobachtet und beurteilt werden sollen. M\xf6glichst NICHT zu viele (max 6-8). Kurze, pr\xe4gnante Namen (z.B. "Einf\xfchlungsverm\xf6gen", "Komplexit\xe4tsreduzierung")
- Bei Assessment-Bausteinen: Identifiziere relevante Beurteilungsmodule. M\xf6glichst NICHT zu viele (3-5). Jedes Modul MUSS einen detaillierten generationPrompt enthalten
- Alle spezifischen Fragestellungen ausf\xfchrlich in Bullet-Points extrahieren
- Alle Texte auf Deutsch`;async function d(e){let t=await (0,r.LP)({taskName:"extract_requirements",featureName:"competency_generation",route:"/lib/ai/extractRequirementsAnalysis",input:e,options:{systemPrompt:m,responseFormat:"json",maxTokens:8192}});if(i(t))throw Error("AI ist deaktiviert: Anforderungsanalyse-Extraktion nicht verf\xfcgbar.");return t.data}},70446:(e,t,n)=>{n.d(t,{ER:()=>u,FY:()=>g,P:()=>d,Sm:()=>h,Ub:()=>m,aU:()=>p,cw:()=>f,dX:()=>k,vz:()=>c});var r=n(71615);let s="edp_master_auth",i="edp_workspace_auth",a="edp_user_session",o="authenticated",l="true"===process.env.DEV_BYPASS_AUTH&&!1;function u(){(0,r.cookies)().set(s,o,{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function c(){return!!l||r.cookies().get(s)?.value===o}function m(){(0,r.cookies)().delete(s)}function d(e){(0,r.cookies)().set(i,e,{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function p(){return l?"main":r.cookies().get(i)?.value??null}function g(){(0,r.cookies)().delete(i)}function h(e){(0,r.cookies)().set(a,JSON.stringify(e),{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function f(){let e=r.cookies().get(a)?.value;if(e)try{return JSON.parse(e)}catch{return null}return l?{userId:"dev-bypass-user",workspaceSlug:"main",roles:["ADMIN"]}:null}function k(){(0,r.cookies)().delete(a)}},52325:(e,t,n)=>{n.d(t,{_f:()=>u,LP:()=>p,C6:()=>o,KR:()=>g});var r=n(30088);class s{constructor(){this.key="openai",this.name="OpenAI",this.region="US/Global",this.client=new r.ZP({apiKey:process.env.AI_INTEGRATIONS_OPENAI_API_KEY,baseURL:process.env.AI_INTEGRATIONS_OPENAI_BASE_URL})}isAvailable(){return!!process.env.AI_INTEGRATIONS_OPENAI_API_KEY}getClient(){return this.client}async chat(e){let t=e.options?.model||"gpt-4o",n=[];e.options?.systemPrompt&&n.push({role:"system",content:e.options.systemPrompt}),n.push({role:"user",content:e.input});let r=await this.client.chat.completions.create({model:t,messages:n,temperature:e.options?.temperature??.7,max_tokens:e.options?.maxTokens??4096});return{data:r.choices[0].message.content,provider:this.key,model:t,usage:r.usage?{promptTokens:r.usage.prompt_tokens,completionTokens:r.usage.completion_tokens,totalTokens:r.usage.total_tokens}:void 0}}async generateStructured(e){let t;let n=e.options?.model||"gpt-4o",r=`Du bist ein Experte f\xfcr Executive Assessment Center und Kompetenzdiagnostik.
Antworte ausschlie\xdflich im angegebenen JSON-Schema-Format.
${e.options?.context?`
Kontext: ${JSON.stringify(e.options.context)}`:""}`,s=e.schema?`${e.input}

Antworte im folgenden JSON-Schema:
${JSON.stringify(e.schema,null,2)}`:e.input,i=await this.client.chat.completions.create({model:n,messages:[{role:"system",content:e.options?.systemPrompt||r},{role:"user",content:s}],temperature:e.options?.temperature??.5,max_tokens:e.options?.maxTokens??8192,response_format:{type:"json_object"}}),a=i.choices[0];try{t=JSON.parse(a.message.content||"{}")}catch{t=a.message.content}return{data:t,provider:this.key,model:n,usage:i.usage?{promptTokens:i.usage.prompt_tokens,completionTokens:i.usage.completion_tokens,totalTokens:i.usage.total_tokens}:void 0}}async transcribeAudio(e,t,n){let r=new File([e],t,{type:"audio/wav"});return(await this.client.audio.transcriptions.create({file:r,model:n||"gpt-4o-mini-transcribe",response_format:"json"})).text}}class i{isAvailable(){return!1}async chat(e){throw Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}async generateStructured(e){throw Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}constructor(){this.key="neuland",this.name="Neuland AI",this.region="EU (DSGVO)"}}class a{isAvailable(){return!1}async chat(e){throw Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}async generateStructured(e){throw Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}constructor(){this.key="azure_eu",this.name="Azure OpenAI EU",this.region="EU (Azure)"}}function o(e){return"true"===process.env.AI_DISABLED||(process.env.AI_FEATURES_DISABLED||"").split(",").map(e=>e.trim()).filter(Boolean).includes(e)}function l(e){return{aiDisabled:!0,content:null}}function u(e){return{status:503,body:{error:"AI temporarily disabled",feature:e}}}let c={openai:new s,neuland:new i,azure_eu:new a};function m(){let e=process.env.ACTIVE_LLM_PROVIDER||"openai",t=c[e];if(!t)return console.warn(`[LLM] Unknown provider "${e}", falling back to openai`),c.openai;if(!t.isAvailable()){console.warn(`[LLM] Provider "${e}" is not available, falling back to openai`);let t=c.openai;if(!t.isAvailable())throw Error("No LLM provider is available. Check AI_INTEGRATIONS_OPENAI_API_KEY.");return t}return t}function d(e,t,n,r,s,i,a){let o={timestamp:new Date().toISOString(),provider:e,feature:t,task:n,route:r,durationMs:s,success:i,...a?{error:a}:{}};return i?console.log(`[LLM] ✓ ${e}/${t} (${n}) [${r}] ${s}ms`):console.error(`[LLM] ✗ ${e}/${t} (${n}) [${r}] ${s}ms — ${a}`),o}async function p(e){let{taskName:t,featureName:n,route:r="unknown"}=e;if(o(n))return console.log(`[LLM] BLOCKED: ${n} (${t}) [${r}] — AI disabled`),l(n);let s=m(),i=Date.now();try{let a;return a=e.schema||e.options?.responseFormat==="json"?await s.generateStructured(e):await s.chat(e),d(s.key,n,t,r,Date.now()-i,!0),a}catch(o){let e=Date.now()-i,a=o instanceof Error?o.message:String(o);throw d(s.key,n,t,r,e,!1,a),o}}async function g(e,t,n){let r=n?.featureName||"audio_transcription",s=n?.route||"unknown";if(o(r))return console.log(`[LLM] BLOCKED: ${r} (transcribe) [${s}] — AI disabled`),l(r);let i=m();if("openai"!==i.key)throw Error("Audio transcription is only supported by the OpenAI provider.");let a=Date.now();try{let o=await i.transcribeAudio(e,t,n?.model);return d(i.key,r,"transcribe",s,Date.now()-a,!0),o}catch(n){let e=Date.now()-a,t=n instanceof Error?n.message:String(n);throw d(i.key,r,"transcribe",s,e,!1,t),n}}}};