# Byte Pair Encoding

This sketch shows a byte pair encoding (BPE) tokenizer learning its vocabulary, one new token at a time. This is coded with plain JavaScript and the p5.js library (no ML framework).

## The algorithm

1. Split the text into words (including spaces with the word)
2. Count how many times each word appears.
3. Initialize the vocabulary with every unique character in the source text.
4. Count every pair of adjacent tokens inside a word.
5. Merge most common pair into a new token (then redo all the tokens for all the words)
6. Repeat steps 4 and 5 until the vocabulary reaches a target size.

## Code

### 1. Split the text into words

```js
splitWords(text) {
  return text.match(/ ?[A-Za-z]+|[^A-Za-z]/g);
}
```

The regular expression creates an array of tokens by matching any sequences of letters (optionally with a space in front) and any individual non letter characters (punctuation, etc).

For example "First Citizen:\nBefore we proceed any further, hear me speak." becomes:

```js
['First', ' Citizen', ':', '\n', 'Before', ' we', ' proceed', ' any', ' further', ',', ' hear', ' me', ' speak', '.'];
```

"First" and "Before" don't have a space because they start a line.

Merges only happen inside a word, so a token can be `_the` but never `e,` or `_the_king`.

### 2. Count the words

This is the same code as my word counting module!

```js
let counts = {};
for (let word of this.splitWords(text)) {
  if (counts[word] === undefined) {
    counts[word] = 0;
  }
  counts[word]++;
}
```

Shakespeare has 303,578 words, with 15,027 _uinque_ words. (Note that punctuation and new lines count as words!) The most common are `\n` (40,000 times), `,` (19,846), `:` (10,316), `.` (7,885), `'` (6,187), and then `_the` (5,370), `_to` (4,068), and `_and` (3,703).

Each word then gets split into single characters and stores the count alongside them.

```js
{ tokens: [' ', 't', 'h', 'e'], count: 5370 }
```

The algorithm then only ever looks at these 15,027 words and never the whole text again. This makes things much more efficient.

### 3. Start the vocabulary with every character

```js
// Get all the unique characters and put in an array
this.vocab = Array.from(new Set(text));
// Sort alphabetically
this.vocab.sort();
```

### 4. Count the pairs

```js
for (let word of this.words) {
  for (let i = 0; i < word.tokens.length - 1; i++) {
    // The key is two tokens separated by a comma
    let key = word.tokens[i] + ',' + word.tokens[i + 1];
    // New token!
    if (counts[key] === undefined) {
      counts[key] = 0;
    }
    // Increase the count by how many times in appeared in the _original_ source text
    counts[key] += word.count;
  }
}
```

This goes through every word and adds up every pair of tokens that sit next to each other, using a key like `'t,h'`. Then its count is added, not 1! For example, `_the` appears 5,370 times so its three pairs (`_` + `t`, `t` + `h`, `h` + `e`) each add 5,370 counts.

At the start, Shakespeare has 943 different pairs. The most common are `_` + `t` (23,837), `t` + `h` (22,739), `h` + `e` (18,203), `_` + `a` (13,541), and `o` + `u` (12,730).

### 5. Merge the most common pair

```js
learnMerge() {
  // Get the most common pair
  let pair = this.mostCommonPair();
  // Put it in an array of merges
  this.merges.push(pair);
  // Add the the new token
  this.vocab.push(pair[0] + pair[1]);
  // And update all the tokens inside each unique word
  for (let word of this.words) {
    word.tokens = this.merge(word.tokens, pair);
  }
}
```

So if `_` + `t` is the most frequent pair, it comes a new token: `_t`. Then `merge()` goes through every word and replaces the any instances of `' '` and `'t'` and replaces them with the single token `' t'`.

```js
[' ', 't', 'h', 'e']  →  [' t', 'h', 'e']
```

### 6. Repeat

Then the whole process starts over, all the pairs need to be counted again because they will different due to the merge. The loop keeps going until the vocabulary has `vocabSize` tokens. GPT-2 does 50,000!

## Using the tokenizer

To split any new text into tokens, `tokenizeWord()` does the same process and starts each word as single characters and repeats every merge in the order it was learned. `encode()` turns tokens into ids (a token's id is its index in the vocabulary), and `decode()` turns ids back into text: exactly the original text.

## Things to try

1. Change `vocabSize`. Try 1,000 or 5,000 or 10,000 and so on.
2. Try `data/dickinson.txt` or your own text.
3. Change `splitWords()` so that words don't keep their spaces.

## References

- 🔗 [The Tokenizer Playground](https://huggingface.co/spaces/Xenova/the-tokenizer-playground)
- 🔗 [Byte-pair encoding](https://huggingface.co/learn/llm-course/chapter6/5)
- 🎥 [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE)
- 📚 [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) (Sennrich et al., 2016)
