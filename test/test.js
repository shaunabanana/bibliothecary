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
                { length: 4, start: 0, term: 'test', text: 'test' },
            ])
        });

        it('Matching multiple words should return those fields as well', function () {
            assert.deepEqual(new Query('test').search('test test'), [
                { length: 4, start: 0, term: 'test', text: 'test' },
                { length: 4, start: 5, term: 'test', text: 'test' }
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
                { length: 4, start: 0, term: 'test', text: 'test' },
            ])
        });

        it('Matching multiple words should return those fields as well', function () {
            assert.deepEqual(new Query('test').search('test test'), [
                { length: 4, start: 0, term: 'test', text: 'test' },
                { length: 4, start: 5, term: 'test', text: 'test' }
            ])
        });

        it('Double-quoted terms could contain single quotes', function () {
            assert.deepEqual(new Query('"people\'s"').search("People's perception"), [
                { length: 8, start: 0, term: '"people\'s"', text: "People's" },
            ])

            assert.deepEqual(new Query('"people\'s"').search("'People's perception'"), [
                { length: 8, start: 1, term: '"people\'s"', text: "People's" },
            ])
        });
    });
});