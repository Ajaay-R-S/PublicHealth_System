/* ---------------------------------------------------------
   Aarogya Setu MH — Prototype for SIH 26133
   Demo-only, in-memory state (no backend, no persistence)
--------------------------------------------------------- */

// Speech recognition language codes per app language
const SPEECH_LOCALE = { en:"en-IN", hi:"hi-IN", mr:"mr-IN" };

let state = {
  lang:"en",
  largeText:false,
  abhaLinked:false,
  abhaId:"",
  facility:null,
  tab:"home",
  activity:[],
  selectedSymptoms:new Set(),
  severity:3,
  duration:0,
  ageGroup:1,
  lastRisk:null,
  queueBooked:null,
  referralStage:2, // 0..3 index into tiers
  voiceTranscript:"",
  voiceAutoSymptoms:[],
  isListening:false,
};

let recognition = null; // lazily created SpeechRecognition instance

function t(){ return STR[state.lang]; }
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function toast(msg){
  const el = document.createElement("div");
  el.className="toast"; el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 2600);
}

function logActivity(text){
  state.activity.unshift({text, time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  state.activity = state.activity.slice(0,6);
}

/* ---------------- Language & accessibility ---------------- */
function setLang(l){
  state.lang = l;
  $all("#langsel button").forEach(b=>b.classList.toggle("active", b.dataset.lang===l));
  renderChrome();
  render();
}

function toggleLargeText(){
  state.largeText = !state.largeText;
  document.body.classList.toggle("large-text", state.largeText);
  $("#textSizeBtn").classList.toggle("active", state.largeText);
}

function renderChrome(){
  const s = t();
  $("#appTitle").textContent = s.title;
  $("#appSub").textContent = s.sub;
  $("#idbarName").textContent = state.abhaLinked ? ("ABHA: •••• "+state.abhaId.slice(-4)) : s.abhaNotLinked;
  $("#idbarFacility").textContent = state.facility ? ("📍 "+state.facility.name) : s.selectFacility;
  $("#textSizeBtn").textContent = s.largeText;
  $("#tabHomeLbl").textContent = s.tabs.home;
  $("#tabTriageLbl").textContent = s.tabs.triage;
  $("#tabQueueLbl").textContent = s.tabs.queue;
  $("#tabReferralLbl").textContent = s.tabs.referral;
  $("#tabMapLbl").textContent = s.tabs.map;
  $("#tabMedsLbl").textContent = s.tabs.meds;
  $("#tabDashLbl").textContent = s.tabs.dash;
}

function setTab(tab){
  state.tab = tab;
  $all("nav.tabs button").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  render();
  window.scrollTo(0,0);
}

/* ---------------- Screens ---------------- */

function screenHome(){
  const s = t().home;
  const facOptions = FACILITIES.map(f=>`<option value="${f.id}" ${state.facility&&state.facility.id===f.id?"selected":""}>${f.tier} · ${f.name} (${f.district})</option>`).join("");
  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>

    ${!state.abhaLinked ? `
    <div class="card">
      <label class="f">${s.linkAbha}</label>
      <input type="text" id="abhaInput" placeholder="${s.abhaPh}" maxlength="14" inputmode="numeric">
      <label class="f">${s.village}</label>
      <select id="facilitySelect"><option value="">—</option>${facOptions}</select>
      <div style="height:10px"></div>
      <button class="btn btn-primary" id="linkBtn">${s.link}</button>
    </div>` : ``}

    <div class="grid2">
      <div class="tile" data-go="triage">${tileHtml(s.tiles.triage)}</div>
      <div class="tile" data-go="queue">${tileHtml(s.tiles.video)}</div>
      <div class="tile" data-go="queue">${tileHtml(s.tiles.queue)}</div>
      <div class="tile" data-go="referral">${tileHtml(s.tiles.referral)}</div>
      <div class="tile" data-go="map">${tileHtml(s.tiles.map)}</div>
      <div class="tile" data-go="meds">${tileHtml(s.tiles.meds)}</div>
      <div class="tile" data-go="dash">${tileHtml(s.tiles.followup)}</div>
    </div>

    <div class="divider"></div>
    <div class="eyebrow">${s.recent}</div>
    <div class="card tight">
      ${state.activity.length ? state.activity.map(a=>`<div style="padding:8px 0;border-bottom:1px solid #f1ece2;font-size:.85rem;display:flex;justify-content:space-between;"><span>${a.text}</span><span class="muted">${a.time}</span></div>`).join("") : `<div class="muted">${s.noActivity}</div>`}
    </div>
  `;
}
function tileHtml(arr){ return `<span class="ic">${arr[0]}</span><div class="lbl">${arr[1]}</div><div class="sub">${arr[2]}</div>`; }

function screenTriage(){
  const s = t().triage;
  const chips = SYMPTOMS.map(sym=>`<span class="chip ${state.selectedSymptoms.has(sym)?'sel':''}" data-sym="${sym}">${sym}</span>`).join("");
  const durChips = s.durations.map((d,i)=>`<span class="chip ${state.duration===i?'sel':''}" data-dur="${i}">${d}</span>`).join("");
  const groupChips = s.groups.map((g,i)=>`<span class="chip ${state.ageGroup===i?'sel':''}" data-grp="${i}">${g}</span>`).join("");

  let resultHtml = "";
  if(state.lastRisk){
    const r = state.lastRisk;
    const cls = r==="high"?"risk-high":r==="med"?"risk-med":"risk-low";
    const label = r==="high"?s.high:r==="med"?s.med:s.low;
    const body = r==="high"?s.highBody:r==="med"?s.medBody:s.lowBody;
    resultHtml = `
      <div class="eyebrow">${s.result}</div>
      <div class="risk-banner ${cls}">
        <b>${label}</b>
        <div style="font-size:.85rem;margin-top:8px;opacity:.95;">${body}</div>
        <button class="readAloud" id="readAloudBtn">${s.readAloud}</button>
      </div>
      ${r!=="low" ? `<button class="btn btn-primary" id="triageAction" style="margin-bottom:10px;">${r==="high"?s.escalate:s.bookConsult}</button>` : ``}
    `;
  }

  const voiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>

    <div class="card">
      <label class="f">${s.voiceLabel}</label>
      <div class="voiceRow">
        <input type="text" id="voiceInput" placeholder="${s.voicePlaceholder}" value="${state.voiceTranscript}">
        <button class="btn-mic ${state.isListening?'listening':''}" id="micBtn" aria-label="mic">🎙️</button>
      </div>
      ${!voiceSupported ? `<div class="voiceHint">${s.notSupported}</div>` : ``}
      ${state.isListening ? `<div class="voiceHint">${s.listening}</div>` : ``}
      ${state.voiceAutoSymptoms.length ? `<div class="transcriptBox">${s.autoSelected} ${state.voiceAutoSymptoms.join(", ")}</div>` : ``}
    </div>

    <div class="card">
      <label class="f">${s.symptomsLbl}</label>
      <div>${chips}</div>
      <label class="f">${s.durationLbl}</label>
      <div>${durChips}</div>
      <label class="f">${s.severityLbl}</label>
      <input type="range" min="1" max="5" value="${state.severity}" id="severityRange" style="width:100%;">
      <div style="text-align:center;font-weight:800;color:var(--maroon);font-size:1.1rem;">${state.severity}</div>
      <label class="f">${s.ageGroupLbl}</label>
      <div>${groupChips}</div>
      <div style="height:10px"></div>
      <button class="btn btn-primary" id="assessBtn">${s.submit}</button>
    </div>
    ${resultHtml}
  `;
}

function computeRisk(){
  const danger = ["Breathlessness","Chest pain","Bleeding","Pregnancy-related concern"];
  const hasDanger = [...state.selectedSymptoms].some(sy=>danger.includes(sy));
  let score = state.severity + (state.duration>=2?1:0) + (state.ageGroup===0||state.ageGroup===3?1:0);
  if(hasDanger || score>=7) return "high";
  if(score>=4) return "med";
  return "low";
}

function screenQueue(){
  const s = t().queue;
  const facOptions = FACILITIES.map(f=>`<option value="${f.id}">${f.tier} · ${f.name}</option>`).join("");
  let bookedHtml = "";
  if(state.queueBooked){
    const b = state.queueBooked;
    bookedHtml = `
      <div class="card">
        <div class="eyebrow">${s.live}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div class="muted">${s.token}</div>
            <div style="font-family:var(--font-display);font-size:2rem;color:var(--maroon);">${b.token}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">${s.wait}</div>
            <div style="font-weight:800;">${b.wait} min</div>
            <div class="muted" style="margin-top:2px;">${b.pos} ${s.position}</div>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>
    <div class="card">
      <label class="f">${s.facility}</label>
      <select id="qFacility">${facOptions}</select>
      <label class="f">${s.dept}</label>
      <select id="qDept">
        <option>General OPD</option><option>Maternal & Child Health</option>
        <option>Chronic Disease Clinic</option><option>Teleconsultation — Specialist</option>
      </select>
      <label class="f">${s.slot}</label>
      <select id="qSlot"><option>Today, 2:00–3:00 PM</option><option>Today, 4:00–5:00 PM</option><option>Tomorrow, 10:00–11:00 AM</option></select>
      <div style="height:10px"></div>
      <button class="btn btn-primary" id="bookBtn">${s.book}</button>
    </div>
    ${bookedHtml}
  `;
}

function screenReferral(){
  const s = t().referral;
  const tiers = [
    {name:"Sub-Centre Kondhavale", role:"Initial visit & digital triage", date:"22 Aug, 09:40 AM"},
    {name:"PHC Mulshi", role:"Medical officer consult, referred for diagnostics", date:"22 Aug, 03:10 PM"},
    {name:"Rural Hospital Paud", role:"Diagnostics pending confirmation", date:"Expected 26 Aug"},
    {name:"District Hospital Pune (Aundh)", role:"Specialist review (if required)", date:"Not yet needed"},
  ];
  const rows = tiers.map((tr,i)=>{
    const status = i < state.referralStage ? "done" : i===state.referralStage ? "active" : "";
    return `<div class="step ${status}">
        <div class="dot"></div>
        <div class="body">
          <div class="facility">${tr.name}</div>
          <div class="meta">${tr.role}</div>
          <div class="meta">${tr.date}</div>
        </div>
      </div>`;
  }).join("");
  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>
    <div class="card muted" style="font-size:.8rem;">${s.note}</div>
    <div class="card stepper">${rows}</div>
  `;
}

function screenMap(){
  const s = t().map;
  const legendRows = [
    ["Sub-Centre", s.subCentre], ["PHC", s.phc],
    ["Rural Hospital", s.ruralHospital], ["District Hospital", s.districtHospital]
  ].map(([tier,label])=>`
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="width:14px;height:14px;border-radius:50%;background:${TIER_COLOR[tier]};display:inline-block;flex-shrink:0;"></span>
      <span style="font-size:.85rem;">${label}</span>
    </div>`).join("");

  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>
    <div class="card tight" style="display:flex;flex-wrap:wrap;gap:12px;">${legendRows}</div>
    <div class="card" style="padding:0;overflow:hidden;">
      <div id="facilityMap" style="width:100%;height:360px;"></div>
    </div>
    <div class="muted" style="text-align:center;">${s.tapHint}</div>
  `;
}

let leafletMap = null;
function initFacilityMap(){
  const el = document.getElementById("facilityMap");
  if(!el || typeof L === "undefined") return;

  // Destroy any previous instance before re-rendering (tab re-entry re-creates the container)
  if(leafletMap){ leafletMap.remove(); leafletMap = null; }

  leafletMap = L.map("facilityMap", { scrollWheelZoom:false }).setView([18.75, 74.2], 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:'&copy; OpenStreetMap contributors', maxZoom:18
  }).addTo(leafletMap);

  const s = t().map;
  const tierLabel = { "Sub-Centre":s.subCentre, "PHC":s.phc, "Rural Hospital":s.ruralHospital, "District Hospital":s.districtHospital };
  const bounds = [];

  FACILITIES.forEach(f=>{
    const color = TIER_COLOR[f.tier] || "#4A1942";
    const marker = L.circleMarker([f.lat, f.lng], {
      radius:10, color:"#fff", weight:2, fillColor:color, fillOpacity:0.95
    }).addTo(leafletMap);

    marker.bindPopup(`
      <div style="font-family:${getComputedStyle(document.body).fontFamily};min-width:180px;">
        <div style="font-weight:800;font-size:13px;margin-bottom:2px;">${f.name}</div>
        <div style="font-size:11.5px;color:#6B5A6C;margin-bottom:4px;">${tierLabel[f.tier]} · ${f.district}</div>
        <div style="font-size:10.5px;color:#6B5A6C;margin-bottom:8px;">${s.coordinates}: ${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}</div>
        <button onclick="window.__goToTab('queue')" style="width:100%;margin-bottom:5px;padding:7px;border:none;border-radius:8px;background:#4A1942;color:#fff;font-weight:700;font-size:11.5px;">${s.viewQueue}</button>
        <button onclick="window.__goToTab('meds')" style="width:100%;padding:7px;border:none;border-radius:8px;background:#1F6F5C;color:#fff;font-weight:700;font-size:11.5px;">${s.viewMeds}</button>
      </div>
    `);
    bounds.push([f.lat, f.lng]);
  });

  if(bounds.length) leafletMap.fitBounds(bounds, { padding:[30,30] });

  // Leaflet needs a nudge to size correctly inside a freshly-rendered tab
  setTimeout(()=>leafletMap && leafletMap.invalidateSize(), 200);
}
// Popups use inline onclick, so expose a small bridge to the SPA's tab switcher
window.__goToTab = (tab)=>{ document.querySelector(".sheet, .overlay")?.remove(); setTab(tab); };

function screenMeds(){
  const s = t().meds;
  const q = (state._medQuery||"").toLowerCase();
  const filtered = MEDICINES.filter(m=>m.name.toLowerCase().includes(q) || m.facility.toLowerCase().includes(q));
  const rows = filtered.map(m=>{
    const cls = m.stock==="ok"?"green":m.stock==="low"?"amber":"red";
    const lbl = m.stock==="ok"?"In stock":m.stock==="low"?"Low":"Out of stock";
    return `<tr><td>${m.name}</td><td>${m.facility}</td><td><span class="badge ${cls}">${lbl}</span></td></tr>`;
  }).join("");
  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>
    <div class="card">
      <input type="text" id="medSearch" placeholder="${s.search}" value="${state._medQuery||""}">
    </div>
    <div class="card">
      <div class="eyebrow">${s.nearby}</div>
      <table class="mini"><thead><tr><th>Item</th><th>Facility</th><th>Status</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3" class="muted">No matches</td></tr>`}</tbody></table>
    </div>
  `;
}

function screenDash(){
  const s = t().dash;
  const pending = FOLLOWUPS.filter(f=>!f.contacted).length;
  const fu = FOLLOWUPS.map((f,i)=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1ece2;gap:8px;">
      <div>
        <div style="font-weight:800;font-size:.95rem;">${f.name}</div>
        <div class="muted">${f.tag} · ${f.due}</div>
      </div>
      ${f.contacted ? `<span class="badge green">✓</span>` : `<button class="btn btn-teal btn-sm" data-contact="${i}">${s.contacted}</button>`}
    </div>
  `).join("");
  return `
    <div class="eyebrow">${s.eyebrow}</div>
    <h2 class="section-title">${s.title}</h2>
    <div class="statgrid">
      <div class="stat"><div class="num">47</div><div class="lbl">${s.triaged}</div></div>
      <div class="stat"><div class="num">${pending}</div><div class="lbl">${s.highRisk}</div></div>
      <div class="stat"><div class="num">82%</div><div class="lbl">${s.referralRate}</div></div>
      <div class="stat"><div class="num">3</div><div class="lbl">${s.stockouts}</div></div>
    </div>
    <div class="card">
      <div class="eyebrow">${s.followupList}</div>
      ${fu}
    </div>
  `;
}

function render(){
  let html="";
  switch(state.tab){
    case "home": html = screenHome(); break;
    case "triage": html = screenTriage(); break;
    case "queue": html = screenQueue(); break;
    case "referral": html = screenReferral(); break;
    case "map": html = screenMap(); break;
    case "meds": html = screenMeds(); break;
    case "dash": html = screenDash(); break;
  }
  $("#main").innerHTML = html;
  bindScreenEvents();
  if(state.tab === "map") initFacilityMap();
}

/* ---------------- Voice input (Web Speech API) ---------------- */
function detectSymptomsFromText(text){
  const low = text.toLowerCase();
  const found = [];
  Object.keys(VOICE_KEYWORDS).forEach(sym=>{
    const hit = VOICE_KEYWORDS[sym].some(kw=>low.includes(kw.toLowerCase()));
    if(hit){ found.push(sym); state.selectedSymptoms.add(sym); }
  });
  state.voiceAutoSymptoms = found;
}

function startVoiceInput(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ toast(t().triage.notSupported); return; }
  if(state.isListening){ if(recognition) recognition.stop(); return; }

  recognition = new SR();
  recognition.lang = SPEECH_LOCALE[state.lang] || "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = ()=>{ state.isListening = true; render(); };
  recognition.onerror = ()=>{
    state.isListening = false;
    toast(t().micDenied);
    render();
  };
  recognition.onend = ()=>{ state.isListening = false; render(); };
  recognition.onresult = (event)=>{
    const transcript = event.results[0][0].transcript;
    state.voiceTranscript = transcript;
    detectSymptomsFromText(transcript);
    logActivity("Voice input captured ("+state.lang.toUpperCase()+")");
    render();
  };
  try{ recognition.start(); }catch(e){ toast(t().micDenied); }
}

