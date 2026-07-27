const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

const targetStr = `function _ob4AUHeight(){
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

const replacementStr = targetStr + `\n
function _ob4AUPick(key, val, multi, maxCount){
  if(multi){
    if(!_ob4State[key]) _ob4State[key] = [];
    if(!Array.isArray(_ob4State[key])) _ob4State[key] = [_ob4State[key]];
    var idx = _ob4State[key].indexOf(val);
    if (idx > -1) {
      _ob4State[key].splice(idx, 1);
    } else {
      if (maxCount && _ob4State[key].length >= maxCount) {
        return;
      }
      _ob4State[key].push(val);
    }
  } else {
    if (_ob4State[key] === val) {
      _ob4State[key] = '';
    } else {
      _ob4State[key] = val;
    }
  }
  _ob4Go(4);
}

function _ob4AUCountry(val){
  _ob4State.fromCountry = val;
  _ob4State.fromState = '';
  _ob4State.fromCity = '';
  _ob4Go(4);
}

function _ob4AUState(val){
  _ob4State.fromState = val;
  _ob4State.fromCity = '';
  _ob4Go(4);
}

function _ob4AUCity(val){
  _ob4State.fromCity = val;
}
`;

if (!app.includes(targetStr)) {
  console.error("Could not find target _ob4AUHeight block in app.js");
  process.exit(1);
}

app = app.replace(targetStr, replacementStr);
fs.writeFileSync('app.js', app);
console.log("Successfully restored _ob4AUPick, _ob4AUCountry, _ob4AUState, and _ob4AUCity!");
