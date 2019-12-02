const log = console.log;

const curry = f => (a, ..._) => _.length ? f(a, ..._) : (..._) => f(a, ..._);

const isIterable = a => a && a[Symbol.iterator];

const go1 = (a,f) => a instanceof Promise ? a.then(f) : f(a);

const reduceF = (acc, a, f) => 
  a instanceof Promise ? 
    a.then(a => f(acc,a), e => e == nop ? acc : Promise.reject(e)) : 
    //위의 코드 a.then(a=>f(),e=>e) 에서 then()의 두번째 인자는 reject() 를 대신해서 작업할 수 있다! 
    //a.then(a=>f()).catch(e=>e)   ===    a.then(a=>f(a), e=>e)  와 같다고 보면 된다 
    f(acc,a);
    //then(함수f(인자))  를 하여 프로미스 값을 처리하고  프로미스값이 아니면 함수f(인자) 로 처리한다
    //** filter()에서 생성된 nop 일때는 f(acc,a) 처럼 추가하는게 아닌 그냥 넘기는 f(acc) 처리를 해준다

const head = iter => go1(take(1, iter), ([h]) => h);
//reduce()로 들어올 이터러블 인자가 프로미스 값일경우 처리를 위해 go1()을 사용
//이터러블인자를 take로 맨앞 1개만 빼고, 배열을 빼서 값만 보냄

const reduce = curry((f,acc,iter) => {
  //acc에 이터러블 인자가 들어갈 경우 head() 를 통해 인자를 3개로 만든다
  if(!iter) {return reduce(f, head(iter = acc[Symbol.iterator]()), iter);}

  iter = iter[Symbol.iterator]();
  return go1(acc, function recur(acc){
    //go1() 을 통해 acc는 프로미스 값이 처리가 되지만 이터러블객체(iter) 내부의 인자가 프로미스 값이라면
    //처리가 안되기 떄문에 한번 더 프로미스 값을 처리해준다
    //[promise값(1),promise값(2),promise값(3),promise값(4)] 이렇게 프로미스 값이 들어오는것을 처리하기 위해
    //한번더 처리해준다(이작업은 reduceF 에서 해준다)
    let cur;
    while(!(cur = iter.next()).done){
      acc = reduceF(acc, cur.value, f); //아래의 주석처리 작업을 여기서 해준다 (프로미스값 처리를 위해)
      // const a = cur.value; 
      // acc = f(acc, a);
      if(acc instanceof Promise) return acc.then(recur);
    }
    return acc;
  });
});

const go = (...args) => reduce((a,f) => f(a), args);

const pipe = (f, ...fs) => (...as) => go(f(...as), ...fs);

const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  return function recur(){
    let cur;
    while(!(cur = iter.next()).done){
      const a = cur.value;
      if(a instanceof Promise){
        return a.then(a => (res.push(a), res).length == l ? res : recur()) //이부분은 아래와 같다
              // .then(a => {
              //   res.push(a);
              //   if(res.length == l) return res;
              //   return recur()})
              .catch(e => e == nop ? recur() : Promise.reject(e)); //여기서 filter 에서 만든 nop을 여기서 처리
              //filter() 에서 만든 에러인 nop일때 다음 이터러블 인자로 넘어가기 위해 recur() 로 재귀함수를 실행한다
              //만약 nop이 아닌 에러가 발생할때는 진짜 에러를 발생시켜 다른곳의 catch() 로 잡는다 
      }
      res.push(a);
      if(res.length == l) return res;
    }
    return res;
  }();
});

const takeAll = take(Infinity);

const L = {};

L.range = function* (l){
  let i = -1;
  while(++i < l) yield i;
};

L.map = curry(function* (f, iter){
  for(const a of iter) {
    yield go1(a,f);
  }
});

const nop = Symbol('nop');

L.filter = curry(function*(f, iter){
  for(const a of iter){
    const b = go1(a, f); //go1()을 통해 프로미스값 판별후 f함수값을 적용시킨값을 b에 넣는다
    if(b instanceof Promise) yield b.then(b => b ? a : Promise.reject(nop));
    //b가 프로미스값인지 판별, 함수f를 통한 b값이 true면 그냥 프로미스값 a를 넘긴다(take,reduce에서 then() 처리한다)
    //(map, filter는 인자처리를 하지 않는다, - 인자처리는 take, reduce에서 처리)
    //f함수를 거친 이터러블인자가 false라면 nop을 포함한 reject를 발생시킨다! 
    //reject를 발생시키면 then()을 뛰어넘고 바로 catch()로 가기 때문이다! 
    //(take에서 catch로 재귀함수를 실행시켜 중간의 함수들을 넘겨버리는 것이다 - 지연적일때 활용)
    else if(b) yield a; //동기적 상황이라면 함수f를 통한 b가 true일때 그냥 이터러블인자 a를 다음 함수에 전달하면된다
  }                 //(b가 비동기상황 promise값일때를 생각해서 위의 코드 작성)
});

L.entries = function* (obj){
  for(const k in obj) yield [k, obj[k]];
};

L.flatten = function* (iter){
  for(const a of iter){
    if(isIterable(a)) yield* a; 
  }
};

L.deepFlat = function* f(iter){
  for(const a of iter){
    if(isIterable(a)) yield* f(a);
    else yield a;
  }
};

L.flatMap = curry(pipe(L.map, L.flatten));

const map = curry(pipe(L.map, takeAll));

const filter = curry(pipe(L.filter, takeAll));

const find = curry((f,iter) => go(
  iter,
  L.filter(f),
  take(1),
  ([a]) => a
));

const flatten = pipe(L.flatten, takeAll);

const flatMap = curry(pipe(L.map, flatten));

const add = (a,b) => a+b;

const range = l => {
  let i = -1;
  let res = [];
  while(++i < l){
    res.push(i);
  }
  return res;
};

module.exports = {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add, flatMap};
