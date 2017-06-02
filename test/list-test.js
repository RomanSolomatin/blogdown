/*
 * blogdown
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test = require('utest');
var assert = require('assert');
var sinon = require('sinon');

var list = require('../lib/list');


test('list', {

  'returns the array unmodified': function () {
    var result = list.create([{ foo: 'foo' }, { bar : 'bar' }], {}, {});

    assert.deepEqual(result, [{ foo: 'foo' }, { bar : 'bar' }]);
  }

});


test('list limit', {

  'shortens the array': function () {
    var result = list.create(new Array(10), { limit : 3 });

    assert.equal(result.length, 3);
  }

});


test('list sort', {

  'sorts items naturally by property': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], { sort : 'a' });

    assert.deepEqual(result, [{ a : 1 }, { a : 2 }]);
  },


  'sorts and then shortens items': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], {
      sort  : 'a',
      limit : 1
    });

    assert.deepEqual(result, [{ a : 1 }]);
  },


  'sorts items DESC by property': function () {
    var result = list.create([{ a : 1 }, { a : 2 }], { sort : 'a DESC' });

    assert.deepEqual(result, [{ a : 2 }, { a : 1 }]);
  },


  'sorts items ASC by property': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], { sort : 'a ASC' });

    assert.deepEqual(result, [{ a : 1 }, { a : 2 }]);
  },


  'throws if order direction is not ASC or DESC': function () {
    assert.throws(function () {
      list.create([], { sort : 'a FOO' });
    }, /^SyntaxError\: Cannot sort list by "a FOO"; Illegal expression$/);
  },


  'resolves property path': function () {
    var result = list.create([{ a : { b : 2 } }, { a : { b : 1 } }],
        { sort : 'a.b ASC' });

    assert.deepEqual(result, [{ a : { b : 1 } }, { a : { b : 2 } }]);
  },


  'throws meaningful error if property is undefined': function () {
    assert.throws(function () {
      list.create([{ a : 1 }, { a : 2 }], { sort : 'b' });
    }, /^Error\: Cannot sort list by "b"; Unknown property "b"$/);
  },


  'throws meaningful error if property path is undefined': function () {
    assert.throws(function () {
      list.create([{ a : { b : 1 } }, { a : { c : 2 } }], { sort : 'a.c' });
    }, /^Error\: Cannot sort list by "a\.c"; Unknown property "c"$/);
  },


  'throws meaningful error if property path cannot be resolved': function () {
    assert.throws(function () {
      list.create([{ a : { b : 1 } }, { a : { c : 2 } }], { sort : 'a.b.c' });
    }, /^Error\: Cannot sort list by "a\.b\.c"; Unknown property "c"$/);
  }

});


test('list filter', {

  'filters items by key = value': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], { filter : 'a = 1' });

    assert.deepEqual(result, [{ a : 1 }]);
  },


  'filters items by key=value': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], { filter : 'a=1' });

    assert.deepEqual(result, [{ a : 1 }]);
  },


  'filters items by key != value': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], { filter : 'a != 1' });

    assert.deepEqual(result, [{ a : 2 }]);
  },


  'filters items by key!=value': function () {
    var result = list.create([{ a : 2 }, { a : 1 }], { filter : 'a!=1' });

    assert.deepEqual(result, [{ a : 2 }]);
  },


  'filters items by key = val*': function () {
    var result = list.create([{ a : 'a1' }, { a : 'a2' }, { a : 'b1' }],
        { filter : 'a = a*' });

    assert.deepEqual(result, [{ a : 'a1' }, { a : 'a2' }]);
  },


  'throws if filter does not make sense': function () {
    assert.throws(function () {
      list.create([], { filter : 'a # b' });
    }, /^SyntaxError\: Cannot filter list by "a # b"; Illegal expression$/);
  },


  'resolves property path': function () {
    var result = list.create([{ a : { b : 42 } }], { filter : 'a.b = 42' });

    assert.equal(result.length, 1);
  }

});


test('list nav', {

  before: function () {
    var context = this.context = {};
    this.list = list.create([{ n : 1 }, { n : 2 }, { n : 3 }], {}, context);
  },

  'initialized previous and next with null': function () {
    assert.strictEqual(this.list.nav.previous, null);
    assert.strictEqual(this.list.nav.next, null);
  },


  'activates the first item': function () {
    this.context.current = this.list[0];

    assert.strictEqual(this.list.nav.previous, null);
    assert.strictEqual(this.list.nav.next, this.list[1]);
  },


  'activates the second item': function () {
    this.context.current = this.list[1];

    assert.strictEqual(this.list.nav.previous, this.list[0]);
    assert.strictEqual(this.list.nav.next, this.list[2]);
  },


  'activates the third item': function () {
    this.context.current = this.list[2];

    assert.strictEqual(this.list.nav.previous, this.list[1]);
    assert.strictEqual(this.list.nav.next, null);
  }

});


var sandbox;

test('list createAll', {

  before: function () {
    sandbox = sinon.sandbox.create();
  },

  after: function () {
    sandbox.restore();
  },

  'creates a map of lists for the given config': function () {
    var result = list.createAll([{ n : 1 }, { n : 2 }], {
      foo : { limit : 1 },
      bar : { sort  : 'n DESC' }
    });

    assert.deepEqual(result, {
      foo : [{ n : 1 }],
      bar : [{ n : 2 }, { n : 1 }]
    });
  },

  'passes context  and list name to create': function () {
    sandbox.spy(list, 'create');
    var context = { some : 'context' };

    list.createAll([], { foo : { limit : 1 } }, context);

    sinon.assert.calledWith(list.create, sinon.match.any, sinon.match.any,
      context, 'foo');
  }

});
