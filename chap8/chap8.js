const log = console.log;

const curry = f => (a, ..._) => _.length ? f(a, ..._) : (..._) => f(a, ..._);

const isIterable = a => a && a[Symbol.iterator];

const go1 = (a,f) => a instanceof Promise ? a.then(f) : f(a);
//처음 프로미스값(비동기상황)이 들어올때 처리

const reduce = curry((f, acc, iter) => {
  if(!iter){
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }else{
    iter = iter[Symbol.iterator]();
  }
  return go1(acc, function recur(acc){  //누적으로 더하는 객체(acc)에 go1()을 통해 비동기 상황처리
    let cur;
    while(!(cur = iter.next()).done){
      const a = cur.value;
      acc = f(acc, a);
      if(acc instanceof Promise) return acc.then(recur);
      //비동기 상황 -> 동기 상황일때를 대비해서 한번더 처음 상황으로 구분하기 위한 재귀함수 사용
    }
    return acc;
  });
});

const go = (...args) => reduce((a, f) => f(a), args);

const pipe = (f, ...fs) => (...as) => go(f(...as), ...fs);

const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  let cur;
  while(!(cur = iter.next()).done){
    const a = cur.value;
    res.push(a);
    if(res.length == l) return res;
  }
  return res;
});

const takeAll = take(Infinity);

const L = {};

const range = l => {
  let res = [];
  let i = -1;
  while(++i < l){
    res.push(i);
  }
  return res;
};

L.range = function* (l){
  let i = -1;
  while(++i < l) yield i;
};

L.map = curry(function* (f, iter){
  for(const a of iter) yield f(a);
});

L.filter = curry(function* (f, iter){
  for(const a of iter){
    if(f(a)) yield a;
  }
});

L.entries = function* (obj){
  for(const k in obj) yield [k, obj[k]];
};

const map = curry(pipe(L.map, takeAll));

const filter = curry(pipe(L.filter, takeAll));

const find = curry((f,iter) => go(
  iter,
  L.filter(f),
  take(1),
  ([a]) => a
));

const add = (a,b) => a + b;


module.exports = {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add};
