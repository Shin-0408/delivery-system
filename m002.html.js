
var KEY="deliverySystemV45_", COMPLETE_KEY="DeliverySystemV72_businessCompleted";
function id(x){return document.getElementById(x);}
function parse(k,d){try{var v=localStorage.getItem(KEY+k);return v?JSON.parse(v):d;}catch(e){return d;}}
function save(k,v){localStorage.setItem(KEY+k,JSON.stringify(v));}
function load(){var d=parse("m002WorkData",{});id("m002Count").value=d.count||"";id("m002Support").value=d.support||"";id("m002NoticeFlag").value=d.noticeFlag||"";id("m002NoticeText").value=d.noticeText||"";}
function data(){return {customerCode:"M002",customerName:"株式会社アローズ",type:"seven_mail_case",count:id("m002Count").value||"",support:id("m002Support").value||"",noticeFlag:id("m002NoticeFlag").value||"",noticeText:id("m002NoticeText").value||"",savedAt:new Date().toLocaleString("ja-JP")};}
function saveWork(silent){save("m002WorkData",data());localStorage.setItem(COMPLETE_KEY,"0");if(!silent)alert("保存しました。");}
function valid(){if(Number(id("m002Count").value||0)<1){alert("配送件数を入力してください。");return false;} if(!id("m002Support").value){alert("京都駅サポートを選択してください。");return false;} if(!id("m002NoticeFlag").value){alert("連絡事項の有無を選択してください。");return false;} if(id("m002NoticeFlag").value==="あり"&&!id("m002NoticeText").value.trim()){alert("連絡事項の内容を入力してください。");return false;} return true;}
window.onload=function(){load();id("btnSave").onclick=function(){saveWork(false);};id("btnComplete").onclick=function(){saveWork(true);if(!valid())return;localStorage.setItem(COMPLETE_KEY,"1");localStorage.setItem("DeliverySystemV64_businessCompleted","1"); if(window.setBusinessDoneV72){window.setBusinessDoneV72();} else {alert("業務完了しました。日報送信してください。");}};id("btnClear").onclick=function(){if(confirm("入力をクリアしますか？")){["m002Count","m002Support","m002NoticeFlag","m002NoticeText"].forEach(function(k){id(k).value="";});saveWork(true);}};};

;

