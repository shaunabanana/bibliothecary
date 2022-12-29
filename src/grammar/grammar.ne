@{%
const moo = require("moo");

const lexer = moo.compile({
    WS:      /[ \t]+/,
    and: ['and', 'AND'],
    or: ['or', 'OR'],
    not: ['not', 'NOT'],
    onear: {
        match: /(?:onear|ONEAR)\/(?:[0-9]|[1-9][0-9]+)/,
        value: s => Number.parseInt(s.split('/')[1])
    },
    near: {
        match: /(?:near|NEAR)\/(?:[0-9]|[1-9][0-9]+)/,
        value: s => Number.parseInt(s.split('/')[1])
    },
    word:  /[^"() \t\n\r/"]+/,
    quote:  /["]/,
    lparen:  '(',
    rparen:  ')',
    NL:      { match: /[\n\r]/, lineBreaks: true },
});
%}

@{%
const unArray = function (array) {
    let current = array;
    while (Array.isArray(current)) {
        current = current[0];
    }
    return current;
}
const appendItem = function (a, b) {
    return function (d) { 
        return d[a].concat([d[b]]); 
    } 
};

const selectItem = function (a) {
    return function (d) { 
        return d[a]; 
    } 
};

const operatorizeOneOperand = function (data) {
    return {
        type: data[0].type.toUpperCase(),
        right: unArray(data[2])
    }; 
};

const operatorizeTwoOperands = function (data) {
    return {
        type: data[2].type.toUpperCase(),
        parameter: data[2].type === 'near' || data[2].type === 'onear' ? data[2].value : undefined,
        left: unArray(data[0]),
        right: unArray(data[4]),
    }; 
};

const processParentheses = function (data) {
    return data[2]; 
};

const processUnquotedTerm = function (data) { 
	// console.log(data);
    const words = data[0].map(word => unArray(word).value.toLowerCase());
    return {
        type: 'TERM',
        parameter: false,
        right: [...new Set(words)]
    }; 
};

const processQuotedTerm = function (data) {
    return {
        type: 'TERM',
        parameter: true,
        right: data[2].map(word => unArray(word).value.toLowerCase())
    }; 
};
%}

@lexer lexer

main            -> untrimmed {% unArray %}

untrimmed       -> ws:* onear_clause ws:* {% selectItem(1) %}

onear_clause    -> onear_clause ws:+ %onear ws:+ near_clause {% operatorizeTwoOperands %}
                 | near_clause

near_clause     -> near_clause ws:+ %near ws:+ or_clause {% operatorizeTwoOperands %}
                 | or_clause

or_clause       -> or_clause ws:+ %or ws:+ and_clause  {% operatorizeTwoOperands %}
                 | and_clause

and_clause      -> and_clause ws:+ %and ws:+ not_clause {% operatorizeTwoOperands %}
                 | not_clause

not_clause      -> %not ws:+ paren_clause                    {% operatorizeOneOperand %}
                 | paren_clause

paren_clause    -> %lparen ws:* main ws:* %rparen  {% processParentheses %}
                 | term

term            -> unquoted_term                    {% processUnquotedTerm %}
                 | %quote ws:* quoted_term ws:* %quote        {% processQuotedTerm %}

unquoted_term   -> %word                            
                 | unquoted_term ws:+ %word          {% appendItem(0,2) %}

quoted_term     -> %word                            
                 | quoted_term ws:+ %word            {% appendItem(0,2) %}
                 | quoted_term ws:+ (%and|%or|%not)  {% appendItem(0,2) %}

ws              -> %WS                              {% d => null %}