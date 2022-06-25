import { Parser, Grammar } from 'nearley';

import grammar from './grammar';

type ParseTreeNode = {
    type: string,
    left: ParseTreeNode | ParseTreeTerm,
    right: ParseTreeNode | ParseTreeTerm,
    parameter?: number | boolean,
}

type ParseTreeTerm = {
    type: string,
    left: undefined,
    right: string[],
    parameter?: boolean,
}

type OperatorRegistry = {
    [key: string]: Function;
};

type Match = {
    term: string,
    text: string,
    start: number,
    length: number,
    wordIndex?: number
}

type OrderMatch = {
    text: string,
    start: number,
    length: number,
    location: number
}

function formatWildcards(query: string) {
    return query.replace('*', '[^ \\t\\n\\r]*').replace('?', '[^ \\t\\n\\r]');
}

export class Query {

    parser: Parser
    tree: ParseTreeNode[]
    operators: OperatorRegistry

    constructor(query: string) {
        this.parser = new Parser(Grammar.fromCompiled(grammar));
        this.parser.feed(query);
        this.tree = this.parser.results;

        this.operators = {
            AND: this.andOperator.bind(this),
            OR: this.orOperator.bind(this),
            NOT: this.notOperator.bind(this),
            NEAR: Query.nearOperator.bind(this),
            ONEAR: Query.orderedNearOperator.bind(this),
            TERM: Query.termOperator.bind(this),
        };
    }

    search(text: string) {
        // console.log(this.tree[0]);
        return this.operators[this.tree[0].type](
            text,
            this.tree[0].left,
            this.tree[0].right,
            this.tree[0].parameter,
        );
    }

    andOperator(text: string, left: ParseTreeNode, right: ParseTreeNode) {
        // console.log('AND', text, left, right);
        let matches: Match[] = [];

        const leftResult = this.operators[left.type](text, left.left, left.right, left.parameter);
        if (leftResult) matches = matches.concat(leftResult);
        else return false;

        const rightResult = this.operators[right.type](
            text,
            right.left,
            right.right,
            right.parameter,
        );
        if (rightResult) matches = matches.concat(rightResult);
        else return false;

        return matches;
    }

    orOperator(text: string, left: ParseTreeNode, right: ParseTreeNode) {
        // console.log('OR', text, left, right);
        let matches: Match[] = [];

        const leftResult = this.operators[left.type](text, left.left, left.right, left.parameter);
        if (leftResult) matches = matches.concat(leftResult);

        const rightResult = this.operators[right.type](
            text,
            right.left,
            right.right,
            right.parameter,
        );
        if (rightResult) matches = matches.concat(rightResult);

        return matches.length > 0 ? matches : false;
    }

    notOperator(text: string, _: any, right: ParseTreeNode) {
        // console.log('NOT', text, right);
        const result = this.operators[right.type](text, right.left, right.right, right.parameter);
        return result ? false : [];
    }

    static nearOperator(text: string, left: ParseTreeTerm, right: ParseTreeTerm, distance: number) {
        // console.log('NEAR', this, text, left, right, distance);
        let currentStart = 0;
        const textWords = text.split(' ').map((word) => {
            const wordData = {
                text: word,
                start: currentStart,
                length: word.length,
            };
            currentStart += word.length + 1;
            return wordData;
        });
        const leftMatches: OrderMatch[] = [];
        const rightMatches: OrderMatch[] = [];
        const result: Match[] = [];

        textWords.forEach((word, index) => {
            const leftRegexp = new RegExp(formatWildcards(left.right[0]), 'i');
            const rightRegexp = new RegExp(formatWildcards(right.right[0]), 'i');
            if (leftRegexp.test(word.text)) {
                leftMatches.push({
                    text: word.text,
                    location: index,
                    start: word.start,
                    length: word.length,
                });
            }
            if (rightRegexp.test(word.text)) {
                rightMatches.push({
                    text: word.text,
                    location: index,
                    start: word.start,
                    length: word.length,
                });
            }
        });

        // console.log(leftMatches, rightMatches);

        leftMatches.forEach((leftMatch) => {
            rightMatches.forEach((rightMatch) => {
                if (Math.abs(leftMatch.location - rightMatch.location) <= distance) {
                    result.push({
                        term: left.right[0],
                        text: leftMatch.text,
                        start: leftMatch.start,
                        length: leftMatch.length,
                    });
                    result.push({
                        term: right.right[0],
                        text: rightMatch.text,
                        start: rightMatch.start,
                        length: rightMatch.length,
                    });
                }
            });
        });

        return result.length > 0 ? result : false;
    }

    static orderedNearOperator(text: string, left: ParseTreeTerm, right: ParseTreeTerm, distance: number) {
        // console.log('NEAR', this, text, left, right, distance);
        let currentStart = 0;
        const textWords = text.split(' ').map((word: string) => {
            const wordData = {
                text: word,
                start: currentStart,
                length: word.length,
            };
            currentStart += word.length + 1;
            return wordData;
        });
        const leftMatches: OrderMatch[] = [];
        const rightMatches: OrderMatch[] = [];
        const result: Match[] = [];

        textWords.forEach((word, index) => {
            const leftRegexp = new RegExp(formatWildcards(left.right[0]), 'i');
            const rightRegexp = new RegExp(formatWildcards(right.right[0]), 'i');
            if (leftRegexp.test(word.text)) {
                leftMatches.push({
                    text: word.text,
                    location: index,
                    start: word.start,
                    length: word.length,
                });
            }
            if (rightRegexp.test(word.text)) {
                rightMatches.push({
                    text: word.text,
                    location: index,
                    start: word.start,
                    length: word.length,
                });
            }
        });

        // console.log(leftMatches, rightMatches);

        leftMatches.forEach((leftMatch) => {
            rightMatches.forEach((rightMatch) => {
                if (
                    // eslint-disable-next-line operator-linebreak
                    leftMatch.location < rightMatch.location &&
                    rightMatch.location - leftMatch.location <= distance
                ) {
                    result.push({
                        term: left.right[0],
                        text: leftMatch.text,
                        start: leftMatch.start,
                        length: leftMatch.length,
                    });
                    result.push({
                        term: right.right[0],
                        text: rightMatch.text,
                        start: rightMatch.start,
                        length: rightMatch.length,
                    });
                }
            });
        });

        return result.length > 0 ? result : false;
    }

    static termOperator(text: string, _: any, words: string[], quoted: boolean) {
        // console.log('TERM', this, text, words);
        const result: Match[] = [];
        if (quoted) {
            const query = formatWildcards(words.join(' +'));
            const regexp = new RegExp(query, 'gi');
            const matches = [...text.matchAll(regexp)];
            if (matches) {
                // console.log(matches);
                matches.forEach((match) => {
                    if (!match.index) return;
                    result.push({
                        term: `"${words.join(' ')}"`,
                        text: match[0],
                        start: match.index,
                        length: match[0].length,
                    });
                });
            }
        } else {
            words.forEach((word) => {
                const query = formatWildcards(word);
                const regexp = new RegExp(query, 'gi');
                const matches = [...text.matchAll(regexp)];
                if (matches) {
                    // console.log(matches);
                    matches.forEach((match) => {
                        if (!match.index) return;
                        result.push({
                            term: word,
                            text: match[0],
                            start: match.index,
                            length: match[0].length,
                        });
                    });
                }
            });
        }
        return result.length > 0 ? result : false;
    }
}
