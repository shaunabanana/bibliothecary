const assert = require('assert');
const { Query } = require('..');

describe('Literals', function () {
    describe('Unquoted', function () {
        it('Parsing one single word should return an Array of it', function () {
            assert.deepEqual(new Query('test').tree, [
                { type: 'TERM', parameter: false, right: ['test'] }
            ])
        });

        it('Parsing multiple different words should return an Array of them', function () {
            assert.deepEqual(new Query('test1 test2').tree, [
                { type: 'TERM', parameter: false, right: ['test1', 'test2'] }
            ])
        });

        it(
            'Parsing multiple words that are the same should return only one for each unique word',
            function () {
                assert.deepEqual(new Query('test test test2').tree, [
                    { type: 'TERM', parameter: false, right: ['test', 'test2'] }
                ])
            }
        );

        it('Matching one single word should give its term, text, start, and length', function () {
            assert.deepEqual(new Query('test').search('test'), [
                { length: 4, start: 0, query: 'test', text: 'test', wordIndex: 0, wordLength: 1 },
            ])
        });

        it('Matching multiple words should return those fields as well', function () {
            assert.deepEqual(new Query('test').search('test test'), [
                { length: 4, start: 0, query: 'test', text: 'test', wordIndex: 0, wordLength: 1 },
                { length: 4, start: 5, query: 'test', text: 'test', wordIndex: 1, wordLength: 1 }
            ])
        });
    });

    describe('Quoted', function () {
        it('Parsing one single word should return an Array of it', function () {
            assert.deepEqual(new Query('"test"').tree, [
                { type: 'TERM', parameter: true, right: ['test'] }
            ])
        });

        it('Parsing multiple different words should return an Array of them', function () {
            assert.deepEqual(new Query('"test1 test2"').tree, [
                { type: 'TERM', parameter: true, right: ['test1', 'test2'] }
            ])
        });

        it(
            'Parsing multiple words that are the same should NOT remove duplicates',
            function () {
                assert.deepEqual(new Query('"test test test2"').tree, [
                    { type: 'TERM', parameter: true, right: ['test', 'test', 'test2'] }
                ])
            }
        );

        it('Matching one single word should give its term, text, start, and length', function () {
            assert.deepEqual(new Query('test').search('test'), [
                { length: 4, start: 0, query: 'test', text: 'test', wordIndex: 0, wordLength: 1 },
            ])
        });

        it('Matching multiple words should return those fields as well', function () {
            assert.deepEqual(new Query('test').search('test test'), [
                { length: 4, start: 0, query: 'test', text: 'test', wordIndex: 0, wordLength: 1 },
                { length: 4, start: 5, query: 'test', text: 'test', wordIndex: 1, wordLength: 1 }
            ])
        });

        it('Double-quoted terms could contain single quotes', function () {
            assert.deepEqual(new Query('"people\'s"').search("People's perception"), [
                { length: 8, start: 0, query: '"people\'s"', text: "People's", wordIndex: 0, wordLength: 1 },
            ])

            assert.deepEqual(new Query('"people\'s"').search("'People's perception'"), [
                { length: 8, start: 1, query: '"people\'s"', text: "People's", wordIndex: 0, wordLength: 1 },
            ])
        });
    });
});

describe('Logical expressions', function () {

    describe('Parsing', function () {
        it(
            'Basic',
            function () {
                assert.deepEqual(
                    new Query('(test1 and test2 or test4) and not test8')
                        .search('test1, test2, test3 test4 test5, test6 test7'),
                    [
                        { query: 'test1', text: 'test1', start: 0, length: 5, wordIndex: 0, wordLength: 1 },
                        { query: 'test2', text: 'test2', start: 7, length: 5, wordIndex: 1, wordLength: 1 },
                        { query: 'test4', text: 'test4', start: 20, length: 5, wordIndex: 3, wordLength: 1 }
                    ]
                );

                assert.deepEqual(
                    new Query('(test1 and test2 or test4) and not test7')
                        .search('test1, test2, test3 test4 test5, test6 test7'),
                    false
                );
            }
        );
    });

    describe('Matching', function () {
        // it(
        //     'Simple',
        //     function () {
        //         assert.deepEqual(new Query('test1, test2, test3').search('test and test'), [
        //             { length: 4, start: 0, term: 'test', text: 'test' },
        //         ])
        //     }
        // );
    });
});

console.log(new Query('"test1 test2" onear/3 test3').search("test1 test2 test test3"));
const left = new Query('"test1 test2"').search("test1 test2 test test3");
const right = new Query('test3').search("test1 test2 test test3");
const distance = 3;
let testResult;
console.log(left, right);

if (left === false || right === false) return false;

const getMatchRange = (matches) => {
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

console.log(leftRange, rightRange);

if (
    Math.abs(leftRange.end - rightRange.start) <= distance
) testResult = left.concat(right);
else testResult = false
console.log('Results:', testResult)

// console.log(new Query('"people\'s"').search("People's perception"))