/* ---------------- Read aloud (Speech Synthesis) ---------------- */
function readResultAloud(){
  if(!window.speechSynthesis){ return; }
  const s = t().triage;
  const r = state.lastRisk;
  const label = r==="high"?s.high:r==="med"?s.med:s.low;
  const body = r==="high"?s.highBody:r==="med"?s.medBody:s.lowBody;
  const utter = new SpeechSynthesisUtterance(label+". "+body);
  utter.lang = SPEECH_LOCALE[state.lang] || "en-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function bindScreenEvents(){
  // Home
  const linkBtn = $("#linkBtn");
  if(linkBtn) linkBtn.onclick = ()=>{
    const id = $("#abhaInput").value.trim();
    const facId = $("#facilitySelect").value;
    if(!id || id.length<4){ toast("Enter a valid ABHA number"); return; }
    state.abhaLinked = true; state.abhaId = id;
    if(facId) state.facility = FACILITIES.find(f=>f.id===facId);
    logActivity("ABHA linked");
    toast(t().toastLinked);
    renderChrome(); render();
  };
  $all(".tile").forEach(el=>el.onclick=()=>setTab(el.dataset.go));

  // Triage — voice
  const micBtn = $("#micBtn");
  if(micBtn) micBtn.onclick = startVoiceInput;
  const voiceInput = $("#voiceInput");
  if(voiceInput) voiceInput.oninput = (e)=>{
    state.voiceTranscript = e.target.value;
    detectSymptomsFromText(e.target.value);
  };

  // Triage — symptoms/duration/age/severity
  $all(".chip[data-sym]").forEach(el=>el.onclick=()=>{
    const sym = el.dataset.sym;
    state.selectedSymptoms.has(sym) ? state.selectedSymptoms.delete(sym) : state.selectedSymptoms.add(sym);
    render();
  });
  $all(".chip[data-dur]").forEach(el=>el.onclick=()=>{ state.duration = +el.dataset.dur; render(); });
  $all(".chip[data-grp]").forEach(el=>el.onclick=()=>{ state.ageGroup = +el.dataset.grp; render(); });
  const sevRange = $("#severityRange");
  if(sevRange) sevRange.oninput = (e)=>{
    state.severity = +e.target.value;
    sevRange.nextElementSibling.textContent = state.severity;
  };
  const assessBtn = $("#assessBtn");
  if(assessBtn) assessBtn.onclick = ()=>{
    state.lastRisk = computeRisk();
    logActivity("Triage completed — "+state.lastRisk.toUpperCase()+" risk");
    render();
  };
  const triageAction = $("#triageAction");
  if(triageAction) triageAction.onclick = ()=>{
    if(state.lastRisk==="high"){ openSOS(); } else { setTab("queue"); }
  };
  const readAloudBtn = $("#readAloudBtn");
  if(readAloudBtn) readAloudBtn.onclick = readResultAloud;

  // Queue
  const bookBtn = $("#bookBtn");
  if(bookBtn) bookBtn.onclick = ()=>{
    const token = "T-"+Math.floor(100+Math.random()*800);
    const wait = 10+Math.floor(Math.random()*40);
    const pos = 1+Math.floor(Math.random()*6);
    state.queueBooked = {token, wait, pos};
    logActivity("Appointment booked — "+token);
    toast(t().toastBooked+" "+token);
    render();
  };

  // Meds
  const medSearch = $("#medSearch");
  if(medSearch) medSearch.oninput = (e)=>{
    state._medQuery = e.target.value; render();
    setTimeout(()=>{ const el=$("#medSearch"); if(el){ el.focus(); el.selectionStart=el.selectionEnd=el.value.length; } },0);
  };

  // Dashboard
  $all("[data-contact]").forEach(el=>el.onclick=()=>{
    FOLLOWUPS[+el.dataset.contact].contacted = true;
    toast(t().toastContacted);
    render();
  });
}

