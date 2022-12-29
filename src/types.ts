// Input text will be formatted into tokens.
export type Token = {
    type: string,
    text: string,
    index: number,
    start: number,
    length: number
}
export type TokenizedText = {
    original: string
    tokens: Array<Token>
};

// Parse tree nodes and terms

export type ParseTreeNode = ParseTreeLogical | ParseTreeNear | ParseTreeTerm;
export type ParseTreeLogical = {
    type: 'AND' | 'OR' | 'NOT',
    left: ParseTreeNode | ParseTreeTerm,
    right: ParseTreeNode | ParseTreeTerm
};
export type ParseTreeNear = {
    type: 'NEAR' | 'ONEAR',
    left: ParseTreeNode | ParseTreeTerm,
    right: ParseTreeNode | ParseTreeTerm,
    parameter: number
};
export type ParseTreeTerm = {
    type: 'TERM',
    left: undefined,
    right: string[],
    parameter: boolean,
}

// Match object
export type Match = {
    query: string,
    text: string,
    start: number,
    length: number,
    wordIndex: number,
    wordLength: number
}
export type MatchResult = Match[] | false;

// ???
export type OrderMatch = {
    text: string,
    start: number,
    length: number,
    location: number
}