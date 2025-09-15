/* 100s Test - Single Page App */
const VIEWS = {
  menu: document.getElementById('view-menu'),
  setup: document.getElementById('view-setup'),
  game: document.getElementById('view-game'),
  end: document.getElementById('view-end'),
  lbMenu: document.getElementById('view-lb-menu'),
  lb: document.getElementById('view-lb'),
  settings: document.getElementById('view-settings')
};
const els = {
  highscoreValue: document.getElementById('highscoreValue'),
  highscoreBar: document.getElementById('highscoreBar'),
  countdown: document.getElementById('countdown'),
  timerBubble: document.getElementById('timerBubble'),
  questionNumber: document.getElementById('questionNumber'),
  questionBox: document.getElementById('questionBox'),
  answerInput: document.getElementById('answerInput'),
  endTitle: document.getElementById('endTitle'),
  endValue: document.getElementById('endValue'),
  replayBtn: document.getElementById('replayBtn'),
  quitToMenuBtn: document.getElementById('quitToMenuBtn'),
  quitGame: document.getElementById('quitGame'),
  // setup
  setupTitle: document.getElementById('setupTitle'),
  timeRow: document.getElementById('timeRow'),
  timeInput: document.getElementById('timeInput'),
  opAdd: document.getElementById('opAdd'),
  opSub: document.getElementById('opSub'),
  opMul: document.getElementById('opMul'),
  opDiv: document.getElementById('opDiv'),
  // leaderboard
  lbHeading: document.getElementById('lbHeading'),
  lbBody: document.getElementById('lbBody'),
  lbBack: document.getElementById('lbBack'),
  lbBack2: document.getElementById('lbBack2'),
  lbNote: document.getElementById('lbNote'),
  lbScoreHead: document.getElementById('lbScoreHead'),
  // settings
  usernameInput: document.getElementById('usernameInput'),
  clearOnIncorrect: document.getElementById('clearOnIncorrect'),
  sfxToggle: document.getElementById('sfxToggle'),
};

// Routing helpers
function show(id){
  for(const k in VIEWS) VIEWS[k].classList.remove('active');
  id.classList.add('active');
}

// Basic sound wrapper
function clickSfx(){ if(SFX.enabled()) SFX.play('click') }
function correctSfx(){ if(SFX.enabled()) SFX.play('correct') }
function incorrectSfx(){ if(SFX.enabled()) SFX.play('incorrect') }

// Persistent storage
const store = {
  get(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)) }
};

// Leaderboard keys
const KEYS = {
  username: '100s_username',
  clearOnIncorrect: '100s_clearOnIncorrect',
  sfx: '100s_sfx',
  hs100s: '100s_hs_time',
  hsTA30: '100s_hs_ta30',
  hsTA60: '100s_hs_ta60',
  lb100s: '100s_lb_time',
  lbTA30: '100s_lb_30',
  lbTA60: '100s_lb_60',
};

// Game State
let currentMode = null; // '100s' | 'ta' | 'practice'
let taSeconds = 30;
let qIndex = 0;
let totalCorrect = 0;
let timerStart = 0;
let timerInterval = null;
let countdownInterval = null;
let lastQuestion = null;

// Init
function init(){
  // Restore settings
  els.usernameInput.value = store.get(KEYS.username, '') || '';
  els.clearOnIncorrect.checked = store.get(KEYS.clearOnIncorrect, true);
  els.sfxToggle.checked = store.get(KEYS.sfx, true);

  updateHighscoreBar();
  wireEvents();
}
function updateHighscoreBar(){
  if(currentMode === 'ta'){
    els.highscoreValue.textContent = ''; return;
  }
  const best = store.get(KEYS.hs100s, null);
  els.highscoreValue.textContent = best ? formatTime(best) : '';
}

// Event wiring
function wireEvents(){
  document.getElementById('btn-100s').addEventListener('click', () => { clickSfx(); currentMode='100s'; openSetup('100s Mode'); });
  document.getElementById('btn-ta').addEventListener('click', () => { clickSfx(); currentMode='ta'; openSetup('Time Attack Mode', true); });
  document.getElementById('btn-practice').addEventListener('click', () => { clickSfx(); currentMode='practice'; openSetup('Practice Mode'); });

  document.getElementById('backToMenu').addEventListener('click', () => { clickSfx(); show(VIEWS.menu); updateHighscoreBar(); });
  document.getElementById('startGame').addEventListener('click', () => { clickSfx(); startCountdown(); });
  els.answerInput.addEventListener('keydown', onAnswerKey);
  els.replayBtn.addEventListener('click', () => { clickSfx(); openSetup( currentMode === 'ta' ? 'Time Attack Mode' : (currentMode==='100s'?'100s Mode': 'Practice Mode'), currentMode==='ta' ); });
  els.quitToMenuBtn.addEventListener('click', () => { clickSfx(); show(VIEWS.menu); updateHighscoreBar(); });
  els.quitGame.addEventListener('click', () => { clickSfx(); stopTimers(); show(VIEWS.menu); updateHighscoreBar(); });

  // Icons
  document.getElementById('leaderboardIcon').addEventListener('click', () => { clickSfx(); openLbMenu(); });
  document.getElementById('settingsIcon').addEventListener('click', () => { clickSfx(); openSettings(); });

  // LB menu
  document.querySelectorAll('#view-lb-menu [data-lb]').forEach(btn => btn.addEventListener('click', () => { clickSfx(); openLeaderboard(btn.dataset.lb); }));
  els.lbBack.addEventListener('click', () => { clickSfx(); show(VIEWS.menu); });
  els.lbBack2.addEventListener('click', () => { clickSfx(); openLbMenu(); });

  // Settings
  els.settingsBack.addEventListener('click', () => { clickSfx(); show(VIEWS.menu); updateHighscoreBar(); });
  els.usernameInput.addEventListener('input', () => store.set(KEYS.username, els.usernameInput.value.trim()));
  els.clearOnIncorrect.addEventListener('change', () => store.set(KEYS.clearOnIncorrect, els.clearOnIncorrect.checked));
  els.sfxToggle.addEventListener('change', () => store.set(KEYS.sfx, els.sfxToggle.checked));
}

