const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add, flatMap} = require('./chap9');


//## 지연 평가 + Promise - L.map, map, take
//기본적으로 map(), take() 는 동기적 상황에서 작동하는 함수들인데 Promise를 사용하여 비동기적 상황으로 만들어 보자

go(
  [1,2,3],
  L.map(a => a+10),
  take(2),
  log
);  //[ 11, 12 ]


//아래와 같이 promise를 배열에 넣을 경우 에러가 발생한다
//chap9.js 에서 L.map()에서 go1()을 적용시켜 프로미스 값을 처리하면 [promise{11},promise{12}] 처럼 
//프로미스 값으로 11,12가 될 예정인 값을 만들 수 있다
// [promise{11},promise{12}] 에서 [11,12] 로 값을 빼려면 chap9.js 에서 take() 함수에서 프로미스 값을 처리하도록
// 수정해준다
go(
  [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],////처름부터 프로미스값을 넣는다
  L.map(a => a+10),
  take(2),
  log   //위에서 L.map(), take() 를 프로미스 값을 처리하도록 수정했다면 위의 코드는 문제없지 작동한다
);  
//[ '[object Promise]10', '[object Promise]10' ]     프로미스 값을 처리하지 않으면 이렇게 나온다
//[ Promise { <pending> }, Promise { <pending> } ]  (take에서 return을 하지 않아서 이렇게 나온것이다)
//[ 11, 12 ]

go(
  [1,2,3],                  //프로미스가 아닌값으로 가서 
  L.map(a => Promise.resolve(a + 10)),    //L.map() 에서 프로미스로 동작 시킨다
  take(2),
  log
);  //위에서 L.map(), take() 를 프로미스 값을 처리하도록 수정했다면 위의 코드는 문제없지 작동한다
//[ 11, 12 ]

go(
  [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], //프로미스 값을 넣고
  L.map(a => Promise.resolve(a+10)),      //L.map()에서 프로미스로 동작시켜도 작동한다
  take(2),
  log
);
//[ 11, 12 ]

go(
  [1,2,3],
  map(a => Promise.resolve(a+10)),
  log
);
//[ 11, 12, 13 ]
//const map = curry(pipe(L.map, takeAll)); 위의 map은 L.map을 받고 takeAll은 take(Infinity); 를 받으므로
//map()을 사용해도 문제없이 작동한다





//## Kleisli Composition - L.filter, filter, nop, take
//- 필터에서 지연성과 비동기 동시성을 지원하려면 Kleisli 합성을 활용해야 한다
//- ** nop 은 Kleisli 합성을 활용하여 filter 에 들어간 함수의 조건이 맞지 않을 때 reject() 를 발생시켜
//- catch() 로 nop을 잡아 다음 함수로 넘기는(중간함수를 연산없이 뛰어넘어 성능 향상) 방법이다

//아래의 예로 설명을 해보자
go(
  [1, 2, 3, 4, 5, 6],
  L.map(a => Promise.resolve(a * a)),
  filter(a => Promise.resolve(a % 2)),
  L.map(a => {log(a,'1번'); return a*a;}),
  L.map(a => {log(a,'2번'); return a*a;}),
  take(4),
  log
);
// 1 '1번'
// 1 '2번'
// 4 '1번'
// 16 '2번'
// 9 '1번'
// 81 '2번'
// 16 '1번'
// 256 '2번'
// [ 1, 256, 6561, 65536 ] //홀수만 잡아야하는데.. 256이 왜 들어간걸까?..;;;; //1번:4회 , 2번:4회
//////////////////////////////  위는 nop 처리를 한 후의 로그
// 이제 chap9.js 에서 L.filter()에서 위의 개념(nop)을 발생시키고,
// take() 에서 nop을 처리해서 로직을 짜고 다시 찍어보자
// 1 '1번'
// 1 '2번'
// 9 '1번'
// 81 '2번'
// 25 '1번'
// 625 '2번'
// [ 1, 6561, 390625 ]  //1번:3회 , 2번:3회  실행됨

//chap9.js 에서 L.filter(), take() 함수에서 비동기적 작업을 해주면 위에서 시작할때 비동기적 상황을 만들던,
//함수에 비동기적 상황을 만들던 전부 동작한다는 것을 알 수 있다
//비동기 동시성, 지연평가가 가능한 함수가 되었다




//## reduce에서 nop 지원
//reduce에서도 nop으로 지연성과 비동기 동시성을 제어해보자

go(
  [1,2,3,4,5],
  L.map(a => Promise.resolve(a*a)),
  L.filter(a => Promise.resolve(a % 2)),
  reduce(add),
  log
);
//에러발생
//L.map(), L.filter() 에서 promise()값으로 비동기적 처리가 되었기 때문에 reduce()도 promise()값을 
//처리해야 에러가 안난다
//처리 후 
//35   로 잘 실행된다



//비동기적 처리를 확인하고 싶다면 L.map(), L.filter() 함수의 내부 값을 log() 로찍어보면 된다
//아래의 코드를 돌려보면 take()로 원하는 만큼 비동기처리를 통해 값을 얻는다
go(
  [1, 2, 3, 4, 5, 6, 7, 8],
  L.map(a => {
    log(a); 
    return new Promise(resolve => setTimeout(() => resolve(a * a), 1000));
  }),
  L.filter(a => {
    log(a);
    return new Promise(resolve => setTimeout(() => resolve(a % 2), 1000));
  }),
  take(2),
  reduce(add),
  log
);
// 1
// 2
// 4
// 3
// 9
// 10
//위의 수가 비동기적으로 연산된다
