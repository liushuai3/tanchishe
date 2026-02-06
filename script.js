const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayDesc = document.getElementById("overlay-desc");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart");
const pauseButton = document.getElementById("pause");
const speedSelect = document.getElementById("speed-select");

const gridSize = 20;
const gridCount = canvas.width / gridSize;
let animationId = null;
let lastFrameTime = 0;
let stepInterval = Number(speedSelect.value);

const state = {
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: { x: 0, y: 0 },
  running: false,
  paused: false,
  score: 0,
  bestScore: Number(localStorage.getItem("snake-best") || 0),
};

const controls = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

const randomCell = () => Math.floor(Math.random() * gridCount);

const placeFood = () => {
  let position;
  do {
    position = { x: randomCell(), y: randomCell() };
  } while (state.snake.some((segment) => segment.x === position.x && segment.y === position.y));
  state.food = position;
};

const resetGame = () => {
  state.snake = [
    { x: Math.floor(gridCount / 2), y: Math.floor(gridCount / 2) },
    { x: Math.floor(gridCount / 2) - 1, y: Math.floor(gridCount / 2) },
    { x: Math.floor(gridCount / 2) - 2, y: Math.floor(gridCount / 2) },
  ];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.score = 0;
  scoreEl.textContent = "0";
  placeFood();
  draw();
};

const updateBestScore = () => {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem("snake-best", String(state.bestScore));
    bestScoreEl.textContent = String(state.bestScore);
  }
};

const drawCell = (x, y, color, border = "#0f1423") => {
  const padding = 2;
  const size = gridSize - padding * 2;
  context.fillStyle = color;
  context.strokeStyle = border;
  context.lineWidth = 2;
  context.fillRect(x * gridSize + padding, y * gridSize + padding, size, size);
  context.strokeRect(x * gridSize + padding, y * gridSize + padding, size, size);
};

const draw = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#0f1423";
  context.fillRect(0, 0, canvas.width, canvas.height);

  state.snake.forEach((segment, index) => {
    const color = index === 0 ? "#48d597" : "#2ebf8b";
    drawCell(segment.x, segment.y, color, "#1d3b2f");
  });

  drawCell(state.food.x, state.food.y, "#ff6b6b", "#4b1d1d");
};

const showOverlay = (title, description) => {
  overlayTitle.textContent = title;
  overlayDesc.textContent = description;
  overlay.classList.remove("hidden");
};

const hideOverlay = () => {
  overlay.classList.add("hidden");
};

const gameOver = () => {
  state.running = false;
  updateBestScore();
  showOverlay("游戏结束", "点击开始或重新开始再次挑战。");
};

const step = () => {
  state.direction = state.nextDirection;
  const head = state.snake[0];
  const nextHead = { x: head.x + state.direction.x, y: head.y + state.direction.y };

  if (nextHead.x < 0 || nextHead.x >= gridCount || nextHead.y < 0 || nextHead.y >= gridCount) {
    gameOver();
    return;
  }

  if (state.snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
    gameOver();
    return;
  }

  state.snake.unshift(nextHead);

  if (nextHead.x === state.food.x && nextHead.y === state.food.y) {
    state.score += 10;
    scoreEl.textContent = String(state.score);
    placeFood();
  } else {
    state.snake.pop();
  }

  draw();
};

const tick = (timestamp) => {
  if (!state.running) {
    return;
  }

  if (state.paused) {
    animationId = requestAnimationFrame(tick);
    return;
  }

  if (timestamp - lastFrameTime >= stepInterval) {
    lastFrameTime = timestamp;
    step();
  }

  animationId = requestAnimationFrame(tick);
};

const startGame = () => {
  if (state.running) {
    return;
  }
  hideOverlay();
  state.running = true;
  state.paused = false;
  pauseButton.textContent = "暂停";
  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(tick);
};

const togglePause = () => {
  if (!state.running) {
    return;
  }
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "继续" : "暂停";
};

const setDirection = (direction) => {
  if (!direction || state.paused) {
    return;
  }
  if (state.direction.x + direction.x === 0 && state.direction.y + direction.y === 0) {
    return;
  }
  state.nextDirection = direction;
};

const handleKey = (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  setDirection(controls[event.code]);
};

const handleRestart = () => {
  state.running = false;
  state.paused = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  resetGame();
  showOverlay("准备开始", "点击开始或按方向键移动。");
};

const handleSpeedChange = (event) => {
  stepInterval = Number(event.target.value);
};

bestScoreEl.textContent = String(state.bestScore);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", () => {
  handleRestart();
  startGame();
});
pauseButton.addEventListener("click", togglePause);
speedSelect.addEventListener("change", handleSpeedChange);

window.addEventListener("keydown", handleKey);
window.addEventListener("blur", () => {
  if (state.running && !state.paused) {
    togglePause();
  }
});

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    startGame();
  }
});

resetGame();
showOverlay("点击开始", "躲避边界与自己，吃到食物即可增长。");