/* ===== V72 統合日報送信・業務完了画面復活 ===== */
(function(){
  var KEY = window.KEY || "deliverySystemV45_";
  var COMPLETE_KEY_V72 = "DeliverySystemV72_businessCompleted";
  var COMPLETE_KEY_V64 = "DeliverySystemV64_businessCompleted";
  var TOKEN = "FKK_DAILY_V61_20260620";
  var ENDPOINT = "https://fukudakoken.com/daily/receive.php";
  function id(x){return document.getElementById(x);}
  function get(k,d){try{var v=localStorage.getItem(KEY+k);return v?JSON.parse(v):d;}catch(e){return d;}}
  function setDone(v){try{localStorage.setItem(COMPLETE_KEY_V72,v?"1":"0");localStorage.setItem(COMPLETE_KEY_V64,v?"1":"0");}catch(e){} updateMailLockV72();}
  function isDone(){return localStorage.getItem(COMPLETE_KEY_V72)==="1" || localStorage.getItem(COMPLETE_KEY_V64)==="1";}
  function safeVal(x){var e=id(x);return e?String(e.value||""):"";}
  function safeText(x){var e=id(x);return e?String(e.textContent||e.innerText||e.value||""):"";}
  function tryMap(mapName, code){try{return (window[mapName]&&window[mapName][code])||"";}catch(e){return "";}}
  function currentCustomerCode(){
    var c=safeVal("customerCode");
    if(c) return c;
    if(location.pathname.indexOf("m001")>=0) return "M001";
    if(location.pathname.indexOf("m002")>=0) return "M002";
    if(location.pathname.indexOf("m003")>=0) return "M003";
    if(location.pathname.indexOf("m004")>=0) return "M004";
    try{var cfg=get("config",{});return cfg.customerCode||"";}catch(e){return "";}
  }
  function currentCustomerName(c){
    if(c==="M001") return "株式会社松葉屋製麺";
    if(c==="M002") return "株式会社アローズ";
    if(c==="M003") return "株式会社カーゴジャパンアドバンスト";
    if(c==="M004") return "株式会社大将";
    return tryMap("customers",c);
  }
  function getCommon(){
    var cfg=get("config",{});
    var work=get("workData",{});
    return {
      customerCode: currentCustomerCode() || cfg.customerCode || "",
      customerName: currentCustomerName(currentCustomerCode() || cfg.customerCode || ""),
      driverCode: safeVal("driverCode") || cfg.driverCode || "",
      driverName: tryMap("drivers", safeVal("driverCode") || cfg.driverCode || ""),
      vehicleCode: safeVal("vehicleCode") || cfg.vehicleCode || "",
      vehicleName: tryMap("vehicles", safeVal("vehicleCode") || cfg.vehicleCode || ""),
      terminalCode: safeVal("terminalCode") || cfg.terminalCode || "",
      terminalName: tryMap("terminals", safeVal("terminalCode") || cfg.terminalCode || ""),
      startMeter: safeVal("startMeter") || work.startMeter || "",
      endMeter: safeVal("endMeter") || work.endMeter || "",
      dailyDistance: safeVal("dailyDistance") || work.dailyDistance || "",
      startAlcohol: safeVal("startAlcohol") || work.startAlcohol || "",
      endAlcohol: safeVal("endAlcohol") || work.endAlcohol || ""
    };
  }
  function buildPayloadV72(){
    try{ if(typeof saveAll==="function") saveAll(); }catch(e){}
    try{ if(typeof renderAll==="function") renderAll(); }catch(e){}
    var c = currentCustomerCode();
    var common = getCommon();
    var m001Local = get("m001ReportData",{});
    var m002Local = get("m002WorkData",{});
    var m003Local = get("m003WorkData",{});
    var m004Local = get("m004WorkData",{});
    var hist=[]; try{hist=(window.historyData||[]).slice(-700);}catch(e){hist=(m001Local.historyData||[]).slice(-700);}
    var collect=[]; try{collect=(window.collectHistoryData||[]).slice(-700);}catch(e){collect=(m001Local.collectHistoryData||[]).slice(-700);}
    var carry=[]; try{carry=(window.carryOutData||[]).slice(-700);}catch(e){carry=(m001Local.carryOutData||[]).slice(-700);}
    var bal={}; try{bal=window.balanceData||{};}catch(e){bal=m001Local.balanceData||{};}

    function _v109Item(label,value){
      if(value===undefined||value===null)value="";
      return {name:String(label||""), value:String(value)};
    }
    function _v109GenericWork(code,name,work){
      work=work||{};
      if(code==="M001"){
        return {mode:"detailed_matsubaya", title:"株式会社松葉屋製麺 詳細日報", items:[]};
      }
      if(code==="M002"){
        return {
          mode:"generic",
          title:"株式会社アローズ 業務内容",
          items:[
            _v109Item("配送件数", work.count ? (String(work.count)+"件") : ""),
            _v109Item("京都駅サポート", work.support||""),
            _v109Item("連絡事項", work.noticeFlag||""),
            _v109Item("連絡事項内容", work.noticeText||""),
            _v109Item("入力保存日時", work.savedAt||"")
          ]
        };
      }
      var items=[];
      for(var k in work){
        if(!Object.prototype.hasOwnProperty.call(work,k))continue;
        if(k==="customerCode"||k==="customerName"||k==="type")continue;
        if(typeof work[k]==="object")continue;
        items.push(_v109Item(k,work[k]));
      }
      return {mode:"generic", title:(name||code||"得意先")+" 業務内容", items:items};
    }
    var selectedCustomerWork = c==="M002" ? m002Local : (c==="M003" ? m003Local : (c==="M004" ? m004Local : m001Local));
    var selectedReportType = c==="M001" ? "detailed_matsubaya" : "generic";
    var selectedCustomerWorkDisplay = _v109GenericWork(c, common.customerName, selectedCustomerWork);

    return {
      token:TOKEN,
      version:"V109",
      reportDate:new Date().toLocaleString("ja-JP"),
      sentAt:new Date().toLocaleString("ja-JP"),
      customerCode:common.customerCode,
      customerName:common.customerName,
      driverCode:common.driverCode,
      driverName:common.driverName,
      vehicleCode:common.vehicleCode,
      vehicleName:common.vehicleName,
      terminalCode:common.terminalCode,
      terminalName:common.terminalName,
      startMeter:common.startMeter,
      endMeter:common.endMeter,
      dailyDistance:common.dailyDistance,
      startAlcohol:common.startAlcohol,
      endAlcohol:common.endAlcohol,
      reportType:selectedReportType,
      reportTemplate:selectedReportType,
      customerWorkDisplay:selectedCustomerWorkDisplay,
      commonReportFields:{
        startMeter:common.startMeter,
        startAlcohol:common.startAlcohol,
        startTime:(common.workStartTime||common.businessStartTime||common.startTime||""),
        endMeter:common.endMeter,
        endAlcohol:common.endAlcohol,
        endTime:(common.workEndTime||common.businessEndTime||common.endTime||""),
        dailyDistance:common.dailyDistance
      },
      summary:{
        carryCount:safeText("carryCount") || (m001Local.summary&&m001Local.summary.carryCount)||"",
        deliveryCount:safeText("deliveryCount") || (m001Local.summary&&m001Local.summary.deliveryCount)||"",
        remainCount:safeText("remainCount") || (m001Local.summary&&m001Local.summary.remainCount)||"",
        collectCount:safeText("collectCount") || (m001Local.summary&&m001Local.summary.collectCount)||"",
        collectAmountText:safeText("collectAmount") || (m001Local.summary&&m001Local.summary.collectAmount)||"",
        pendingCount:safeText("pendingCount") || (m001Local.summary&&m001Local.summary.pendingCount)||"",
        pendingAmountText:safeText("pendingAmount") || (m001Local.summary&&m001Local.summary.pendingAmount)||"",
        grandBalanceText:safeText("grandBalance") || (m001Local.summary&&m001Local.summary.grandBalance)||""
      },
      customerWork:selectedCustomerWork,
      m001:m001Local,
      m002:m002Local,
      m003:m003Local,
      m004:m004Local,
      historyData:hist,
      collectHistoryData:collect,
      carryOutList:carry,
      balanceData:bal
    };
  }
  function fallbackForm(payload){
    var f=document.createElement("form");
    f.method="POST";f.action=ENDPOINT;f.target="_blank";f.style.display="none";
    var i=document.createElement("input");i.type="hidden";i.name="payload";i.value=JSON.stringify(payload);
    f.appendChild(i);document.body.appendChild(f);f.submit();
    setTimeout(function(){try{document.body.removeChild(f);}catch(e){}},1000);
  }
  function updateMailLockV72(){
    var btns=document.querySelectorAll("#btnMail,#btnDailySend,#btnPageDailySend");
    var ok=isDone();
    for(var i=0;i<btns.length;i++){btns[i].disabled=!ok;btns[i].style.opacity=ok?"":".45";btns[i].style.filter=ok?"":"grayscale(1)";}
  }
  function sendDailyV72(){
    if(!isDone()){alert("先に業務完了ボタンを押してください。");updateMailLockV72();return;}
    if(!navigator.onLine){alert("通信できません。Wi-Fi接続後にもう一度、日報送信してください。");return;}
    var payload=buildPayloadV72();
    var body=JSON.stringify(payload);
    var btn=this||id("btnMail")||id("btnDailySend")||id("btnPageDailySend");
    if(btn){btn.disabled=true;btn.textContent="送信中...";}
    fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:body,cache:"no-store",mode:"cors"})
      .then(function(r){return r.text().then(function(t){var j={};try{j=JSON.parse(t);}catch(e){} if(!r.ok||!j.ok){throw new Error((j&&j.error)||t||("送信エラー "+r.status));} return j;});})
      .then(function(j){alert("日報送信完了。\n受信時刻："+(j.receivedAt||""));})
      .catch(function(e){if(confirm("通常送信に失敗しました。\n別画面で送信しますか？\n"+(e&&e.message?e.message:e))){fallbackForm(payload);}})
      .finally(function(){if(btn){btn.disabled=false;btn.textContent="日報送信";} updateMailLockV72();});
  }
  function showCompleteV72(){
    var m=id("completeModalV72");
    if(m){m.style.display="flex";return;}
    alert("業務完了しました。日報送信してください。");
  }
  function closeCompleteV72(){var m=id("completeModalV72"); if(m)m.style.display="none";}
  function bind(){
    window.sendDailyV72=sendDailyV72;
    window.setBusinessDoneV72=function(){setDone(true);showCompleteV72();};
    window.closeCompleteV72=closeCompleteV72;
    var btns=document.querySelectorAll("#btnMail,#btnDailySend,#btnPageDailySend");
    for(var i=0;i<btns.length;i++){btns[i].onclick=sendDailyV72;btns[i].textContent="日報送信";}
    var closes=document.querySelectorAll(".closeCompleteV72");
    for(var j=0;j<closes.length;j++){closes[j].onclick=closeCompleteV72;}
    updateMailLockV72();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
  setTimeout(bind,800);
})();

