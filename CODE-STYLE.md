Code Style
=============

`var` is only used to define one var, no multiline statements.

GOOD
```javascript
var foo;
var bar;
var baz;
```

BAD
```javascript
var foo,
  bar,
  baz;
```

---

Leading commas are avoided, we use trailing commas. Also make sure we don't have a dangling comma on the last item.

GOOD
```javascript
var foo = [
  'foo',
  'bar',
  'baz'
]
```

BAD
```javascript
var foo = [
  'foo'
  , 'bar'
  , 'baz'
]
```

---

Leading `.` on chains are expected:

GOOD
```javascript
  promisify($scope.dir, 'destroy')()
    .catch(function () {
      console.log('foo');
    })
    .finally(function(){
      console.log('foo');
    });
```

BADE
```javascript
  promisify($scope.dir, 'destroy')().catch(function () {
      console.log('foo');
    }).finally(function(){
      console.log('foo');
    });
```

