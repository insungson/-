const {log, curry, L, take, reduce, go, pipe, add, range} = require('./chap7');

//## L.map + take로 map 만들기

L.map = curry(function* (f, iter){
  for(const a of iter) yield f(a);
  //앞에서 사용한 [Symbol.iterator]() 를 사용하여 처리한 것을 for of로 간단히 바꾸자
});

const takeAll = take(Infinity); //계속 take() 수행을 하도록 한다

const map = curry(pipe(L.map, takeAll));
//L.map으로 지연성을 가진 map을 계속 값을 수행하도록 takeAll()로 처리

log(map(a => a+10, L.range(4)));
//[ 10, 11, 12, 13 ]




//## L.filter + take로 filter 만들기
//제너레이터로 지연적 filter를 만들고 pipe로 takeAll 과 연결시킨다

L.filter = curry(function* (f, iter){
  for(const a of iter){
    if(f(a)) yield a;
  }
});

const filter = curry(pipe(L.filter, takeAll));

log(filter(a => a % 2, range(4)));
//[ 1, 3 ]