;

(function(){
  function id(x){return document.getElementById(x);}
  function clean(){
    document.body.className=(document.body.className||"").replace(/\bv84-customer-clean\b/g,"")+" v84-customer-clean";
    var back=document.querySelector('a[href="./index.html"],a[href="index.html"]');if(back){back.textContent="点呼ページへ戻る";back.setAttribute("aria-label","点呼ページへ戻る");}
    ["btnComplete","btnPageDailySend","btnMail","btnDailySend"].forEach(function(x){var b=id(x);if(b){b.style.display="none";b.disabled=true;b.onclick=function(){alert("業務完了・日報送信は点呼ページで押してください。");location.href="./index.html";return false;};}});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",clean);else clean();
  setTimeout(clean,300);setTimeout(clean,1200);setTimeout(clean,1800);
})();

;

/* ===== V91：得意先ページでは点呼情報を消さず、点呼ページへ戻す ===== */
(function(){
  var KEY="deliverySystemV45_";
  var BACKUP_KEY="DeliverySystemV91_tenkoBackup";
  function id(x){return document.getElementById(x);}
  function rawGet(k){try{return localStorage.getItem(k)||"";}catch(e){return "";}}
  function rawSet(k,v){try{localStorage.setItem(k,String(v||""));}catch(e){}}
  function get(k,d){try{var v=localStorage.getItem(KEY+k);return v?JSON.parse(v):d;}catch(e){return d;}}
  function set(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v));}catch(e){}}
  function backup(){try{return JSON.parse(rawGet(BACKUP_KEY)||"{}")||{};}catch(e){return {};}}
  function preserveTenko(){
    try{
      var b=backup(), w=get("workData",{}), c=get("config",{});
      if(b.work){
        ["startMeter","startAlcohol","endMeter","endAlcohol","dailyDistance"].forEach(function(k){
          if(!w[k] && b.work[k])w[k]=b.work[k];
        });
      }
      if(b.config){
        ["customerCode","driverCode","vehicleCode","terminalCode"].forEach(function(k){
          if(!c[k] && b.config[k])c[k]=b.config[k];
        });
      }
      set("workData",w);set("config",c);
      rawSet(BACKUP_KEY,JSON.stringify({work:w,config:c,savedAt:new Date().toISOString()}));
    }catch(e){}
  }
  function bind(){
    document.body.className=(document.body.className||"").replace(/\bv86-customer-page-clean\b/g,"")+" v86-customer-page-clean";
    try{document.title=document.title.replace(/V85/g,"V91");}catch(e){}
    var back=document.querySelector('a[href="./index.html"],a[href="index.html"]');
    if(back){back.textContent="点呼ページへ戻る";back.addEventListener("click",preserveTenko,true);}
    preserveTenko();
  }
  window.addEventListener("pagehide",preserveTenko);
  window.addEventListener("beforeunload",preserveTenko);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
  setTimeout(bind,300);setTimeout(bind,1200);setTimeout(bind,2500);
})();