function openSettings(){
  show(VIEWS.settings);
}

function openSetup(title, showTime=false){
  els.setupTitle.textContent = title;
  els.timeRow.classList.toggle('hidden', !showTime);
  show(VIEWS.setup);
}

function openLbMenu(){
  show(VIEWS.lbMenu);
}

function openLeaderboard(which){
  show(VIEWS.lb);
  let heading = '';
  let key = '';
  let scoreHead = 'Time';
  if(which === 'hundreds'){ heading='100s Mode — LEADERBOARD'; key=KEYS.lb100s; scoreHead='Time'; els.lbNote.textContent='Top 100 times (lower is better)'; }
  if(which === 'ta30'){ heading='30 Seconds Time Attack — LEADERBOARD'; key=KEYS.lbTA30; scoreHead='Score'; els.lbNote.textContent='Top 100 scores of users'; }
  if(which === 'ta60'){ heading='1 Minute Time Attack — LEADERBOARD'; key=KEYS.lbTA60; scoreHead='Score'; els.lbNote.textContent='Top 100 scores of users'; }

  els.lbHeading.textContent = heading;
  els.lbScoreHead.textContent = scoreHead;
  const rows = store.get(key, []);
  renderLeaderboard(rows, scoreHead === 'Time');
}

function renderLeaderboard(rows, isTime){
  els.lbBody.innerHTML = '';
  rows.slice(0,100).forEach((row, idx) => {
    const tr = document.createElement('tr');
    const name = row.name || 'USER';
    const val = isTime ? formatTime(row.value) : row.value;
    tr.innerHTML = `<td>${idx+1}</td><td>${esc(name)}</td><td>${val}</td>`;
    els.lbBody.appendChild(tr);
  });
}

// ================== GAME LOGIC ===================
function startCountdown(){
  // Time value for TA
  if(currentMode === 'ta'){
    taSeconds = parseTimeInput(els.timeInput.value) || 30;
    els.timerBubble.textContent = formatSeconds(taSeconds);
  }else{
    els.timerBubble.textContent = '00:00';
  }

  show(VIEWS.game);
  els.answerInput.value = '';
  els.answerInput.blur();
  els.countdown.textContent = '3';
  els.countdown.classList.remove('hidden');
  els.questionBox.textContent = '';
  totalCorrect = 0;
  qIndex = 0;
  lastQuestion = null;
  els.questionNumber.textContent = '';

  let c = 3;
  countdownInterval = setInterval(() => {
    c--;
    if(c<=0){
      clearInterval(countdownInterval);
      els.countdown.classList.add('hidden');
      startGame();
    }else{
      els.countdown.textContent = String(c);
    }
  }, 1000);
}

function startGame(){
  timerStart = performance.now();
  if(currentMode === 'ta'){
    startCountdownTimer(taSeconds);
    els.questionNumber.textContent = '';
  }else{
    startStopwatch();
    els.questionNumber.textContent = '001';
  }
  nextQuestion();
  els.answerInput.focus();
}
function stopTimers(){
  clearInterval(timerInterval); timerInterval=null;
  clearInterval(countdownInterval); countdownInterval=null;
}

function startStopwatch(){
  stopTimers();
  timerInterval = setInterval(() => {
    const elapsed = performance.now() - timerStart;
    els.timerBubble.textContent = formatTime(elapsed);
  }, 50);
}
function startCountdownTimer(seconds){
  stopTimers();
  const endAt = performance.now() + seconds * 1000;
  timerInterval = setInterval(() => {
    const left = Math.max(0, endAt - performance.now());
    els.timerBubble.textContent = formatTime(left, true);
    if(left <= 0){
      clearInterval(timerInterval);
      endGameTA();
    }
  }, 50);
}

