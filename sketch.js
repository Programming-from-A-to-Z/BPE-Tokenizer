// Programming from A to Z
// https://github.com/Programming-from-A-to-Z/A2Z-F26
//
// Byte Pair Encoding (BPE)

let filename = 'data/shakespeare.txt'; // try 'data/dickinson.txt' or your own .txt file!
let vocabSize = 10000; // how many tokens to learn before stopping

let corpus; // the text the tokenizer learns from
let tokenizer; // the BPE tokenizer
let input; // user phrase to see how it's split into tokens
let slider; // control speed

async function setup() {
  createCanvas(800, 580);
  textFont('monospace');

  // Speed: how many merges per second, from 1 to 60
  createSpan('speed').position(560, 22);
  slider = createSlider(1, 60, 10).position(610, 20);
  input = createInput('To be, or not to be, that is the question.').position(20, 425).size(600);

  // Load the text
  let raw = await fetch(filename);
  corpus = await raw.text();
  // Start the tokenizer with the text
  tokenizer = new BPE();
  tokenizer.start(corpus);
}

function draw() {
  background(255);

  // The slider sets how many times per second draw() runs
  frameRate(slider.value());

  // Learn one new token every frame
  if (tokenizer.vocab.length < vocabSize) {
    tokenizer.learnMerge();
  }

  drawCounts(20, 30);
  drawPairs(20, 110);
  drawMerges(420, 110);

  // Show tokens
  if (input.value().length > 0) {
    let tokens = tokenizer.tokenize(input.value());
    noStroke();
    fill(0);
    textSize(14);
    textAlign(LEFT, TOP);
    text(`${input.value().length} characters → ${tokens.length} tokens`, 20, 400);
    drawTokens(tokens, 20, 465);
  }
}

// How big is the vocabulary, and how many tokens does it take to write the whole text?
function drawCounts(x, y) {
  // Calculate how many tokens in the training dataset
  let total = 0;
  for (let word of tokenizer.words) {
    // Each word appears word.count times in the text
    total += word.tokens.length * word.count;
  }

  // The number of characters in the vocabulary is the number of tokens minus the number of merges
  let characters = tokenizer.vocab.length - tokenizer.merges.length;

  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`${tokenizer.vocab.length} tokens: ${characters} characters + ${tokenizer.merges.length} merges`, x, y);
  text(
    `the whole text: ${total.toLocaleString()} tokens (${nf(corpus.length / total, 1, 2)} characters per token)`,
    x,
    y + 25,
  );
}

// The pairs of tokens that sit next to each other most often.
// The first one is the next merge!
function drawPairs(x, y) {
  let counts = tokenizer.countPairs();
  let pairs = Object.keys(counts);
  // Sort the pairs by frequency, most common first
  pairs.sort((a, b) => counts[b] - counts[a]);

  textSize(14);
  fill(0);
  text('most common pairs:', x, y);
  for (let i = 0; i < 12; i++) {
    let pair = pairs[i].split(',');
    fill(0);
    text(`${showSpace(pair[0])} + ${showSpace(pair[1])}`, x, y + 30 + i * 20);
    fill(150);
    text(counts[pairs[i]], x + 250, y + 30 + i * 20);
  }
}

// The newest tokens, newest first
function drawMerges(x, y) {
  textSize(14);
  fill(0);
  text('merges:', x, y);
  let n = tokenizer.merges.length;
  for (let i = 0; i < 12 && i < n; i++) {
    let pair = tokenizer.merges[n - 1 - i];
    text(`${showSpace(pair[0])} + ${showSpace(pair[1])} = ${showSpace(pair[0] + pair[1])}`, x, y + 30 + i * 20);
  }
}

// Show a space as _ so you can see it
function showSpace(token) {
  return token.replace(' ', '_');
}

// Draw tokens as boxes, with each token's id underneath
function drawTokens(tokens, x, y) {
  let tx = x;
  let ty = y;
  for (let i = 0; i < tokens.length; i++) {
    let label = showSpace(tokens[i]);
    textSize(14);
    let w = textWidth(label) + 10;
    // Wrap to the next row
    if (tx + w > width - 20) {
      tx = x;
      ty += 45;
    }
    // Alternate colors so you can see where each token starts and ends
    noStroke();
    if (i % 2 === 0) {
      fill(200, 230, 255);
    } else {
      fill(255, 220, 200);
    }
    rect(tx, ty, w, 22, 4);
    fill(0);
    textAlign(CENTER, CENTER);
    text(label, tx + w / 2, ty + 11);
    // The token's id is its index in the vocabulary (-1 means it's not in the vocabulary!)
    fill(150);
    textSize(10);
    text(tokenizer.vocab.indexOf(tokens[i]), tx + w / 2, ty + 32);
    tx += w + 3;
  }
}
