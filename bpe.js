// Programming from A to Z
// https://github.com/Programming-from-A-to-Z/A2Z-F26
//
// Byte Pair Encoding (BPE) tokenizer
// Start with single characters, then merge the most common pair of tokens, over and over

class BPE {
  constructor() {
    // Every token the tokenizer knows, a token's id is its index in this array
    this.vocab = [];
    // Every merge, in order: ['t', 'h'] means t + h becomes th
    this.merges = [];
    // Every different word in the text, split into tokens, and how many times it appears
    this.words = [];
  }

  // Split text into words, keeping everything (capital letters, punctuation, spaces, new lines)
  // A word keeps the space in front of it, and anything that isn't a letter is on its own:
  // 'To be, or not' becomes ['To', ' be', ',', ' or', ' not']
  splitWords(text) {
    return text.match(/ ?[A-Za-z]+|[^A-Za-z]/g);
  }

  // Learn merges from a text until there are vocabSize tokens
  train(text, vocabSize) {
    this.start(text);
    while (this.vocab.length < vocabSize) {
      this.learnMerge();
    }
  }

  // Get ready to learn: count the words, and start with single characters
  start(text) {
    // Count every word, so each different word only has to be looked at once
    let counts = {};
    for (let word of this.splitWords(text)) {
      if (counts[word] === undefined) {
        counts[word] = 0;
      }
      counts[word]++;
    }

    // Every word starts out as single characters: ' the' is [' ', 't', 'h', 'e']
    for (let word in counts) {
      this.words.push({ tokens: word.split(''), count: counts[word] });
    }

    console.log(this.words);

    // The starting vocabulary is every character in the text (just like TinyGPT!)
    this.vocab = Array.from(new Set(text));
    this.vocab.sort();
  }

  // Learn one new token
  learnMerge() {
    // Find the two tokens that appear next to each other most often
    let pair = this.mostCommonPair();
    // Together they become a new token!
    this.merges.push(pair);
    this.vocab.push(pair[0] + pair[1]);
    // Merge that pair everywhere it appears
    for (let word of this.words) {
      word.tokens = this.merge(word.tokens, pair);
    }
  }

  // Count every pair of tokens that sit next to each other
  countPairs() {
    let counts = {};
    for (let word of this.words) {
      for (let i = 0; i < word.tokens.length - 1; i++) {
        // The pair 't' then 'h' gets the key 't,h'
        // (Only letters and spaces get merged, so a comma is never part of a pair)
        let key = word.tokens[i] + ',' + word.tokens[i + 1];
        if (counts[key] === undefined) {
          counts[key] = 0;
        }
        // A word that appears 100 times counts its pairs 100 times
        counts[key] += word.count;
      }
    }
    return counts;
  }

  // The pair that appears most often: ['t', 'h']
  mostCommonPair() {
    let counts = this.countPairs();
    let best = '';
    let bestCount = 0;
    for (let key in counts) {
      if (counts[key] > bestCount) {
        best = key;
        bestCount = counts[key];
      }
    }
    return best.split(',');
  }

  // Replace a pair with one token: merge([' ', 't', 'h', 'e'], ['t', 'h']) is [' ', 'th', 'e']
  merge(tokens, pair) {
    let merged = [];
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === pair[0] && tokens[i + 1] === pair[1]) {
        merged.push(pair[0] + pair[1]);
        i += 2;
      } else {
        merged.push(tokens[i]);
        i += 1;
      }
    }
    return merged;
  }

  // Split one word into tokens by repeating every merge, in the order they were learned
  // (This happens again every time a word shows up. To make it faster, you could remember
  // how each word was split the first time and look it up after that: a "cache.")
  tokenizeWord(word) {
    let tokens = word.split('');
    for (let pair of this.merges) {
      tokens = this.merge(tokens, pair);
    }
    return tokens;
  }

  // Text into tokens: 'The sea!' becomes ['The', ' sea', '!']
  tokenize(text) {
    let tokens = [];
    for (let word of this.splitWords(text)) {
      for (let token of this.tokenizeWord(word)) {
        tokens.push(token);
      }
    }
    return tokens;
  }

  // Text into token ids: a token's id is its index in the vocab array
  encode(text) {
    let ids = [];
    for (let token of this.tokenize(text)) {
      ids.push(this.vocab.indexOf(token));
    }
    return ids;
  }

  // Token ids back into text
  decode(ids) {
    let text = '';
    for (let id of ids) {
      text += this.vocab[id];
    }
    return text;
  }
}
