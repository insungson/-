const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add} = require('./chap8');

// ## promise.then의 중요한 규칙
//- 프로미스가 여러번 중첩되어도 then()으로 원하는 시점에서 한번에 중첩된 결과를 받을 수 있다

//아래처럼 프로미스를 중첩해서 여러번 받아도 .then()으로 한번에 원하는 결과값을 받을 수 있다
Promise.resolve(Promise.resolve(1)).then(function (a) {
  log(a); //1
});

new Promise(resolve => resolve(new Promise(resolve => resolve(1)))).then(log); //1