/* ---------------- SOS ---------------- */
function openSOS(){
  const s = t().sos;
  const nearest = state.facility ? state.facility.name : FACILITIES[2].name;
  const el = document.createElement("div");
  el.className="overlay";
  el.innerHTML = `
    <div class="sheet">
      <button class="closeX" id="sosClose">✕</button>
      <h3>${s.title}</h3>
      <p class="muted">${s.body}</p>
      <div class="card tight"><b>${s.nearest}:</b> ${nearest}</div>
      <div style="height:10px"></div>
      <button class="btn btn-primary" id="sosCall">${s.call}</button>
      <div style="height:10px"></div>
      <button class="btn btn-gold" id="sosAlert">${s.alert}</button>
      <div style="height:10px"></div>
      <button class="btn btn-outline" id="sosCancel">${s.cancel}</button>
    </div>
  `;
  document.body.appendChild(el);
  el.querySelector("#sosClose").onclick = ()=>el.remove();
  el.querySelector("#sosCancel").onclick = ()=>el.remove();
  el.querySelector("#sosCall").onclick = ()=>{ toast("📞 Simulated call to 108"); };
  el.querySelector("#sosAlert").onclick = ()=>{
    toast(t().toastAlert);
    logActivity("Emergency alert sent to "+nearest);
    el.remove();
  };
}

/* ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  $("#sosBtn").onclick = openSOS;
  $all("#langsel button").forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
  $all("nav.tabs button").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  $("#textSizeBtn").onclick = toggleLargeText;

  renderChrome();
  render();
});
