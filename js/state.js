"use strict";
/* Cedric implementation, redesign032. Rejected Qwen source is preserved under
 * qa/redesign-032/state-source-qwen001; this code is not attributed to Qwen.
 * Public API: get/view/dispatch, save/load/hasSave('save'|'checkpoint'), reset.
 * UI uses the defensive view and its complete action payloads. Room and dialogue
 * sequence are separate. Saves contain only schema/storyVersion/actions, replayed
 * through the same guarded reducer without storage, UI or audio side effects.
 * Exact view contract: qa/redesign-032/state-ui-contract.md. */
const GameState = (() => {
  const SCHEMA=3, STORY="polish-040", MAX_ACTIONS=6000, MAX_SAVE_BYTES=2000000;
  const KEYS=Object.freeze({save:"nurNochKurzKuendigen.redesign032.save",checkpoint:"nurNochKurzKuendigen.redesign032.checkpoint"});
  const own=(object,key)=>typeof key==="string"&&Object.prototype.hasOwnProperty.call(object,key);
  const copy=value=>JSON.parse(JSON.stringify(value));
  const plain=value=>value!==null&&typeof value==="object"&&!Array.isArray(value)&&
    (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
  const memory=Object.create(null),preferred=Object.create(null),cleared=Object.create(null);
  let current=null;
  const fail=(reason,message)=>({ok:false,reason,...(message?{message}:{})});
  const success=extra=>({ok:true,...extra});
  const doc=id=>CONTENT.lookup.document(id);
  const hasDoc=(s,id)=>s.documents.includes(id);
  function acquire(s,id){if(!hasDoc(s,id))s.documents.push(id);}
  function recordLine(s){
    const line=CONTENT.lookup.line(CONTENT.lookup.sequence(s.sequenceId)[s.lineIndex]);
    s.history.push({id:line.id,speaker:line.speaker,text:line.text});
  }
  function sequence(s,id,after){
    const ids=CONTENT.lookup.sequence(id);
    if(!ids||!ids.length)throw Error("Missing CONTENT sequence: "+id);
    s.sequenceId=id;s.lineIndex=0;s.mode="dialogue";s.afterSequence=after;recordLine(s);
  }
  function fresh(){
    const s={schema:SCHEMA,storyVersion:STORY,phase:"home",roomId:"zuhause",sequenceId:null,
      lineIndex:0,revision:0,mode:"dialogue",afterSequence:null,reason:null,documents:[],documentId:null,documentReturn:null,
      flags:{plusMet:false,rolfMet:false,computerCarried:false,caseSolved:false,rolfAsked:false,choiceReached:false,providerDeleted:false},
      challenge:{round:1,statementId:null,documentId:null,passageId:null,feedback:null,resolved:false},
      diagnostic:{controls:{agency:true,sales:true},epochs:{agency:0,sales:0},observations:[],latestResults:null},
      confirmation:null,letterChoice:null,ending:null,endingConfirmed:false,transferStage:null,
      transferComplete:false,localBootVerified:false,deleteDone:false,takeDone:false,maraSent:false,done:false,history:[],actionLog:[]};
    sequence(s,"homeIntro","explore");return s;
  }
  function ensure(){if(!current)current=fresh();return current;}
  function showDocument(s,id,after=null){
    if(s.mode!=="document")s.documentReturn={mode:s.mode,after};
    s.documentId=id;s.mode="document";
  }
  function afterSequence(s){
    const after=s.afterSequence;s.afterSequence=null;
    switch(after){
      case "explore":s.mode="explore";break;
      case "messagesRead":acquire(s,"messages");s.mode="explore";break;
      case "invoiceRead":acquire(s,"invoice");s.mode="explore";showDocument(s,"invoice");break;
      case "homeSent":s.phase="homeSent";s.mode="explore";break;
      case "plusReason":sequence(s,s.reason==="money"?"reasonMoney":"reasonSelf","introduceRolf");break;
      case "introduceRolf":sequence(s,"meetRolf","metBoth");break;
      case "metBoth":s.flags.plusMet=true;s.flags.rolfMet=true;s.mode="explore";break;
      case "caseRound2Done":s.phase="case";s.mode="challenge";break;
      case "caseConfirmed":s.phase="caseSolved";s.mode="explore";break;
      case "diagnostic":s.phase="diagnosis";s.mode="diagnostic";break;
      case "testDone":s.mode="diagnostic";break;
      case "letterChoice":s.phase="relationship";s.mode="choice";break;
      case "closeout":s.phase="discovery";sequence(s,"closeout","explore");break;
      case "rolfAsked":s.flags.rolfAsked=true;s.mode="explore";break;
      case "preview":s.phase="preview";acquire(s,"preview");s.mode="explore";showDocument(s,"preview","beforeChoice");break;
      case "endingChoice":s.phase="choice";s.mode="choice";s.flags.choiceReached=true;break;
      case "deleteReady":s.phase="export";s.mode="transfer";s.transferStage="delete";break;
      case "transferReady":s.phase="export";s.mode="transfer";s.transferStage="transfer";break;
      case "providerReady":s.phase="export";s.mode="transfer";s.transferStage="provider";break;
      case "wrapup":s.phase="wrapup";s.mode="explore";break;
      case "messageReady":s.phase="homeEnd";s.mode="message";break;
      case "lastScene":sequence(s,s.ending==="delete"?"lastDelete":"lastTake","finished");break;
      case "finished":s.phase="done";s.mode="done";s.done=true;break;
      default:throw Error("Unknown sequence transition: "+after);
    }
  }
  const actionFields=Object.freeze({
    next:{expectedLineId:"string",expectedRevision:"integer"},interact:{target:"string"},
    openDocument:{documentId:"string"},closeDocument:{},choose:{choiceId:"string",optionId:"string"},submitCancellation:{},
    selectStatement:{statementId:"string"},selectPassage:{documentId:"string",passageId:"string"},presentEvidence:{},
    testDiagnostic:{testId:"string"},setDiagnostic:{controlId:"string",value:"boolean"},confirmDiagnostic:{confirm:"boolean"},
    continueDiagnostic:{},confirmEnding:{confirm:"boolean"},deleteConfirm:{},takeTransfer:{},takeLocalBoot:{},deleteProvider:{},returnHome:{},submitMara:{}
  });
  function validAction(a){
    if(!plain(a)||!own(a,"type")||!own(actionFields,a.type))return fail("invalid-action");
    const fields=actionFields[a.type];
    for(const key of Object.keys(a))if(key!=="type"&&key!=="expectedRevision"&&!own(fields,key))return fail("unexpected-action-field");
    for(const [key,type] of Object.entries(fields)){
      if(!own(a,key))return fail("missing-action-field");
      if(type==="integer"?(!Number.isSafeInteger(a[key])||a[key]<0):typeof a[key]!==type)return fail("invalid-action-field");
      if(type==="string"&&(!a[key].length||a[key].length>100))return fail("invalid-action-field");
    }
    if(own(a,"expectedRevision")&&(!Number.isSafeInteger(a.expectedRevision)||a.expectedRevision<0))return fail("invalid-revision");
    return success();
  }
  function interactions(s){
    if(s.mode==="form")return ["backHome"];
    if(s.mode==="challenge")return ["backReception"];
    if(s.mode==="diagnostic")return ["backRoom"];
    if(s.mode!=="explore")return [];
    if(s.phase==="home")return ["messages","computer","coffee",...(hasDoc(s,"messages")?["invoice"]:[]),...(hasDoc(s,"messages")&&hasDoc(s,"invoice")?["form"]:[])];
    if(s.phase==="homeSent")return ["departure"];
    if(s.phase==="reception"||s.phase==="case"){
      if(s.roomId==="empfang")return ["terminal","toPlus",...(s.flags.plusMet&&hasDoc(s,"order")?["mira"]:[])];
      return ["plus","rolf","toMira"];
    }
    if(s.phase==="caseSolved")return ["toPlus"];
    if(s.phase==="diagnosis")return ["resumeDiagnostic","rolf"];
    if(s.phase==="discovery")return ["rolf",...(s.flags.rolfAsked?["base","maintenance"]:[]),...(hasDoc(s,"rolfBase")&&hasDoc(s,"manual")&&s.flags.computerCarried?["connectDevice"]:[])];
    return [];
  }
  function handleInteraction(s,target){
    if(!interactions(s).includes(target))return fail("interaction-unavailable","Diese Handlung ist hier noch nicht möglich.");
    if(target==="backHome"){s.phase="home";s.mode="explore";}
    else if(target==="backReception"||target==="backRoom")s.mode="explore";
    else if(target==="resumeDiagnostic")s.mode="diagnostic";
    else if(s.phase==="home"){
      if(target==="form"){s.phase="form";s.mode="form";}
      else if(target==="messages"){if(hasDoc(s,"messages"))showDocument(s,"messages");else sequence(s,"homeMessages","messagesRead");}
      else if(target==="invoice"){if(hasDoc(s,"invoice"))showDocument(s,"invoice");else sequence(s,"homeInvoice","invoiceRead");}
      else sequence(s,target==="coffee"?"homeCoffee":"homeComputer","explore");
    }else if(target==="departure"){
      s.flags.computerCarried=true;s.roomId="empfang";s.phase="reception";sequence(s,"receptionIntro","explore");
    }else if(target==="terminal"){acquire(s,"order");showDocument(s,"order");}
    else if(target==="toPlus"){
      s.roomId="vorfuehr";
      if(s.phase==="caseSolved"){s.phase="diagnosis";sequence(s,"salesLoop","diagnostic");}
      else if(!s.flags.plusMet)sequence(s,"meetPlus","plusReason");
    }else if(target==="toMira")s.roomId="empfang";
    else if(target==="mira"){s.phase="case";s.mode="challenge";}
    else if(target==="plus")sequence(s,s.reason==="money"?"reasonMoney":"reasonSelf","explore");
    else if(target==="rolf")sequence(s,s.phase==="discovery"?"askRolf":"earlyRolf",s.phase==="discovery"?"rolfAsked":"explore");
    else if(target==="base"||target==="maintenance"){const id=target==="base"?"rolfBase":"manual";acquire(s,id);showDocument(s,id);}
    else if(target==="connectDevice")sequence(s,"connectPreview","preview");
    return success();
  }
  function diagnosticReady(s){
    return ["agency","sales"].every(control=>!s.diagnostic.controls[control]&&
      s.diagnostic.observations.some(o=>o.controlId===control&&o.controlState==="on")&&
      s.diagnostic.observations.some(o=>o.controlId===control&&o.controlState==="off"&&o.epoch===s.diagnostic.epochs[control]));
  }
  function reduce(s,a){
    if(s.done&&a.type!=="openDocument"&&a.type!=="closeDocument")return fail("already-done");
    if(a.type==="next"){
      if(s.mode!=="dialogue")return fail("not-dialogue");
      const ids=CONTENT.lookup.sequence(s.sequenceId);
      if(ids[s.lineIndex]!==a.expectedLineId)return fail("stale-line");
      s.lineIndex++;if(s.lineIndex<ids.length)recordLine(s);else afterSequence(s);return success();
    }
    if(a.type==="openDocument"){
      if(!hasDoc(s,a.documentId)||!doc(a.documentId))return fail("document-not-acquired");
      showDocument(s,a.documentId);return success();
    }
    if(a.type==="closeDocument"){
      if(s.mode!=="document"||!s.documentReturn)return fail("not-document");
      const previous=s.documentReturn;s.documentId=null;s.documentReturn=null;s.mode=previous.mode;
      if(previous.after==="beforeChoice")sequence(s,"beforeChoice","endingChoice");return success();
    }
    if(a.type==="interact")return handleInteraction(s,a.target);
    if(a.type==="choose"){
      if(!own(CONTENT.choices,a.choiceId))return fail("unknown-choice");
      const option=CONTENT.choices[a.choiceId].options.find(o=>o.id===a.optionId);if(!option)return fail("unknown-option");
      if(a.choiceId==="reason"&&s.phase==="form"&&s.mode==="form"){s.reason=a.optionId;return success();}
      if(a.choiceId==="letter"&&s.phase==="relationship"&&s.mode==="choice"){
        s.letterChoice=a.optionId;sequence(s,a.optionId==="read"?"letterRead":"letterPrivate","closeout");return success();
      }
      if(a.choiceId==="ending"&&s.phase==="choice"&&s.mode==="choice"&&s.flags.choiceReached){
        s.ending=a.optionId;s.confirmation={kind:"ending",title:option.label,text:option.confirm};s.mode="confirm";return success();
      }
      return fail("choice-unavailable");
    }
    if(a.type==="submitCancellation"){
      if(s.mode!=="form"||s.phase!=="form"||!s.reason||!hasDoc(s,"messages")||!hasDoc(s,"invoice")||hasDoc(s,"receipt"))return fail("cancellation-unavailable");
      acquire(s,"receipt");sequence(s,"homeSent","homeSent");return success();
    }
    if(a.type==="selectStatement"){
      const round=s.challenge.round||1;
      const stmts=round===1?CONTENT.challenge.statements:CONTENT.challenge.round2.statements;
      if(s.mode!=="challenge"||!stmts.some(x=>x.id===a.statementId))return fail("statement-unavailable");
      s.challenge.statementId=a.statementId;s.challenge.feedback=null;return success();
    }
    if(a.type==="selectPassage"){
      if(s.mode!=="challenge"||!hasDoc(s,a.documentId)||!doc(a.documentId)?.passages.some(p=>p.id===a.passageId))return fail("passage-unavailable");
      s.challenge.documentId=a.documentId;s.challenge.passageId=a.passageId;s.challenge.feedback=null;return success();
    }
    if(a.type==="presentEvidence"){
      const c=s.challenge;
      const round=c.round||1;
      const correct=round===1?CONTENT.challenge.correct:CONTENT.challenge.round2.correct;
      const feedbackPool=round===1?CONTENT.challenge.feedback:CONTENT.challenge.round2.feedback;
      if(s.mode!=="challenge"||c.resolved||!c.statementId||!c.documentId||!c.passageId||!hasDoc(s,c.documentId))return fail("evidence-unavailable");
      if(c.statementId===correct.statementId&&c.documentId===correct.documentId&&c.passageId===correct.passageId&&hasDoc(s,"invoice")&&s.flags.plusMet){
        if(round===1){
          c.round=2;c.statementId=null;c.documentId=null;c.passageId=null;c.feedback=null;
          acquire(s,"invoice");
          sequence(s,"caseRound2","caseRound2Done");
          return success({success:true});
        }else{
          c.resolved=true;c.feedback=null;s.flags.caseSolved=true;acquire(s,"cancellation");sequence(s,"caseSuccess","caseConfirmed");return success({success:true});
        }
      }
      let key="wrongPassage";
      if(round===1){
        if(c.statementId!==correct.statementId)key=c.statementId;
        else if(c.documentId==="receipt")key="receipt";
        else if(c.documentId==="invoice"&&c.passageId==="rule")key="rule";
        else if(c.documentId!=="order")key=("doc_"+c.documentId) in CONTENT.challenge.feedback?"doc_"+c.documentId:"other";
      }else{
        if(c.statementId!=="r2_agency")key=c.statementId;
        else if(c.passageId==="extend")key="extend";
        else if(c.documentId!=="invoice"||c.passageId!=="rule")key=("doc_"+c.documentId) in CONTENT.challenge.round2.feedback?"doc_"+c.documentId:"other";
      }
      c.feedback=feedbackPool[key]||feedbackPool.other;return success({success:false,message:c.feedback});
    }
    if(a.type==="testDiagnostic"){
      const test=CONTENT.diagnostic.tests.find(t=>t.id===a.testId);
      if(s.mode!=="diagnostic"||!test)return fail("test-unavailable");
      const on=s.diagnostic.controls[test.controlId],result=on?test.on:test.off;
      const observation={testId:test.id,controlId:test.controlId,controlState:on?"on":"off",text:result.text,epoch:s.diagnostic.epochs[test.controlId]};
      s.diagnostic.observations.push(observation);s.diagnostic.latestResults=observation;
      if(result.sequence)sequence(s,result.sequence,"testDone");return success();
    }
    if(a.type==="setDiagnostic"){
      const control=CONTENT.diagnostic.controls.find(c=>c.id===a.controlId);
      if(s.mode!=="diagnostic"||!control||s.diagnostic.controls[a.controlId]===a.value)return fail("control-unavailable");
      if(!a.value&&!s.diagnostic.observations.some(o=>o.controlId===a.controlId&&o.controlState==="on"))return fail("test-baseline-first","Teste zuerst, was die eingeschaltete Einstellung tut.");
      s.confirmation={kind:"diagnostic",controlId:a.controlId,value:a.value,title:control.label,text:a.value?"Diese Berechtigung wieder einschalten?":control.confirm};
      s.mode="confirm";return success();
    }
    if(a.type==="confirmDiagnostic"){
      if(s.mode!=="confirm"||s.confirmation?.kind!=="diagnostic")return fail("no-diagnostic-confirmation");
      if(a.confirm){s.diagnostic.controls[s.confirmation.controlId]=s.confirmation.value;s.diagnostic.epochs[s.confirmation.controlId]++;}
      s.confirmation=null;s.mode="diagnostic";return success();
    }
    if(a.type==="continueDiagnostic"){
      if(s.mode!=="diagnostic"||!diagnosticReady(s))return fail("observations-incomplete");
      sequence(s,"afterTest","letterChoice");return success();
    }
    if(a.type==="confirmEnding"){
      if(s.mode!=="confirm"||s.confirmation?.kind!=="ending"||!s.flags.choiceReached)return fail("no-ending-confirmation");
      s.confirmation=null;
      if(!a.confirm){s.ending=null;s.mode="choice";return success();}
      s.endingConfirmed=true;sequence(s,s.ending==="delete"?"deleteGoodbye":"takeAgreement",s.ending==="delete"?"deleteReady":"transferReady");return success();
    }
    if(a.type==="deleteConfirm"){
      if(s.mode!=="transfer"||s.transferStage!=="delete"||s.ending!=="delete"||!s.endingConfirmed||s.transferComplete)return fail("deletion-unavailable");
      s.flags.providerDeleted=true;s.deleteDone=true;sequence(s,"deleteDone","wrapup");return success();
    }
    if(a.type==="takeTransfer"){
      if(s.mode!=="transfer"||s.transferStage!=="transfer"||s.ending!=="take"||!s.endingConfirmed||s.transferComplete)return fail("transfer-unavailable");
      s.transferComplete=true;s.transferStage="boot";return success();
    }
    if(a.type==="takeLocalBoot"){
      if(s.mode!=="transfer"||s.transferStage!=="boot"||!s.transferComplete||s.localBootVerified||s.flags.providerDeleted)return fail("boot-unavailable");
      s.localBootVerified=true;sequence(s,"localBoot","providerReady");return success();
    }
    if(a.type==="deleteProvider"){
      if(s.mode!=="transfer"||s.transferStage!=="provider"||!s.transferComplete||!s.localBootVerified||s.flags.providerDeleted)return fail("provider-deletion-unavailable");
      s.flags.providerDeleted=true;s.takeDone=true;sequence(s,"takeDone","wrapup");return success();
    }
    if(a.type==="returnHome"){
      if(s.phase!=="wrapup"||s.mode!=="explore"||!s.flags.providerDeleted)return fail("return-unavailable");
      s.roomId="zuhause";s.phase="homeEnd";sequence(s,"returnHome","messageReady");return success();
    }
    if(a.type==="submitMara"){
      if(s.phase!=="homeEnd"||s.mode!=="message"||s.maraSent)return fail("message-unavailable");
      s.maraSent=true;sequence(s,"maraReply","lastScene");return success();
    }
    return fail("unknown-action");
  }
  function transition(s,action,replaying=false){
    const valid=validAction(action);if(!valid.ok)return {result:valid};
    if(own(action,"expectedRevision")&&action.expectedRevision!==s.revision)return {result:fail("stale-revision")};
    if(s.actionLog.length>=MAX_ACTIONS)return {result:fail("action-limit")};
    // Replay owns an isolated fresh state; invalid replay is discarded wholesale.
    // Avoid repeatedly copying an ever-growing log during a long load.
    const next=replaying?s:copy(s),result=reduce(next,action);if(!result.ok)return {result};
    next.revision++;next.actionLog.push(copy(action));return {state:next,result};
  }
  function storage(){try{return typeof localStorage==="undefined"?null:localStorage;}catch(_){return null;}}
  function writeRaw(slot,value){
    memory[slot]=value;cleared[slot]=false;
    try{const store=storage();if(!store)throw Error("missing");store.setItem(KEYS[slot],value);preferred[slot]=false;return {storage:"local"};}
    catch(_){preferred[slot]=true;return {storage:"memory",warning:"Nur in dieser Sitzung gespeichert. Der Browserspeicher ist nicht verfügbar."};}
  }
  function readRaw(slot){
    if(cleared[slot])return null;
    if(preferred[slot]&&own(memory,slot))return {value:memory[slot],storage:"memory"};
    try{const value=storage()?.getItem(KEYS[slot]);if(typeof value==="string")return {value,storage:"local"};}catch(_){}
    return own(memory,slot)?{value:memory[slot],storage:"memory"}:null;
  }
  function serialize(s){return JSON.stringify({schema:SCHEMA,storyVersion:STORY,actions:s.actionLog});}
  function replay(raw){
    try{
      if(typeof raw!=="string"||raw.length>MAX_SAVE_BYTES)return fail("save-size");
      const data=JSON.parse(raw);
      if(!plain(data)||Object.keys(data).length!==3||!own(data,"schema")||!own(data,"storyVersion")||!own(data,"actions")||data.schema!==SCHEMA||data.storyVersion!==STORY||!Array.isArray(data.actions)||data.actions.length>MAX_ACTIONS)return fail("invalid-save");
      let state=fresh();
      for(const action of data.actions){const step=transition(state,action,true);if(!step.result.ok)return fail("invalid-action-log");state=step.state;}
      return {ok:true,state};
    }catch(_){return fail("invalid-save");}
  }
  function save(slot="save"){
    if(!own(KEYS,slot))return fail("unknown-slot");const s=ensure();
    if(slot==="checkpoint"&&!(s.flags.choiceReached&&s.phase==="choice"&&s.mode==="choice"&&!s.ending))return fail("checkpoint-not-reached");
    return {ok:true,...writeRaw(slot,serialize(s))};
  }
  function load(slot="save"){
    if(!own(KEYS,slot))return fail("unknown-slot");const raw=readRaw(slot);if(!raw)return fail("no-save");
    const result=replay(raw.value);if(!result.ok)return result;
    if(slot==="checkpoint"&&!(result.state.flags.choiceReached&&result.state.phase==="choice"&&result.state.mode==="choice"&&!result.state.ending))return fail("invalid-checkpoint");
    current=result.state;return {ok:true,storage:raw.storage,...(raw.storage==="memory"?{warning:"Spielstand aus dem Sitzungsspeicher geladen."}:{})};
  }
  function dispatch(action){
    const before=ensure(),step=transition(before,action);if(!step.result.ok)return step.result;
    current=step.state;const saved=save();
    if(!before.flags.choiceReached&&current.flags.choiceReached)save("checkpoint");
    return {...step.result,storage:saved.storage,...(saved.warning?{warning:saved.warning}:{})};
  }
  function reset(){
    current=fresh();let blocked=false;
    for(const slot of Object.keys(KEYS)){
      delete memory[slot];delete preferred[slot];cleared[slot]=true;
      try{const store=storage();if(!store)throw Error("missing");store.removeItem(KEYS[slot]);}catch(_){blocked=true;}
    }
    return {ok:true,storage:blocked?"memory":"local",...(blocked?{warning:"Neustart gilt für diese Sitzung; der Browserspeicher konnte nicht vollständig bereinigt werden."}:{})};
  }
  function objective(s){
    let key=s.phase;
    if(key==="home")key=hasDoc(s,"messages")?"form":"home";
    if(key==="homeSent")key="reception";
    if(key==="case"&&s.challenge.round===2)key="caseRound2";
    if(key==="caseSolved")key="diagnosis";
    if(key==="preview")key="discovery";
    if(key==="wrapup")key="homeEnd";
    return CONTENT.objectives[key]||CONTENT.objectives.home;
  }
  function view(){
    const s=ensure();
    const v={phase:s.phase,sceneId:s.roomId,sequenceId:s.sequenceId,mode:s.mode,revision:s.revision,
      line:s.mode==="dialogue"?CONTENT.lookup.line(CONTENT.lookup.sequence(s.sequenceId)[s.lineIndex]):null,
      objective:objective(s),actions:[],documents:[],history:s.history,ending:s.ending,done:s.done,
      document:null,form:null,challenge:null,diagnostic:null,confirmation:null,choice:null,transfer:null,finalMessage:null,endingData:null};
    const payload=(type,fields={})=>({type,...fields,expectedRevision:s.revision});
    function add(id,label,action,position){const item={id,label,action};if(position)item.position=position;v.actions.push(item);return action;}
    v.documents=s.documents.map(id=>({...doc(id),action:payload("openDocument",{documentId:id})}));
    if(s.mode==="dialogue")add("next","Weiter",payload("next",{expectedLineId:v.line.id}));
    if(s.mode==="document"){v.document=doc(s.documentId);add("closeDocument","Schließen",payload("closeDocument"));}
    const special={departure:"Zum Kundencenter gehen",connectDevice:"Meinen Rechner anschließen",backHome:"Zurück zum Schreibtisch",backReception:"Weiter am Empfang umsehen",backRoom:"Weiter im Raum umsehen",resumeDiagnostic:"Einstellungen weiter untersuchen"};
    for(const target of interactions(s)){
      const hotspot=CONTENT.scenes[s.roomId]?.hotspots.find(h=>h.id===target);
      add("interact-"+target,special[target]||hotspot?.label||target,payload("interact",{target}),hotspot?{x:hotspot.x,y:hotspot.y}:undefined);
    }
    if(s.phase==="wrapup"&&s.mode==="explore")add("returnHome","Nach Hause",payload("returnHome"));
    if(s.mode==="form"){
      const options=CONTENT.choices.reason.options.map(o=>({...o,selected:s.reason===o.id,
        action:add("reason-"+o.id,o.label,payload("choose",{choiceId:"reason",optionId:o.id}))}));
      v.form={title:CONTENT.form.title,description:CONTENT.form.description,reason:s.reason,options};
      if(s.reason)add("submitCancellation",CONTENT.form.submitLabel,payload("submitCancellation"));
    }
    if(s.mode==="challenge"){
      const c=s.challenge;
      const round=c.round||1;
      const roundData=round===1?{title:CONTENT.challenge.title,statements:CONTENT.challenge.statements}:CONTENT.challenge.round2;
      const statements=roundData.statements.map(x=>({...x,selected:c.statementId===x.id,
        action:add("statement-"+x.id,x.text,payload("selectStatement",{statementId:x.id}))}));
      const documents=s.documents.map(id=>({...doc(id),passages:doc(id).passages.map(p=>({...p,selected:c.documentId===id&&c.passageId===p.id,
        action:add("passage-"+id+"-"+p.id,p.text,payload("selectPassage",{documentId:id,passageId:p.id}))}))}));
      v.challenge={round,title:roundData.title,statements,documents,selectedStatement:c.statementId,selectedDocument:c.documentId,selectedPassage:c.passageId,feedback:c.feedback};
      if(c.statementId&&c.documentId&&c.passageId)add("presentEvidence","Diese Passage vorlegen",payload("presentEvidence"));
    }
    if(s.mode==="diagnostic"){
      const controls=CONTENT.diagnostic.controls.map(c=>{
        const active=s.diagnostic.controls[c.id],baseline=s.diagnostic.observations.some(o=>o.controlId===c.id&&o.controlState==="on");
        const action=!active||baseline?add("control-"+c.id,(active?"Abschalten: ":"Einschalten: ")+c.label,payload("setDiagnostic",{controlId:c.id,value:!active})):null;
        return {id:c.id,label:c.label,description:c.description,active,action};
      });
      const tests=CONTENT.diagnostic.tests.map(t=>({id:t.id,label:t.label,input:t.input,action:add("test-"+t.id,t.label,payload("testDiagnostic",{testId:t.id}))}));
      v.diagnostic={title:CONTENT.diagnostic.title,notice:CONTENT.diagnostic.notice,controls,tests,observations:s.diagnostic.observations,latestResults:s.diagnostic.latestResults};
      if(diagnosticReady(s))add("continueDiagnostic","Weiter: Mit Plus reden",payload("continueDiagnostic"));
    }
    if(s.mode==="confirm"){
      v.confirmation={kind:s.confirmation.kind,title:s.confirmation.title,text:s.confirmation.text};
      const type=s.confirmation.kind==="diagnostic"?"confirmDiagnostic":"confirmEnding";
      add("confirmYes","Ja, bestätigen",payload(type,{confirm:true}));add("confirmNo","Abbrechen",payload(type,{confirm:false}));
    }
    if(s.mode==="choice"){
      const id=s.phase==="relationship"?"letter":"ending",choice=CONTENT.choices[id];
      v.choice={id,title:choice.title,description:choice.description||"",options:choice.options.map(o=>({id:o.id,label:o.label,...(o.description?{description:o.description}:{}),
        action:add("choice-"+id+"-"+o.id,o.label,payload("choose",{choiceId:id,optionId:o.id}))}))};
    }
    if(s.mode==="transfer"){
      const steps={delete:["deleteConfirm","Kopie jetzt löschen","Du hast dich für ein Leben ohne die Kopie entschieden."],
        transfer:["takeTransfer","Kopie übertragen","Die Vorschau war noch keine Übertragung. Dein Rechner ist bereit."],
        boot:["takeLocalBoot","Plus lokal starten","Die Kopie ist übertragen. Prüfe jetzt ihren lokalen Start."],
        provider:["deleteProvider","Anbieterkopie löschen","Plus läuft auf deinem Rechner. Jetzt kann die Kopie beim Anbieter gelöscht werden."]};
      const [type,label,text]=steps[s.transferStage];add(type,label,payload(type));
      v.transfer={text,transferred:s.transferComplete,bootVerified:s.localBootVerified,providerDeleted:s.flags.providerDeleted};
    }
    if(s.mode==="message"){v.finalMessage=CONTENT.finalMessage;add("submitMara",CONTENT.finalMessage.submitLabel,payload("submitMara"));}
    if(s.mode==="done")v.endingData=CONTENT.endings[s.ending];
    return copy(v);
  }
  return Object.freeze({get:()=>copy(ensure()),view,dispatch,save,load,reset,
    hasSave(slot="save"){
      if(!own(KEYS,slot))return {ok:false,exists:false,storage:null};
      const raw=readRaw(slot);return {ok:true,exists:!!raw,storage:raw?.storage||null};
    }
  });
})();