function onAnswerKey(e){
  if(e.key === 'Enter'){
    const given = els.answerInput.value.trim();
    if(given === '') return;
    if(String(lastQuestion.answer) === given){
      correctSfx();
      if(currentMode === 'ta'){
        totalCorrect++;
        nextQuestion();
        els.answerInput.value='';
      }else{
        // 100s or practice
        totalCorrect++;
        qIndex++;
        if(currentMode === '100s' && qIndex>=100){
          endGame100s();
        }else{
          if(currentMode==='100s') els.questionNumber.textContent = String(qIndex+1).padStart(3,'0');
          nextQuestion();
          els.answerInput.value='';
        }
      }
    }else{
      incorrectSfx();
      if(getSettingClearOnIncorrect()) els.answerInput.value='';
    }
  }
}

function nextQuestion(){
  const ops = getSelectedOps();
  if(ops.length === 0){
    // Force at least one op
    alert('Please select at least one operation in setup.');
    stopTimers();
    show(VIEWS.setup);
    return;
  }

  lastQuestion = generateQuestion(ops);
  els.questionBox.textContent = lastQuestion.text;
}

function endGame100s(){
  stopTimers();
  const elapsed = performance.now() - timerStart;
  els.endTitle.textContent = 'YOUR TIME:';
  els.endValue.textContent = formatTime(elapsed);
  show(VIEWS.end);

  // Save if all four selected
  const allFour = allOpsSelected();
  if(allFour){
    // Highscore (lowest time wins)
    const best = store.get(KEYS.hs100s, null);
    if(best == null || elapsed < best){
      store.set(KEYS.hs100s, elapsed);
    }
    // Leaderboard
    pushLeaderboard(KEYS.lb100s, {name: getUsername(), value: elapsed}, true);
  }
  updateHighscoreBar();
}

function endGameTA(){
  stopTimers();
  els.endTitle.textContent = 'YOUR SCORE:';
  els.endValue.textContent = String(totalCorrect);
  show(VIEWS.end);

  const allFour = allOpsSelected();
  if(allFour && (taSeconds===30 || taSeconds===60)){
    const key = taSeconds===30 ? KEYS.hsTA30 : KEYS.hsTA60;
    const best = store.get(key, 0);
    if(totalCorrect > best) store.set(key, totalCorrect);

    // Leaderboard
    const lbKey = taSeconds===30 ? KEYS.lbTA30 : KEYS.lbTA60;
    pushLeaderboard(lbKey, {name: getUsername(), value: totalCorrect}, false);
  }
}

function pushLeaderboard(key, entry, isTime){
  const rows = store.get(key, []);
  rows.push(entry);
  rows.sort((a,b) => isTime ? (a.value - b.value) : (b.value - a.value));
  store.set(key, rows.slice(0,100)); // keep top 100 only
}

// ================== UTILS ===================
function getSelectedOps(){
  const ops = [];
  if(els.opAdd.checked) ops.push('add');
  if(els.opSub.checked) ops.push('sub');
  if(els.opMul.checked) ops.push('mul');
  if(els.opDiv.checked) ops.push('div');
  return ops;
}
function allOpsSelected(){ return els.opAdd.checked && els.opSub.checked && els.opMul.checked && els.opDiv.checked }

function getUsername(){ return els.usernameInput.value.trim() || 'USER' }
function getSettingClearOnIncorrect(){ return els.clearOnIncorrect.checked }

function generateQuestion(ops){
  const pick = ops[Math.floor(Math.random()*ops.length)];
  let a,b,ans,text;

  if(pick==='add'){
    a = rngInt(0,100); b = rngInt(0,100);
    ans = a+b; text = `${a} + ${b}`;
  }else if(pick==='sub'){
    a = rngInt(0,100); b = rngInt(0,100);
    // allow negative? prototype suggests 0..100; we'll ensure non-negative by swapping
    if(b > a){ const t=a; a=b; b=t; }
    ans = a-b; text = `${a} - ${b}`;
  }else if(pick==='mul'){
    a = rngInt(0,12); b = rngInt(0,12);
    ans = a*b; text = `${a} × ${b}`;
  }else{ // div (from 0..12 times tables)
    const x = rngInt(0,12), y = rngInt(1,12);
    a = x*y; b = y;
    ans = x; text = `${a} ÷ ${b}`;
  }
  return {text, answer: ans};
}

function rngInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

function parseTimeInput(str){
  const m = String(str||'').trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if(!m) return null;
  return Number(m[1])*60 + Number(m[2]);
}
function formatSeconds(s){
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function formatTime(ms, countdown=false){
  // When countdown is true, ms is milliseconds remaining (convert to seconds).
  const total = countdown ? Math.ceil(ms/1000) : Math.floor(ms/1000);
  const mm = Math.floor(total/60);
  const ss = total%60;
  return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}
function esc(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) }

// =========== Leaderboard + highscore updates for top bar ==========
function setHighscoreTopBarMode(){
  let text = '';
  if(currentMode==='100s'){
    const t = store.get(KEYS.hs100s, null);
    text = t ? formatTime(t) : '';
  }else if(currentMode==='ta'){
    const s30 = store.get(KEYS.hsTA30, null);
    const s60 = store.get(KEYS.hsTA60, null);
    text = ''; // kept blank per prototype
  }else{
    text='';
  }
  els.highscoreValue.textContent = text;
}

// Boot
init();
