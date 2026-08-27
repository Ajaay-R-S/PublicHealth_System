/* Mock Maharashtra facility tiers (sample, representative — not exhaustive).
   lat/lng are indicative placements for demo purposes (approximate town/village
   centres), not surveyed GPS points — swap in real HMIS/NHM coordinates for
   production use. */
const FACILITIES = [
  {id:"sc1", tier:"Sub-Centre", name:"Sub-Centre Kondhavale", district:"Pune", lat:18.5679, lng:73.4526},
  {id:"phc1", tier:"PHC", name:"PHC Mulshi", district:"Pune", lat:18.5167, lng:73.4833},
  {id:"rh1", tier:"Rural Hospital", name:"Rural Hospital Paud", district:"Pune", lat:18.5333, lng:73.5833},
  {id:"dh1", tier:"District Hospital", name:"District Hospital Pune (Aundh)", district:"Pune", lat:18.5636, lng:73.8077},
  {id:"phc2", tier:"PHC", name:"PHC Karjat", district:"Ahmednagar", lat:18.9107, lng:74.9863},
  {id:"dh2", tier:"District Hospital", name:"District Hospital Ahmednagar", district:"Ahmednagar", lat:19.0948, lng:74.7480},
];

/* Marker colour per facility tier, used on the map screen */
const TIER_COLOR = {
  "Sub-Centre": "#1F6F5C",
  "PHC": "#C9971E",
  "Rural Hospital": "#9C4221",
  "District Hospital": "#AE3226"
};

const SYMPTOMS = ["Fever","Cough","Breathlessness","Chest pain","Severe headache","Vomiting/Diarrhoea",
  "Abdominal pain","Bleeding","Pregnancy-related concern","Weakness/Fatigue","Skin rash","Joint pain"];

/* Keyword map so a Marathi/Hindi/English voice transcript can auto-select symptom chips.
   Matching is a simple case-insensitive substring check — good enough for a prototype demo. */
const VOICE_KEYWORDS = {
  "Fever": ["fever","tap","taap","bukhar","बुखार","ताप"],
  "Cough": ["cough","khansi","khokla","खांसी","खोकला"],
  "Breathlessness": ["breath","saans","shwas","दम","श्वास","सांस"],
  "Chest pain": ["chest","chati","seene","छाती","सीने"],
  "Severe headache": ["headache","sir dard","dokedukhi","सिरदर्द","डोकेदुखी","डोके दुखणे"],
  "Vomiting/Diarrhoea": ["vomit","ulti","julab","दस्त","उलटी","जुलाब","loose motion"],
  "Abdominal pain": ["stomach","pet dard","पेट दर्द","पोट दुखणे","पोटदुखी"],
  "Bleeding": ["bleeding","khoon","rakt","खून","रक्तस्राव"],
  "Pregnancy-related concern": ["pregnant","garbh","गर्भवती","गरोदर"],
  "Weakness/Fatigue": ["weak","kamzori","thakwa","कमजोरी","थकवा"],
  "Skin rash": ["rash","khujli","त्वचा","खाज","खाज सुटणे"],
  "Joint pain": ["joint","jodo dard","sandhe","जोड़ों में दर्द","सांधे दुखणे"]
};

const MEDICINES = [
  {name:"Paracetamol 500mg", facility:"PHC Mulshi", stock:"ok"},
  {name:"ORS + Zinc", facility:"Sub-Centre Kondhavale", stock:"low"},
  {name:"Iron-Folic Acid tabs", facility:"PHC Mulshi", stock:"ok"},
  {name:"Amoxicillin 500mg", facility:"Rural Hospital Paud", stock:"out"},
  {name:"Insulin (Regular)", facility:"District Hospital Pune (Aundh)", stock:"ok"},
  {name:"Anti-snake venom", facility:"District Hospital Pune (Aundh)", stock:"low"},
  {name:"BP medication (Amlodipine)", facility:"PHC Karjat", stock:"ok"},
  {name:"X-Ray diagnostics", facility:"Rural Hospital Paud", stock:"ok"},
  {name:"Blood glucose test", facility:"PHC Mulshi", stock:"ok"},
  {name:"Ultrasound (Antenatal)", facility:"District Hospital Ahmednagar", stock:"low"},
];

const FOLLOWUPS = [
  {name:"Sunita P.", tag:"Maternal — 3rd trimester", due:"Today", contacted:false},
  {name:"Ravi K. (age 4)", tag:"Child — growth monitoring", due:"Tomorrow", contacted:false},
  {name:"Ashok D.", tag:"Chronic — hypertension", due:"Overdue 2 days", contacted:false},
  {name:"Meera J.", tag:"Maternal — postnatal", due:"In 3 days", contacted:false},
];
