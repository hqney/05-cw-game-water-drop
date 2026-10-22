const startButton = document.getElementById("start-btn");
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById("time");
const feedbackElement = document.getElementById("feedback-message");
const gameContainer = document.getElementById("game-container");
const bucket = document.getElementById("bucket");

const bucketSpeed = 8;
let bucketX = 0;
let animationFrameId = null;
const pressedKeys = {
  ArrowLeft: false,
  ArrowRight: false
};

const winningMessages = [
  "Amazing work! You made a real splash.",
  "Excellent catch! Your compassion is flowing.",
  "You’re a water hero! Keep it up.",
  "Fantastic! Clean water saved in record time."
];

const losingMessages = [
  "Nice try! A few more catches and you’ll win.",
  "That was close keep practicing and try again.",
  "The clean drops are waiting for a better run.",
  "Good effort! Jump back in for another round."
];

let score = 0;
let timeLeft = 40;
let gameRunning = false;
let dropMaker;
let timerInterval;
let catchCheck;

function updateScore() {
  scoreElement.textContent = score;
}

function setFeedback(message, type = "info") {
  feedbackElement.textContent = message;
  feedbackElement.classList.remove("good", "bad", "info");
  feedbackElement.classList.add(type);
}

function clearDrops() {
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
}

function pickRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function positionBucket() {
  const maxX = Math.max(gameContainer.clientWidth - bucket.offsetWidth, 0);
  bucketX = Math.max(0, Math.min(bucketX, maxX));
  bucket.style.left = `${bucketX}px`;
}

function moveBucket(direction) {
  bucketX += direction * bucketSpeed;
  positionBucket();
}

function updateBucketMovement() {
  if (pressedKeys.ArrowLeft) {
    moveBucket(-1);
  }

  if (pressedKeys.ArrowRight) {
    moveBucket(1);
  }

  animationFrameId = requestAnimationFrame(updateBucketMovement);
}

function handleKeydown(event) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    pressedKeys[event.key] = true;

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(updateBucketMovement);
    }
  }
}

function handleKeyup(event) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    pressedKeys[event.key] = false;

    if (!pressedKeys.ArrowLeft && !pressedKeys.ArrowRight && animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
}

function getBucketBounds() {
  const gameRect = gameContainer.getBoundingClientRect();
  const bucketRect = bucket.getBoundingClientRect();

  return {
    left: bucketRect.left - gameRect.left + 18,
    right: bucketRect.right - gameRect.left - 18,
    top: bucketRect.top - gameRect.top + 18,
    bottom: bucketRect.bottom - gameRect.top - 18
  };
}

function isDropInBucket(drop) {
  const bucketBounds = getBucketBounds();
  const dropRect = drop.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();

  const dropLeft = dropRect.left - gameRect.left;
  const dropRight = dropRect.right - gameRect.left;
  const dropTop = dropRect.top - gameRect.top;
  const dropBottom = dropRect.bottom - gameRect.top;

  return dropRight > bucketBounds.left &&
    dropLeft < bucketBounds.right &&
    dropBottom > bucketBounds.top &&
    dropTop < bucketBounds.bottom;
}

function startGame() {
  if (gameRunning) return;

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(updateBucketMovement);
  }

  clearDrops();
  score = 0;
  timeLeft = 30;
  bucketX = (gameContainer.clientWidth - bucket.offsetWidth) / 2;
  positionBucket();
  gameRunning = true;
  updateScore();
  timeElement.textContent = timeLeft;
  startButton.textContent = "Game Running...";
  startButton.disabled = true;

  setFeedback("Catch the clean drops and avoid the dirty water!", "info");
  createDrop();

  dropMaker = setInterval(createDrop, 850);
  catchCheck = setInterval(() => {
    const drops = gameContainer.querySelectorAll(".water-drop");

    drops.forEach((drop) => {
      if (isDropInBucket(drop)) {
        collectDrop(drop);
      }
    });
  }, 50);

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    timeElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  clearInterval(catchCheck);
  gameRunning = false;
  pressedKeys.ArrowLeft = false;
  pressedKeys.ArrowRight = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  clearDrops();

  const finalMessage = score >= 20
    ? pickRandomMessage(winningMessages)
    : pickRandomMessage(losingMessages);

  setFeedback(`Game over! ${finalMessage} Final score: ${score}.`, score >= 20 ? "good" : "bad");
  timeElement.textContent = "0";
  startButton.textContent = "Play Again";
  startButton.disabled = false;
}

function collectDrop(drop) {
  if (!gameRunning || !drop.isConnected) return;

  if (drop.dataset.type === "good") {
    score += 1;
    updateScore();
    setFeedback("Clean water collected! +1", "good");
  } else {
    score = Math.max(0, score - 2);
    updateScore();
    setFeedback("Dirty water! -2 points", "bad");
  }

  drop.remove();
}

function createDrop() {
  if (!gameRunning) return;

  const drop = document.createElement("div");
  const isBad = Math.random() < 0.28;
  const baseSize = 46;
  const size = baseSize * (0.75 + Math.random() * 0.85);

  drop.className = isBad ? "water-drop bad-drop" : "water-drop good-drop";
  drop.dataset.type = isBad ? "bad" : "good";
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;

  const maxX = Math.max(gameContainer.clientWidth - size, 0);
  drop.style.left = `${Math.random() * maxX}px`;
  drop.style.animationDuration = `${(3 + Math.random() * 2.2).toFixed(2)}s`;

  gameContainer.appendChild(drop);

  drop.addEventListener("click", () => collectDrop(drop));

  drop.addEventListener("animationend", () => {
    if (!drop.isConnected) return;

    if (drop.dataset.type === "good") {
      setFeedback("A clean drop missed the bucket!", "bad");
    } else {
      score = Math.max(0, score - 1);
      updateScore();
    }

    drop.remove();
  });
}

bucket.addEventListener("click", () => {
  if (!gameRunning) return;

  const drops = [...gameContainer.querySelectorAll(".water-drop")];
  const catches = drops.filter((drop) => isDropInBucket(drop));

  if (catches.length > 0) {
    collectDrop(catches[0]);
  }
});

window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);
startButton.addEventListener("click", startGame);