;

/* ===== V106：M002株式会社アローズをM001業務条件から完全分離。点呼ページ復帰後もM002選択を保持。 ===== */
(function(){
  var KEY="deliverySystemV45_";
  function id(x){return document.getElementById(x);}
  function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
  function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function markM002(){
    try{
      localStorage.setItem("DeliverySystemV106_activeCustomer","M002");
      localStorage.setItem("DeliverySystemV105_activeCustomer","M002");
      var cfg=get(KEY+"config",{});
      cfg.customerCode="M002";
      set(KEY+"config",cfg);
    }catch(e){}
  }
  function bind(){
    markM002();
    ["m002Count","m002Support","m002NoticeFlag","m002NoticeText"].forEach(function(k){
      var e=id(k);
      if(e&&!e.__v106m002){
        e.__v106m002=true;
        e.addEventListener("input",markM002,false);
        e.addEventListener("change",markM002,false);
        e.addEventListener("blur",markM002,false);
      }
    });
    var a=document.querySelector('a[href="./index.html"],a[href="index.html"]');
    if(a&&!a.__v106m002){
      a.__v106m002=true;
      a.addEventListener("click",markM002,false);
    }
    var save=id("btnSave");
    if(save&&!save.__v106m002){
      save.__v106m002=true;
      save.addEventListener("click",markM002,false);
    }
    var complete=id("btnComplete");
    if(complete&&!complete.__v106m002){
      complete.__v106m002=true;
      complete.addEventListener("click",markM002,false);
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
  window.addEventListener("pageshow",bind);
})();

;

/* ===== V110：M002 activeCustomerをV110キーにも保存 ===== */
(function(){
  var KEY="deliverySystemV45_", CUSTOMER="M002";
  function setActive(){
    try{
      localStorage.setItem("DeliverySystemV110_activeCustomer",CUSTOMER);
      localStorage.setItem("DeliverySystemV106_activeCustomer",CUSTOMER);
      localStorage.setItem("DeliverySystemV105_activeCustomer",CUSTOMER);
      var cfg={};try{cfg=JSON.parse(localStorage.getItem(KEY+"config")||"{}");}catch(e){cfg={};}
      cfg.customerCode=CUSTOMER;localStorage.setItem(KEY+"config",JSON.stringify(cfg));
    }catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setActive);else setActive();
  window.addEventListener("pageshow",setActive);
})();

;

/* ===== V114：得意先ページ更新対策。日報送信以外では業務データを保持。 ===== */
(function(){
  var KEY="deliverySystemV45_";
  var SNAP="DeliverySystemV114_customerSnapshot";
  var KEYS=["historyData","collectHistoryData","carryOutData","stateData","optionData","searchCountData","undoData","invoiceData","m001ReportData","lastDailyPayload","dailyPayloadV91","m002WorkData","customerWorkData","balanceData"];
  function raw(k){try{return localStorage.getItem(k)||"";}catch(e){return "";}}
  function put(k,v){try{localStorage.setItem(k,String(v));}catch(e){}}
  function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
  function makeSnapshot(){var s={t:Date.now(),items:{}};KEYS.forEach(function(k){var full=KEY+k,v=raw(full);if(v)s.items[full]=v;});try{localStorage.setItem(SNAP,JSON.stringify(s));}catch(e){}}
  function restoreSnapshot(){var s=get(SNAP,null);if(!s||!s.items)return;Object.keys(s.items).forEach(function(k){if(!raw(k)&&s.items[k])put(k,s.items[k]);});}
  function installPullGuard(){if(document.getElementById("v114-pull-refresh-guard-style"))return;var st=document.createElement("style");st.id="v114-pull-refresh-guard-style";st.textContent="html,body{overscroll-behavior-y:contain;overscroll-behavior-x:none;} body{touch-action:pan-x pan-y;}";document.head.appendChild(st);var y=0;document.addEventListener("touchstart",function(e){if(e.touches&&e.touches.length)y=e.touches[0].clientY;},{passive:true});document.addEventListener("touchmove",function(e){if(window.scrollY<=0&&e.touches&&e.touches.length&&e.touches[0].clientY>y){e.preventDefault();}},{passive:false});}
  function bind(){restoreSnapshot();installPullGuard();setTimeout(makeSnapshot,300);setTimeout(makeSnapshot,1500);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
  window.addEventListener("pagehide",makeSnapshot);window.addEventListener("beforeunload",makeSnapshot);window.addEventListener("pageshow",bind);window.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")makeSnapshot();else restoreSnapshot();});
})();
