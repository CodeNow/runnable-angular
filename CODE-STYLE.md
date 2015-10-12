Code Style
=============

## File Naming standards

The type of file is put at the end, it's `fancySelectView` not `viewFancySelect` and it's `environmentController` not `controllerEnvironment`. 
File names are camel cased, no dashes or underscores.

## Javascript

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

BAD
```javascript
  promisify($scope.dir, 'destroy')().catch(function () {
      console.log('foo');
    }).finally(function(){
      console.log('foo');
    });
```

---

Functions are not var'd they are always named.

GOOD
```javascript
function myFunction () {
  return 'MyResponse'
}
```

BAD
```javascript
var myFunction = function () {
  return 'MyResponse'
}
```

---

We always put a space between our function definition and the `(` and there is also a space before every `{`

GOOD
```javascript
function myFunction () {

}
```

BAD
```javascript
function myFunction(){

}
```

BAD
```javascript
function myFunction() {

}
```

BAD
```javascript
function myFunction (){

}
```

---

We always use braces around if's and else's. Also spacing is like that of functions.
Else's are formatted like so `} else {`

GOOD
```javascript
if (isTruthy) {
  console.log('It\'s super truthy!')
} else {

}
```

BAD
```javascript
if (isTruthy)
  console.log('It\'s super truthy')
```

## Jade

Attributes are alphabetical

GOOD
```
div(
  bar = "foo"
  foo = "bar"
)
```

BAD
```
div(
  foo = "bar"
  bar = "foo"
)
```

There are no commas after attributes

GOOD
```
div(
  bar = "bar"
  foo = "foo"
  baz = "baz"
)
```

BAD
```
div(
  bar = "bar",
  foo = "foo",
  baz = "baz"
)
```
