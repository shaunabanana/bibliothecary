# Bibliothecary

A string search library implementing typical operators found in academic databases (boolean operators, NEAR, wildcards).

## Installation
```
npm i bibliothecary
```

## Usage
```javascript
import { Query } from 'bibliothecary';

const intro = "A string search library implementing typical operators found in academic databases (boolean operators, NEAR, wildcards)."

const results = new Query('academic AND search AND library').search(intro);
/* => [
  { term: 'academic', text: 'academic', start: 64, length: 8 },
  { term: 'search', text: 'search', start: 9, length: 6 },
  { term: 'lib*', text: 'library', start: 16, length: 7 }
]*/
const shouldBeFalse = new Query('academic AND search AND NOT library').search(intro); // => false
```

## A quick primer on search operators
### Strings
- `word1 word2` matches strings that mentions any of `word1` and `word2`.
- `"word1 word2"` matches strings that contains exactly the phrase `"word1 word2"`.
### Search operators
- `word1 AND word2` matches strings that mentions both `word1` and `word2`.
- `word1 OR word2` matches strings that mentions any of `word1` and `word2`.
- `NOT word1` matches strings that does not mention `word1` anywhere.
- `word1 NEAR/n word2` requires that `word1` and `word2` are `n` words or less apart.
- `word1 ONEAR/n word2` does the same as `NEAR/n`, while also requires `word1` to appear before `word2`.
### Wildcards
- `?` matches any one letter, e.g., `wor?` matches `word` and `work`.
- `*` matches any number of letters, e.g., `wor*` matches `word` and `worry`.

### Combining operators
- Operators can be combined freely, e.g., `"word1 B" AND NOT "word1 word3" OR (word1 ONEAR/3 word4) AND word5`.
- `()` can be used to group parts of the query.
- Note that `NEAR` and `ONEAR` must have string literals on both sides and not other operators. That is, `word1 NEAR/3 word2` is OK, but `(word1 AND word2) NEAR/3 word3` is not.
### Operator priorities
- Operators have different priorities. For example, `word1 OR word2 AND word3` will be interpreted as `word1 OR (word2 AND word3)`, because `AND` has higher priority than `OR`.
- Operators priorities are ordered as such: `""?*` > `()` > `ONEAR` > `NEAR` > `NOT` > `AND` > `OR`.
