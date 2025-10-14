// script.js
// Lädt config.json und initialisiert die App.
// Platziere script.js und config.json im gleichen Ordner wie index.html.

let configData = null;

// App State
const state = {
  isLoggedIn: false,
  userName: '',
  userCoins: 0,
  currentTab: 'mathe',
  currentQuestion: null,
  feedback: null,
  loginInput: '',
  game: {
    active: false,
    score: 0,
    playerY: 0,
    playerVY: 0,
    gravity: 0.8,
    jumpStrength: 14,
    obstacles: [],
    lastSpawn: 0,
    lastFrameTime: 0,
    gameOver: false
  }
};

const app = document.getElementById('app');

// Utility
function randBetween(a,b){ return Math.random()*(b-a)+a; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function nowMs(){ return performance.now(); }

function loadConfig(){
  return fetch('config.json').then(r => r.json());
}

function initApp(){
  // merge defaults if missing
  if (!configData.games) configData.games = { jumpAndRun: { cost:10, rewardFactor:100, obstacleSpeed:4, spawnRate:0.03 } };
  render();
}

// Get random question
function getRandomQuestion(subject){
  const set = configData.questions && configData.questions[subject];
  if (!set || set.length === 0) return null;
  return JSON.parse(JSON.stringify(set[Math.floor(Math.random()*set.length)])); // clone
}

function findUserByName(name){
  return (configData.users||[]).find(u => u.name.toLowerCase() === name.toLowerCase());
}

// --- Game logic (verbessert) ---
const gameConfig = () => configData.games && configData.games.jumpAndRun ? configData.games.jumpAndRun : { cost:10, rewardFactor:100, obstacleSpeed:4, spawnRate:0.03 };

function startGame(){
  const cfg = gameConfig();
  if (state.userCoins < cfg.cost) return;
  state.userCoins -= cfg.cost;
  state.game.active = true;
  state.game.score = 0;
  state.game.playerY = 0;
  state.game.playerVY = 0;
  state.game.obstacles = [];
  state.game.lastSpawn = nowMs();
  state.game.gameOver = false;
  state.game.lastFrameTime = nowMs();
  requestAnimationFrame(gameLoop);
  render();
}

function endGame(){
  state.game.active = false;
  state.game.gameOver = true;
  const coinsEarned = Math.floor(state.game.score / gameConfig().rewardFactor);
  state.userCoins += coinsEarned;
  render();
}

// Player jump (physics)
function playerJump(){
  if (!state.game.active || state.game.gameOver) return;
  // allow multi-frame check: only jump if near ground
  if (state.game.playerY <= 0.5) {
    state.game.playerVY = -gameConfig().jumpStrength; // negative because we handle coordinate system: lower y = ground
  }
}

// collision detection (AABB)
function checkCollision(playerRect, obsRect){
  return !(playerRect.x + playerRect.w < obsRect.x ||
           playerRect.x > obsRect.x + obsRect.w ||
           playerRect.y + playerRect.h < obsRect.y ||
           playerRect.y > obsRect.y + obsRect.h);
}

function gameLoop(timestamp){
  if (!state.game.active) return;
  const dt = Math.min(40, timestamp - state.game.lastFrameTime); // ms cap
  state.game.lastFrameTime = timestamp;

  // physics integration (simple)
  // We treat bottom (ground) as y = 0, playerY as height above ground
  state.game.playerVY += state.game.gravity * (dt/16); // scale gravity a bit by dt
  state.game.playerY += state.game.playerVY * (dt/16);
  if (state.game.playerY > 0) { // below ground -> clamp
    state.game.playerY = 0;
    state.game.playerVY = 0;
  }
  // spawn obstacles at time-based intervals using spawnRate
  const cfg = gameConfig();
  if (Math.random() < cfg.spawnRate * (dt/16)) { // frame-rate independent spawn chance
    // create obstacle at right edge
    state.game.obstacles.push({
      x: 380, // start X (game area width ~400)
      w: Math.round(randBetween(24,36)),
      h: Math.round(randBetween(30,52)),
      y: 0 // bottom aligned
    });
  }

  // update obstacles
  const speed = cfg.obstacleSpeed * (dt/16);
  for (let obs of state.game.obstacles) obs.x -= speed;
  // remove off-screen obstacles
  state.game.obstacles = state.game.obstacles.filter(o => o.x + o.w > -20);

  // update score
  state.game.score += Math.round(dt/16); // score increments per frame roughly scaled

  // check collisions
  // define player rect relative to gameArea coordinates: left ~50, bottom offset 20 + playerY
  const player = {
    x: 50,
    w: 40,
    h: 40,
    y: 20 + state.game.playerY // bottom position in px above bottom; we'll convert for AABB using top-based system
  };
  // Convert to top-based coordinates within area height (300px)
  const areaH = 300;
  const playerRect = {
    x: player.x,
    w: player.w,
    h: player.h,
    y: areaH - (player.y + player.h) // top Y
  };

  for (let obs of state.game.obstacles) {
    const obsRect = {
      x: obs.x,
      w: obs.w,
      h: obs.h,
      y: areaH - (obs.y + obs.h) // top Y
    };
    if (checkCollision(playerRect, obsRect)) {
      // collision occurred
      state.game.gameOver = true;
      state.game.active = false;
      endGame();
      return;
    }
  }

  // render and continue
  render();
  if (state.game.active && !state.game.gameOver) requestAnimationFrame(gameLoop);
}

// --- App Actions ---
function handleLogin(){
  const input = state.loginInput.trim();
  if (!input) return;
  const existing = findUserByName(input);
  if (existing) {
    state.userName = existing.name;
    state.userCoins = existing.coins;
  } else {
    state.userName = input;
    state.userCoins = 0;
    // optionally add to configData.users in-memory
    configData.users.push({ name: state.userName, coins: 0 });
  }
  state.isLoggedIn = true;
  state.currentQuestion = getRandomQuestion('mathe');
  render();
}

function handleAnswer(index){
  if (!state.currentQuestion || state.feedback) return;
  const isCorrect = index === state.currentQuestion.correct;
  if (isCorrect) {
    state.userCoins += 1;
    state.feedback = 'correct';
  } else {
    state.feedback = 'wrong';
  }
  render();
  setTimeout(() => {
    state.feedback = null;
    if (['mathe','deutsch','englisch'].includes(state.currentTab)) state.currentQuestion = getRandomQuestion(state.currentTab);
    render();
  }, 1200);
}

function handleTabChange(tab){
  state.currentTab = tab;
  state.feedback = null;
  if (['mathe','deutsch','englisch'].includes(tab)) state.currentQuestion = getRandomQuestion(tab);
  else state.currentQuestion = null;
  render();
}

// --- Render ---
// Many functions re-use same markup as before but now use configData and the new game state.

function renderLogin(){
  return `
    <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-block p-4 bg-blue-500 rounded-full mb-4 text-white text-4xl">📚</div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Willkommen!</h1>
          <p class="text-gray-600">Gib deinen Namen ein, um zu starten</p>
        </div>
        <input id="loginInput" type="text" value="${escapeHtml(state.loginInput)}" placeholder="Dein Name" class="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl mb-4 focus:outline-none focus:border-blue-500 transition-colors" />
        <button id="loginBtn" class="w-full bg-blue-500 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg">Los geht's!</button>
      </div>
    </div>
  `;
}

function renderHeader(){
  const title = state.currentTab === 'spiele' ? 'Spiele' : state.currentTab === 'profil' ? 'Profil' : state.currentTab === 'mathe' ? 'Mathe' : state.currentTab === 'deutsch' ? 'Deutsch' : 'Englisch';
  return `
    <div class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800 capitalize">${title}</h2>
      <div class="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
        <span class="text-2xl mr-2">🪙</span>
        <span class="font-bold text-lg text-yellow-700" id="coinCount">${state.userCoins}</span>
      </div>
    </div>
  `;
}

function renderProfile(){
  return `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-3xl shadow-lg p-8 text-center">
        <div class="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">👤</div>
        <h3 class="text-3xl font-bold text-gray-800 mb-2">${escapeHtml(state.userName)}</h3>
        <div class="flex items-center justify-center gap-3 mt-6 bg-yellow-50 py-4 px-6 rounded-2xl">
          <span class="text-4xl">🪙</span>
          <span class="text-3xl font-bold text-yellow-700">${state.userCoins} Münzen</span>
        </div>
      </div>
    </div>
  `;
}

function renderGameIntro(){
  const cfg = gameConfig();
  return `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-3xl shadow-lg p-8 text-center">
        <div class="text-purple-500 text-6xl mb-4">🎮</div>
        <h3 class="text-2xl font-bold text-gray-800 mb-4">Jump & Run</h3>
        <p class="text-gray-600 mb-6">Springe über Hindernisse und sammle Punkte!</p>
        <div class="bg-purple-50 rounded-2xl p-6 mb-6">
          <p class="text-lg text-purple-700 font-semibold mb-2">Kosten: ${cfg.cost} Münzen</p>
          <p class="text-sm text-purple-600">Belohnung: 1 Münze pro ${cfg.rewardFactor} Punkte</p>
        </div>
        <button id="startGameBtn" class="w-full py-4 rounded-2xl text-lg font-semibold transition-colors ${state.userCoins>=cfg.cost? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}">${state.userCoins>=cfg.cost? 'Spiel starten!' : 'Nicht genug Münzen'}</button>
      </div>
    </div>
  `;
}

function renderGameActive(){
  // obstacles markup
  const obsHtml = state.game.obstacles.map((o,i) => `
    <div class="absolute bg-red-600 rounded" style="width:${o.w}px;height:${o.h}px;left:${o.x}px;bottom:${o.y + 20}px">🌵</div>
  `).join('');

  return `
    <div class="bg-white rounded-3xl shadow-lg p-8">
      <div class="mb-4 flex justify-between items-center">
        <div class="text-2xl font-bold text-gray-800">Score: ${state.game.score}</div>
        <button id="endGameBtn" class="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">Beenden</button>
      </div>
      <div id="gameArea" class="relative bg-gradient-to-b from-blue-200 to-green-200 rounded-2xl overflow-hidden cursor-pointer" style="height:300px;touch-action:none;">
        <div id="player" class="absolute bg-blue-600 rounded-lg transition-all" style="width:40px;height:40px;left:50px;bottom:${state.game.playerY + 20}px">🏃</div>
        <div class="absolute bottom-0 left-0 right-0 h-5 bg-green-600"></div>
        ${obsHtml}
        <div class="absolute top-4 left-4 bg-white bg-opacity-80 px-4 py-2 rounded-xl"><p class="text-sm font-semibold text-gray-700">Tippe zum Springen!</p></div>
      </div>
    </div>
  `;
}

function renderGameOver(){
  const earned = Math.floor(state.game.score / gameConfig().rewardFactor);
  return `
    <div class="bg-white rounded-3xl shadow-lg p-8 text-center">
      <div class="text-6xl mb-4">💥</div>
      <h3 class="text-3xl font-bold text-gray-800 mb-4">Game Over!</h3>
      <div class="bg-purple-50 rounded-2xl p-6 mb-6">
        <p class="text-2xl font-bold text-purple-700 mb-2">${state.game.score} Punkte</p>
        <p class="text-lg text-purple-600">+${earned} Münzen verdient! 🪙</p>
      </div>
      <button id="tryAgainBtn" class="w-full py-4 rounded-2xl text-lg font-semibold transition-colors ${state.userCoins>=gameConfig().cost? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}">${state.userCoins>=gameConfig().cost? 'Nochmal spielen!' : 'Nicht genug Münzen'}</button>
    </div>
  `;
}

function renderQuestionCard(){
  if (!state.currentQuestion) return '';
  const answersHtml = state.currentQuestion.answers.map((a,i) => {
    const base = 'w-full p-6 text-xl font-medium rounded-2xl transition-all transform active:scale-95 answerBtn';
    let classes = 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-2 border-blue-200';
    if (state.feedback === 'correct' && i === state.currentQuestion.correct) classes = 'bg-green-500 text-white shadow-lg';
    else if (state.feedback === 'wrong' && i === state.currentQuestion.correct) classes = 'bg-green-500 text-white shadow-lg';
    else if (state.feedback === 'wrong') classes = 'bg-red-100 text-red-700 border-2 border-red-300';
    return `<button data-ans="${i}" class="${base} ${classes}" ${state.feedback? 'disabled': ''}>${escapeHtml(a)}</button>`;
  }).join('');

  return `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-3xl shadow-lg p-8 mb-6">
        <p class="text-2xl font-semibold text-gray-800 text-center mb-8">${escapeHtml(state.currentQuestion.question)}</p>
        <div class="space-y-4">${answersHtml}</div>
        ${state.feedback === 'correct' ? `<div class="mt-6 text-center"><p class="text-2xl font-bold text-green-600">Richtig! 🎉</p><p class="text-lg text-green-600 mt-2">+1 Münze</p></div>` : ''}
        ${state.feedback === 'wrong' ? `<div class="mt-6 text-center"><p class="text-2xl font-bold text-red-600">Leider falsch 😔</p><p class="text-lg text-gray-600 mt-2">Versuch's nochmal!</p></div>` : ''}
      </div>
    </div>
  `;
}

function renderBottomNav(){
  const c = state.currentTab;
  function cls(tab,color){ return `flex flex-col items-center p-3 rounded-xl transition-colors ${c===tab? color : 'text-gray-500'}`; }
  return `
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div class="flex justify-around items-center py-2 max-w-2xl mx-auto">
        <button data-tab="spiele" class="${cls('spiele','text-purple-600')}"><div class="text-2xl">🎮</div><span class="text-xs font-medium">Spiele</span></button>
        <button data-tab="mathe" class="${cls('mathe','text-blue-600')}"><div class="text-2xl">🔢</div><span class="text-xs font-medium">Mathe</span></button>
        <button data-tab="deutsch" class="${cls('deutsch','text-red-600')}"><div class="text-2xl">📘</div><span class="text-xs font-medium">Deutsch</span></button>
        <button data-tab="englisch" class="${cls('englisch','text-green-600')}"><div class="text-2xl">🌐</div><span class="text-xs font-medium">Englisch</span></button>
        <button data-tab="profil" class="${cls('profil','text-indigo-600')}"><div class="text-2xl">👤</div><span class="text-xs font-medium">Profil</span></button>
      </div>
    </div>
  `;
}

function render(){
  if (!configData) return;
  if (!state.isLoggedIn) {
    app.innerHTML = renderLogin();
    // attach handlers
    const input = document.getElementById('loginInput');
    input && input.addEventListener('input', (e)=> { state.loginInput = e.target.value; });
    input && input.addEventListener('keypress', (e)=> { if (e.key === 'Enter') handleLogin(); });
    const loginBtn = document.getElementById('loginBtn');
    loginBtn && loginBtn.addEventListener('click', handleLogin);
    return;
  }

  // main view
  app.innerHTML = `
    ${renderHeader()}
    <div class="flex-1 overflow-y-auto p-6 pb-24">
      ${state.currentTab === 'profil' ? renderProfile() : ''}
      ${state.currentTab === 'spiele' ? (state.game.active ? renderGameActive() : state.game.gameOver ? renderGameOver() : renderGameIntro()) : ''}
      ${(['mathe','deutsch','englisch'].includes(state.currentTab) && state.currentQuestion) ? renderQuestionCard() : ''}
    </div>
    ${renderBottomNav()}
  `;

  // attach handlers
  const coinEl = document.getElementById('coinCount'); if (coinEl) coinEl.textContent = state.userCoins;

  // game area handlers
  const ga = document.getElementById('gameArea');
  if (ga) {
    ga.onclick = (e) => { playerJump(); };
    // touch friendly: also on touchstart
    ga.addEventListener('touchstart', (e)=> { e.preventDefault(); playerJump(); }, {passive:false});
  }
  const startBtn = document.getElementById('startGameBtn'); if (startBtn) startBtn.addEventListener('click', startGame);
  const endBtn = document.getElementById('endGameBtn'); if (endBtn) endBtn.addEventListener('click', () => { endGame(); render(); });
  const tryBtn = document.getElementById('tryAgainBtn'); if (tryBtn) tryBtn.addEventListener('click', () => { if (state.userCoins >= gameConfig().cost) startGame(); render(); });

  // answers
  document.querySelectorAll('.answerBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.getAttribute('data-ans'));
      handleAnswer(idx);
    });
  });

  // bottom nav
  document.querySelectorAll('[data-tab]').forEach(bt => bt.addEventListener('click', (e)=> { handleTabChange(e.currentTarget.getAttribute('data-tab')); }));

  // update player element position smoothly
  const playerEl = document.getElementById('player');
  if (playerEl) {
    playerEl.style.bottom = (state.game.playerY + 20) + 'px';
  }
}

// Safe HTML escape helper
function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Init: load config and start
loadConfig().then(cfg => {
  configData = cfg;
  // ensure arrays exist
  configData.users = configData.users || [];
  configData.questions = configData.questions || {};
  initApp();
}).catch(err => {
  console.error('Fehler beim Laden der config.json:', err);
  alert('Konnte config.json nicht laden. Stelle sicher, dass die Datei im selben Ordner liegt wie index.html.');
});

