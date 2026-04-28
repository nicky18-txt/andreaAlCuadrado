const display = document.getElementById("display");

let expression = "";
let audioContext = null;


function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

const noteMap = {
  "7": 392.00,    
  "8": 440.00,   
  "9": 493.88,   
  "÷": 523.25,   
  
  "4": 329.63,   
  "5": 349.23,   
  "6": 392.00,   
  "×": 440.00,   
  
  "1": 261.63,  
  "2": 293.66,   
  "3": 329.63,    
  "-": 349.23,    
  
  "0": 261.63,    
  ".": 293.66,    
  "+": 329.63,    
  
  "=": 587.33,    
  "C": 880.00,    
  "(": 261.63,   
  ")": 293.66     
};

// Función para tocar una nota
function playNote(frequency, duration = 300) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration / 1000);
}

function appendValue(value) {
  if (expression === "Error") {
    expression = "";
  }
  if (noteMap[value]) {
    playNote(noteMap[value], 300);
  }
  
  expression += value;
  updateDisplay();
}

function clearDisplay() {
  playNote(880.00, 200);  
  expression = "";
  updateDisplay();
}

function updateDisplay() {
  display.value = expression || "0";
}

function getOpPrecedence(op) {
  if (op === "+" || op === "-") return 1;
  if (op === "*" || op === "/") return 2;
  return 0;
}

function compute(a, b, op) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b !== 0 ? a / b : null;
  }
  return null;
}

function parseTokens(expr) {
  expr = expr.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");

  let tokens = [];
  let num = "";

  for (let ch of expr) {
    if (!isNaN(ch) || ch === ".") {
      num += ch;
    } else {
      if (num) {
        tokens.push(parseFloat(num));
        num = "";
      }
      if (ch !== " ") {
        tokens.push(ch);
      }
    }
  }
  if (num) tokens.push(parseFloat(num));

  let result = [];
  for (let i = 0; i < tokens.length; i++) {
    result.push(tokens[i]);
    if (i < tokens.length - 1) {
      let current = tokens[i];
      let next = tokens[i + 1];
      if (typeof current === "number" && next === "(") {
        result.push("*");
      } else if (current === ")" && typeof next === "number") {
        result.push("*");
      } else if (current === ")" && next === "(") {
        result.push("*");
      }
    }
  }

  return result;
}

function calculate() {
  try {
    let tokens = parseTokens(expression);
    if (!tokens.length) return;

    let values = [];
    let ops = [];

    for (let token of tokens) {
      if (typeof token === "number") {
        values.push(token);
      } else if (token === "(") {
        ops.push(token);
      } else if (token === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") {
          let op = ops.pop();
          let b = values.pop();
          let a = values.pop();
          let result = compute(a, b, op);
          if (result === null) throw new Error("Division by zero");
          values.push(result);
        }
        ops.pop();
      } else {
        while (
          ops.length &&
          ops[ops.length - 1] !== "(" &&
          getOpPrecedence(ops[ops.length - 1]) >= getOpPrecedence(token)
        ) {
          let op = ops.pop();
          let b = values.pop();
          let a = values.pop();
          let result = compute(a, b, op);
          if (result === null) throw new Error("Division by zero");
          values.push(result);
        }
        ops.push(token);
      }
    }

    while (ops.length) {
      let op = ops.pop();
      let b = values.pop();
      let a = values.pop();
      let result = compute(a, b, op);
      if (result === null) throw new Error("Division by zero");
      values.push(result);
    }

    expression = values[0].toString();
    updateDisplay();
    playNote(261.63, 200);
    setTimeout(() => playNote(329.63, 200), 200);
    setTimeout(() => playNote(392.00, 200), 400);
  } catch (e) {
    expression = "Error";
    updateDisplay();
    playNote(392.00, 150);
    setTimeout(() => playNote(329.63, 150), 150);
    setTimeout(() => playNote(261.63, 150), 300);
  }
}

let lofiPlaying = false;
let audioPlayer = null;

function initAudioPlayer() {
  if (!audioPlayer) {
    audioPlayer = new Audio('focus.mp3');
    audioPlayer.loop = true;
    audioPlayer.volume = 0.3;
  }
  return audioPlayer;
}

function playBackgroundMusic() {
  const player = initAudioPlayer();
  
  if (lofiPlaying) {
    player.pause();
    lofiPlaying = false;
  } else {
    player.play();
    lofiPlaying = true;
  }
}

function stopLofi() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
  lofiPlaying = false;
}
