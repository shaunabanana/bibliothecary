import { Parser, Grammar } from 'nearley';
import WinkNLP from 'wink-nlp';
import Model from 'wink-eng-lite-web-model';


import { Token, TokenizedText, ParseTreeNode, MatchResult, ParseTreeNear } from './types';
import { OperatorRegistry } from './registry';
import {
    andOperator, orOperator, notOperator, termOperator, nearOperator, orderedNearOperator
} from './operators';
import grammar from './grammar';

const nlp = WinkNLP(Model);
const its = nlp.its;

const operators = OperatorRegistry.create()
    .register('AND', andOperator)
    .register('OR', orOperator)
    .register('NOT', notOperator)
    .register('TERM', termOperator)
    .register('NEAR', nearOperator)
    .register('ONEAR', orderedNearOperator)

export class Query {

    parser: Parser
    tree: ParseTreeNode[]

    constructor(query: string) {
        this.parser = new Parser(Grammar.fromCompiled(grammar));
        this.parser.feed(query);
        this.tree = this.parser.results;
    }

    tokenize(text: string): TokenizedText {
        const document = nlp.readDoc(text);

        // Process tokens into required format
        let start = 0;
        const tokenSpaces = document.tokens().out(its.precedingSpaces);
        const tokenTypes = document.tokens().out(its.type);
        const unmergedTokens = document.tokens().out().map((value, index) => {
            start += tokenSpaces[index].length;
            const token = {
                type: tokenTypes[index],
                index: index,
                text: value,
                start: start,
                length: value.length
            }
            start += value.length;
            return token;
        }).filter((token) => token.type !== 'punctuation'); // Remove punctuations

        // Ensure there are tokens for the next procedure by handling the empty case early
        if (unmergedTokens.length === 0) return { original: text, tokens: [] };

        // Merge abbreviations such as "'s" with the preceding word
        const tokens = [unmergedTokens[0]] as Array<Token>;
        let lastToken: Token = unmergedTokens[0];
        unmergedTokens.slice(1).forEach((token) => {
            if (
                token.text.charAt(0) === "'"
                && token.start === lastToken.start + lastToken.length
            ) {
                lastToken.text += token.text;
                lastToken.length += token.length;
            } else if (token.type !== 'punctuation') {
                tokens.push(token);
                lastToken = token;
            }
        })

        // Finalize word index
        tokens.forEach((token, index) => {
            token.index = index;
        })
        return { original: text, tokens: tokens };
    }

    search(text: string) {
        return this.recursiveSearch(this.tokenize(text), this.tree[0]);
    }

    recursiveSearch(text: TokenizedText, node: ParseTreeNode): MatchResult {
        if (node.type === 'TERM') {
            const operator = operators.get(node.type);
            return operator(text, node.right, node.parameter);
        } else {
            const resultsForOperand = (operand: ParseTreeNode) => {
                if (operand.type === 'TERM') {
                    const termOperator = operators.get('TERM');
                    return termOperator(text, operand.right, operand.parameter)
                } else {
                    return this.recursiveSearch(text, operand);
                }
            }

            if (node.type === 'NOT') {
                const input = resultsForOperand(node.right);
                const operator = operators.get(node.type);
                return operator(input);
            } else if (node.type === 'NEAR' || node.type === 'ONEAR') {
                const left = resultsForOperand(node.left);
                const right = resultsForOperand(node.right);
                const operator = operators.get(node.type);
                return operator(left, right, node.parameter);
            } else {
                const left = resultsForOperand(node.left);
                const right = resultsForOperand(node.right);
                const operator = operators.get(node.type);
                return operator(left, right);
            }
        }
    }
}
