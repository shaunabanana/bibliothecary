import { TokenizedText, Match, MatchResult } from './types';
import { formatWildcards } from './utils';


export function andOperator(
    left: MatchResult,
    right: MatchResult,
): MatchResult {
    let matches: Match[] = [];

    // If left result is false, and automatically fails.
    if (Array.isArray(left)) matches = matches.concat(left);
    else return false;

    // Same here. If right result is false, and automatically fails.
    if (Array.isArray(right)) matches = matches.concat(right);
    else return false;

    return matches;
}


export function orOperator(
    left: MatchResult,
    right: MatchResult,
): MatchResult {
    let matches: Match[] = [];

    // In OR operators, we gather the left and right results first, then judge if any resulted in matches
    if (Array.isArray(left)) matches = matches.concat(left);
    if (Array.isArray(right)) matches = matches.concat(right);

    // If neither left nor right returned matches, matches.length will be 0.
    return matches.length > 0 ? matches : false;
}


export function notOperator(
    input: MatchResult,
): MatchResult {
    // If the input contains matches, then this operator fails and return false.
    // Otherwise, an empty array adds nothing to the match, but does not mean fail.
    return input ? false : [] as Match[];
}


export function nearOperator(
    left: MatchResult,
    right: MatchResult,
    distance: Number,
): MatchResult {
    if (left === false || right === false) return false;

    const getMatchRange = (matches: Match[]) => {
        let start = Number.MAX_VALUE;
        let end = Number.MIN_VALUE;
        matches.forEach((match) => {
            if (match.wordIndex < start) start = match.start;
            if (match.wordIndex + match.wordLength - 1 > end)
                end = match.wordIndex + match.wordLength - 1;
        })
        return { start, end }
    }
    
    let leftRange = getMatchRange(left);
    let rightRange = getMatchRange(right);
    
    if (
        Math.abs(leftRange.end - rightRange.start) <= distance
        || Math.abs(leftRange.start - rightRange.end) <= distance
    ) return left.concat(right);

    return false;
}

export function orderedNearOperator(
    left: MatchResult,
    right: MatchResult,
    distance: Number,
): MatchResult {
    if (left === false || right === false) return false;

    const getMatchRange = (matches: Match[]) => {
        let start = Number.POSITIVE_INFINITY;
        let end = Number.NEGATIVE_INFINITY;
        matches.forEach((match) => {
            if (match.wordIndex < start) start = match.wordIndex;
            if (match.wordIndex + match.wordLength - 1 > end)
                end = match.wordIndex + match.wordLength - 1;
        })
        return { start, end }
    }
    
    let leftRange = getMatchRange(left);
    let rightRange = getMatchRange(right);
    
    if (
        Math.abs(leftRange.end - rightRange.start) <= distance
    ) return left.concat(right);

    return false;
}


function matchQuotedTerm(text: TokenizedText, words: string[]) {
    const result: Match[] = [];

    const query = formatWildcards(words.join('[ \\s\\t\\n\\r]+'));
    const regexp = new RegExp(query, 'gi');
    const matches = [...text.original.matchAll(regexp)];

    if (matches) {
        matches.forEach((match) => {
            if (match.index === undefined) return;
            const startToken = text.tokens.find((token) => token.start === match.index);
            const endToken = text.tokens.find((token) =>
                match.index !== undefined &&
                token.start + token.length === match.index + match[0].length
            );
            // if (!startToken) return;
            if (!startToken || !endToken) return;
            result.push({
                query: `"${words.join(' ')}"`,
                text: match[0],
                start: match.index,
                length: match[0].length,
                wordIndex: startToken.index,
                wordLength: endToken.index - startToken.index + 1
            });
        });
    }
    return result.length > 0 ? result : false;
}

function matchUnquotedTerm(text: TokenizedText, words: string[]) {
    const result: Match[] = [];

    text.tokens.forEach(token => {
        words.forEach((word) => {
            const query = formatWildcards(word);
            const regexp = new RegExp(`^${query}$`, 'gi');
            const matches = [...token.text.matchAll(regexp)];
            if (matches) {
                matches.forEach((match) => {
                    // console.log(match);
                    if (match.index === undefined) return;
                    result.push({
                        query: word,
                        text: token.text,
                        start: token.start,
                        length: token.length,
                        wordIndex: token.index,
                        wordLength: 1
                    });
                });
            }
        });
    });
    return result.length > 0 ? result : false;
}

export function termOperator(
    text: TokenizedText,
    words: string[],
    quoted: boolean
): MatchResult {
    return quoted
        ? matchQuotedTerm(text, words)
        : matchUnquotedTerm(text, words);
}