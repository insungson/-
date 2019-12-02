const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add} = require('./chap8');

//## go, pipe, reduce에서 비동기 제어 (프로미스 값을 통해서 비동기 제어)
//- chap8.js    에서 기존의 go() 함수와 reduce()함수에서 비동기처리가 가능하도록 바꿔보자

go(
  Promise.resolve(1),
  a => a+10,
  a => Promise.reject('error~~~'),
  a => console.log('-----'),
  a => a+1000,
  a => a+10000,
  log
  ).catch(a => console.log(a)); 
  //error~~~

  //reject() 에 대한 코드 처리는 여기서 catch() 로 잡아서 처리해준다
  //go(), pipe(), reduce() 는  프로미스 값을 다형적으로 처리해주기도 하고,
  //함수 합성에서도 프로미스 값을 안정적으로 합성을 시켜준다
  //이처럼 프로미스를 then().then() 처럼 콜백 지옥을 벗어난 용도 뿐 아니라 프로미스 값을 사용하여 
  //원하는 시점에 원하는 방식으로 적절한 고차함수를 만들 수 있다 (이것이 핵심이다)