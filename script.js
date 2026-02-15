// Board and rendering constants
const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const PREVIEW_BLOCK = 24;

// Tetromino color palette
const COLORS = {
  I: '#44d9e6',
  O: '#f1d14d',
  T: '#b26cff',
  S: '#59d98e',
  Z: '#ff6d7d',
  J: '#6395ff',
  L: '#ffac5e'
};

// Standard tetromino matrices (spawn orientation)
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const SCORE_TABLE = [0, 100, 300, 500, 800];

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');

let board = [];
let currentPiece;
let nextPiece;
let score = 0;
let level = 1;
let totalLines = 0;
let dropInterval = 800;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneMatrix(matrix) {
  return matrix.map(row => [...row]);
}

function randomType() {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
}

function createPiece(type = randomType()) {
  const shape = cloneMatrix(SHAPES[type]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0
  };
}

function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = matrix[y][x];
    }
  }

  return rotated;
}

// Collision system: walls, floor, and existing locked blocks
function collides(piece, offsetX = 0, offsetY = 0, matrix = piece.shape) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (!matrix[y][x]) {
        continue;
      }

      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;

      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
        return true;
      }

      if (boardY >= 0 && board[boardY][boardX]) {
        return true;
      }
    }
  }

  return false;
}

function mergePiece(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && piece.y + y >= 0) {
        board[piece.y + y][piece.x + x] = piece.type;
      }
    });
  });
}

// Clear filled rows, then update score/level progression
function clearLines() {
  let linesCleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== null)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      linesCleared++;
      y++;
    }
  }

  if (linesCleared > 0) {
    totalLines += linesCleared;
    score += SCORE_TABLE[linesCleared] * level;
    const newLevel = Math.floor(totalLines / 10) + 1;

    if (newLevel > level) {
      level = newLevel;
      dropInterval = Math.max(120, 800 - (level - 1) * 65);
    }

    updateHud();
  }
}

function spawnNextPiece() {
  currentPiece = nextPiece || createPiece();
  currentPiece.x = Math.floor(COLS / 2) - Math.ceil(currentPiece.shape[0].length / 2);
  currentPiece.y = 0;
  nextPiece = createPiece();
  drawNextPiece();

  if (collides(currentPiece)) {
    endGame();
  }
}

function hardDrop() {
  if (gameOver) {
    return;
  }

  while (!collides(currentPiece, 0, 1)) {
    currentPiece.y++;
    score += 2;
  }

  lockPiece();
  updateHud();
}

function movePiece(dir) {
  if (!gameOver && !collides(currentPiece, dir, 0)) {
    currentPiece.x += dir;
  }
}

function softDrop() {
  if (gameOver) {
    return;
  }

  if (!collides(currentPiece, 0, 1)) {
    currentPiece.y++;
    score += 1;
    updateHud();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  mergePiece(currentPiece);
  clearLines();
  spawnNextPiece();
}

// Rotate clockwise with small wall-kick offsets for near-wall rotations
function rotatePiece() {
  if (gameOver) {
    return;
  }

  const rotated = rotateMatrix(currentPiece.shape);
  const wallKickOffsets = [0, -1, 1, -2, 2];

  for (const offset of wallKickOffsets) {
    if (!collides(currentPiece, offset, 0, rotated)) {
      currentPiece.shape = rotated;
      currentPiece.x += offset;
      return;
    }
  }
}

function drawCell(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x * size, y * size, size, size);
  context.strokeStyle = 'rgba(9, 10, 16, 0.45)';
  context.lineWidth = 2;
  context.strokeRect(x * size, y * size, size, size);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawCell(ctx, x, y, BLOCK, COLORS[cell]);
      }
    });
  });

  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const drawY = currentPiece.y + y;
        if (drawY >= 0) {
          drawCell(ctx, currentPiece.x + x, drawY, BLOCK, COLORS[currentPiece.type]);
        }
      }
    });
  });
}

function drawNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const matrix = nextPiece.shape;
  const offsetX = Math.floor((nextCanvas.width / PREVIEW_BLOCK - matrix[0].length) / 2);
  const offsetY = Math.floor((nextCanvas.height / PREVIEW_BLOCK - matrix.length) / 2);

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawCell(nextCtx, offsetX + x, offsetY + y, PREVIEW_BLOCK, COLORS[nextPiece.type]);
      }
    });
  });
}

function updateHud() {
  scoreEl.textContent = String(score);
  levelEl.textContent = String(level);
  linesEl.textContent = String(totalLines);
}

function endGame() {
  gameOver = true;
  overlayText.textContent = 'Game Over';
  overlay.classList.remove('hidden');
}

// Main loop: apply gravity over time, then render each frame
function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!gameOver) {
    dropCounter += delta;
    if (dropCounter >= dropInterval) {
      if (!collides(currentPiece, 0, 1)) {
        currentPiece.y++;
      } else {
        lockPiece();
      }
      dropCounter = 0;
    }
  }

  drawBoard();
  requestAnimationFrame(update);
}

// Keyboard controls for movement, rotation and drops
function handleKeydown(event) {
  const key = event.key;

  if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(key)) {
    event.preventDefault();
  }

  switch (key) {
    case 'ArrowLeft':
      movePiece(-1);
      break;
    case 'ArrowRight':
      movePiece(1);
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
      rotatePiece();
      break;
    case ' ':
      hardDrop();
      break;
    default:
      break;
  }
}

// Reset full game state and spawn first active piece
function startGame() {
  board = createBoard();
  score = 0;
  level = 1;
  totalLines = 0;
  dropInterval = 800;
  dropCounter = 0;
  lastTime = 0;
  gameOver = false;
  overlay.classList.add('hidden');

  nextPiece = createPiece();
  spawnNextPiece();
  updateHud();
}

window.addEventListener('keydown', handleKeydown);
restartBtn.addEventListener('click', startGame);

startGame();
requestAnimationFrame(update);
