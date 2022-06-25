const assert = require('assert');
const { Query } = require('..');

describe('Query', function () {
    describe('Parsing', function () {
        it('should pass', function () {
            assert.ok(new Query('NOT asdf'));
            assert.ok(new Query('(NOT asdf)'));
        });
    });
});