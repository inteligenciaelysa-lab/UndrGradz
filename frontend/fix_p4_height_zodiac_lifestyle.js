const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

// Replace _ob4P4, _ob4AUHeight

const p4Start = app.indexOf('function _ob4P4(){');
const p4End = app.indexOf('function _ob4ValidateAll4(){', p4Start);

if (p4Start === -1 || p4End === -1) {
  console.error("Could not locate _ob4P4 block");
  process.exit(1);
}

const newP4Code = `function _ob4P4(){
  var m=parseInt((suData&&suData.bMonth)||(_ob4State.dobMonth||0));
  var d=parseInt((suData&&suData.bDay)||(_ob4State.dobDay||0));
  var zodiac=_ob4GetZodiac(m,d);
  if(!zodiac&&suData&&suData.zodiacEmoji&&suData.zodiac)zodiac=suData.zodiacEmoji+' '+suData.zodiac;
  if(zodiac&&!_ob4State.zodiac) _ob4State.zodiac=zodiac;

  var isEs=window.currentLang==='es';

  function chips(options, stateKey, multi, maxCount){
    return options.map(function(o){
      var val=Array.isArray(o)?o[0]:o;
      var lbl=Array.isArray(o)?o[1]:o;
      var cur=_ob4State[stateKey];
      var on=multi?(cur&&cur.indexOf(val)>-1):(cur===val);
      return '<div class="ob4-chip'+(on?' on':'')+'" onclick="_ob4AUPick(\\\''+stateKey+'\\\',\\\''+val.replace(/'/g,'\\\\\\\'')+'\\\',' +(multi?'true':'false')+','+(maxCount||'null')+')" style="padding:7px 14px;font-size:12.5px;font-weight:800;">'+lbl+'</div>';
    }).join('');
  }

  // Ethnicity (Max 2)
  var ETHNICITIES=isEs?
    ['Blanco/a','Latino / Hispano','Negro / Afroamericano','Asiático/a','Oriente Medio','Nativo Americano','Isleño del Pacífico','Mestizo/a']:
    ['White','Latino / Hispanic','Black / African American','Asian','Middle Eastern','Native American','Pacific Islander','Mixed / Biracial'];

  // Religion
  var RELIGIONS=isEs?
    ['Ateo/a','Agnóstico/a','Cristiano','Católico','Judío','Musulmán','Hindu','Budista','Espiritual','Otro']:
    ['Atheist','Agnostic','Christian','Catholic','Jewish','Muslim','Hindu','Buddhist','Spiritual','Other'];

  // Politics
  var POLITICS=isEs?
    ['Liberal','Moderado','Conservador','Apolítico']:
    ['Liberal','Moderate','Conservative','Apolitical'];

  // Pronouns
  var PRONOUNS=isEs?
    ['él/él','ella/ella','elle/elle','él o ella','cualquier pronombre','Otro']:
    ['he/him','she/her','they/them','he/they','she/they','any/all','Other'];

  // Sexual Orientation
  var ORIENTATIONS=isEs?
    ['Heterosexual','Gay','Lesbiana','Bisexual','Pansexual','Asexual','Queer','Fluido','Otro']:
    ['Straight','Gay','Lesbian','Bisexual','Pansexual','Asexual','Queer','Fluid','Other'];

  // Lifestyle - Workout & Diet
  var WORKOUT=isEs?
    [['Gym rat','🏋️ Rata de gimnasio'],['Runner','🏃 Corredor/a'],['Sports','🌐 Deportes'],['Yoga/Pilates','🧘 Yoga/Pilates'],['Casual mover','🚶 Movimiento casual'],['Not my thing','🛌 No es lo mío']]:
    [['Gym rat','🏋️ Gym rat'],['Runner','🏃 Runner'],['Sports','🌐 Sports'],['Yoga/Pilates','🧘 Yoga/Pilates'],['Casual mover','🚶 Casual mover'],['Not my thing','🛌 Not my thing']];

  var DIET=isEs?
    [['Anything','🍽️ De todo'],['Vegetarian','🥗 Vegetariano/a'],['Vegan','🌱 Vegano/a'],['Halal','☪️ Halal'],['Kosher','✡️ Kosher'],['Gluten-free','🌾 Sin gluten']]:
    [['Anything','🍽️ Anything'],['Vegetarian','🥗 Vegetarian'],['Vegan','🌱 Vegan'],['Halal','☪️ Halal'],['Kosher','✡️ Kosher'],['Gluten-free','🌾 Gluten-free']];

  // Lifestyle - Drinking & Smoking matching exact image names
  var DRINKING=isEs?
    [['Non-drinker','No bebo'],['Social drinker','Bebedor/a social'],['Regular drinker','Bebedor/a regular']]:
    [['Non-drinker','Non-drinker'],['Social drinker','Social drinker'],['Regular drinker','Regular drinker']];

  var SMOKING=isEs?
    [['Non-smoker','No fumo'],['Socially','Socialmente'],['Regularly','Regularmente'],['Vaper/Juul','Vapeo/Juul']]:
    [['Non-smoker','Non-smoker'],['Socially','Socially'],['Regularly','Regularly'],['Vaper/Juul','Vaper/Juul']];

  // Country / State / City
  var countries = (typeof GEO_COUNTRIES!=='undefined'?GEO_COUNTRIES:['Mexico','United States','Canada','Other']);
  var selCountry=_ob4State.fromCountry||'';
  var countryOpts='<option value="">'+(isEs?'País':'Country')+'</option>'+countries.map(function(c){return '<option value="'+c+'"'+(selCountry===c?' selected':'')+'>'+c+'</option>';}).join('');

  var selState=_ob4State.fromState||'';
  var stateOpts='<option value="">'+(isEs?'Estado / Provincia':'State / Province')+'</option>';
  if(selCountry&&typeof GEO_STATES!=='undefined'&&GEO_STATES[selCountry]){
    stateOpts+=GEO_STATES[selCountry].map(function(s){return '<option value="'+s+'"'+(selState===s?' selected':'')+'>'+s+'</option>';}).join('');
  }

  var selCity=_ob4State.fromCity||'';
  var cityOpts='<option value="">'+(isEs?'Ciudad de origen':'Hometown city')+'</option>';
  var cityList = [];
  if(selState&&typeof GEO_CITIES!=='undefined'&&GEO_CITIES[selState]){
    cityList = GEO_CITIES[selState];
  } else if(selCountry&&typeof GEO_COUNTRY_CITIES!=='undefined'&&GEO_COUNTRY_CITIES[selCountry]){
    cityList = GEO_COUNTRY_CITIES[selCountry];
  }
  if (cityList.length > 0) {
    cityOpts += cityList.map(function(ct){ return '<option value="'+ct+'"'+(selCity===ct?' selected':'')+'>'+ct+'</option>'; }).join('') + '<option value="Other"'+(selCity==='Other'?' selected':'')+'>'+(isEs?'Otra':'Other')+'</option>';
  } else {
    cityOpts += '<option value="Other" selected>'+(isEs?'Escribe tu ciudad':'Type your city')+'</option>';
  }

  // Height state calculation & persistence
  var ftVal = parseInt(_ob4State.heightFt) || 0;
  var inVal = parseInt(_ob4State.heightIn) || 0;
  var cmVal = _ob4State.heightCm || (ftVal ? Math.round((ftVal * 12 + inVal) * 2.54) : null);
  if (cmVal) _ob4State.heightCm = cmVal;

  function section(icon, title, content){
    return '<div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:16px;margin-top:16px;">'+
      '<div class="ob4-flabel" style="margin:0 0 10px;display:flex;align-items:center;gap:7px;"><span style="font-size:16px;">'+icon+'</span><span>'+title+'</span></div>'+
      content+
    '</div>';
  }

  var btnContinue=isEs?'Continuar ›':'Continue ›';
  var noteText=isEs?'🔒 Solo comparte lo que te sientas cómod@ compartiendo':'🔒 Only share what you feel comfortable sharing';

  // Clean Zodiac Sign display (no auto-calculated, no mini sign duplicate)
  var zodiacStr = _ob4State.zodiac || '';
  var zodiacParts = zodiacStr.trim().split(' ');
  var zodiacIcon = zodiacParts[0] || '⭐';
  var zodiacName = zodiacParts.slice(1).join(' ') || (zodiacStr && zodiacStr !== zodiacIcon ? zodiacStr : (isEs?'Tu signo':'Your sign'));

  return '<div>'+
    // 1. Add Your Photos Card
    _ob4RenderPhotoGridP4()+
    // 2. Languages You Speak
    _ob4RenderLangsP4()+
    // 3. Ethnicity
    section('🌍', isEs?'Etnicidad (máx 2)':'Ethnicity (max 2)',
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(ETHNICITIES,'ethnicity',true,2)+'</div>'
    )+
    // Religion
    section('✝️', isEs?'Religión':'Religion',
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(RELIGIONS,'religion',false)+'</div>'
    )+
    // Politics
    section('🗳️', isEs?'Política':'Politics',
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(POLITICS,'politics',false)+'</div>'
    )+
    // Pronouns
    section('💬', isEs?'Pronombres':'Pronouns',
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(PRONOUNS,'pronouns',false)+'</div>'
    )+
    // Sexual Orientation
    section('🏳️‍🌈', isEs?'Orientación sexual':'Sexual Orientation',
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(ORIENTATIONS,'orientation',false)+'</div>'
    )+
    // Height (3 to 7 feet, persisted cm)
    section('📏', isEs?'Altura':'Height',
      '<div style="display:flex;gap:10px;align-items:center;">'+
        '<select class="gi" id="ob4-height-ft" onchange="_ob4AUHeight()" style="flex:1;">'+
          '<option value="">'+(isEs?'Pies':'Feet')+'</option>'+
          [3,4,5,6,7].map(function(f){return '<option value="'+f+'"'+((ftVal===f)?' selected':'')+'>'+f+'\\\''+'</option>';}).join('')+
        '</select>'+
        '<select class="gi" id="ob4-height-in" onchange="_ob4AUHeight()" style="flex:1;">'+
          '<option value="">'+(isEs?'Pulgadas':'Inches')+'</option>'+
          [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){return '<option value="'+i+'"'+((inVal===i&&ftVal)?' selected':'')+'>'+i+'"</option>';}).join('')+
        '</select>'+
        '<span style="font-size:13px;font-weight:800;color:#c4b5fd;min-width:60px;text-align:center;" id="ob4-height-cm">'+(cmVal?cmVal+' cm':'— cm')+'</span>'+
      '</div>'
    )+
    // Origin
    section('📍', isEs?'Lugar de origen':'Origin',
      '<div style="display:flex;flex-direction:column;gap:10px;">'+
        '<select class="gi" id="ob4-from-country" onchange="_ob4AUCountry(this.value)">'+countryOpts+'</select>'+
        '<select class="gi" id="ob4-from-state" onchange="_ob4AUState(this.value)">'+stateOpts+'</select>'+
        '<select class="gi" id="ob4-from-city" onchange="_ob4AUCity(this.value)">'+cityOpts+'</select>'+
      '</div>'
    )+
    // Zodiac (Clean: Icon + Name only, no auto-calc subtitle, no duplicate emoji)
    section('⭐', isEs?'Signo zodiacal':'Zodiac Sign',
      '<div style="padding:12px 16px;background:rgba(196,181,253,0.07);border:1px solid rgba(196,181,253,0.2);border-radius:16px;display:flex;align-items:center;gap:12px;">'+
        '<div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,rgba(168,85,247,0.3),rgba(124,58,237,0.3));border:1px solid rgba(168,85,247,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">'+zodiacIcon+'</div>'+
        '<div style="color:#fff;font-size:15px;font-weight:800;">'+zodiacName+'</div>'+
      '</div>'
    )+
    // Lifestyle
    section('🌿', isEs?'Estilo de vida':'Lifestyle',
      '<div style="display:flex;flex-direction:column;gap:14px;">'+
        '<div>'+
          '<div style="font-size:11.5px;font-weight:900;color:var(--fg2);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:8px;">💪 '+(isEs?'Entrenamiento':'Workout')+'</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(WORKOUT,'workout',false)+'</div>'+
        '</div>'+
        '<div>'+
          '<div style="font-size:11.5px;font-weight:900;color:var(--fg2);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:8px;">🥗 '+(isEs?'Dieta':'Diet')+'</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(DIET,'diet',false)+'</div>'+
        '</div>'+
        '<div>'+
          '<div style="font-size:11.5px;font-weight:900;color:var(--fg2);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:8px;">🍻 '+(isEs?'Alcohol':'Drinking')+'</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(DRINKING,'drinking',false)+'</div>'+
        '</div>'+
        '<div>'+
          '<div style="font-size:11.5px;font-weight:900;color:var(--fg2);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:8px;">🚬 '+(isEs?'Tabaco':'Smoking')+'</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chips(SMOKING,'smoking',false)+'</div>'+
        '</div>'+
      '</div>'
    )+
    '<div style="height:110px;"></div>'+
    '</div>'+
    '<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:380px;max-width:100%;box-sizing:border-box;padding:24px 16px 16px;background:linear-gradient(180deg,rgba(8,4,15,0) 0%,rgba(8,4,15,0.98) 35%,#08040f 100%);z-index:10000;pointer-events:auto;">'+
      '<button class="ob4-cta" id="ob4-continue-btn-p4" onclick="_ob4Next4()" style="margin:0;width:100%;">'+btnContinue+'</button>'+
      '<div style="text-align:center;font-size:11px;color:var(--fg3);margin-top:8px;">'+noteText+'</div>'+
    '</div>';
}

function _ob4AUHeight(){
  var ftEl = document.getElementById('ob4-height-ft');
  var inEl = document.getElementById('ob4-height-in');
  var ft = parseInt(ftEl ? ftEl.value : (_ob4State.heightFt || 0)) || 0;
  var inch = parseInt(inEl ? inEl.value : (_ob4State.heightIn || 0)) || 0;

  _ob4State.heightFt = ft;
  _ob4State.heightIn = inch;

  if (ft > 0) {
    var totalInches = ft * 12 + inch;
    var cm = Math.round(totalInches * 2.54);
    _ob4State.heightCm = cm;
    _ob4State.height = ft + "'" + (inch ? inch + '"' : '');
    var cmEl = document.getElementById('ob4-height-cm');
    if (cmEl) cmEl.textContent = cm + ' cm';
  } else {
    _ob4State.heightCm = null;
    _ob4State.height = null;
    var cmEl2 = document.getElementById('ob4-height-cm');
    if (cmEl2) cmEl2.textContent = '— cm';
  }
}`;

app = app.substring(0, p4Start) + newP4Code + app.substring(p4End);

fs.writeFileSync('app.js', app);
console.log("Successfully updated Height persistence, Zodiac clean view, and Lifestyle names!");
