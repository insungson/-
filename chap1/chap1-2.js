const log = console.log;
//#일급함수
//- 함수가 값으로 다뤄질 수 있다

//#고차함수
//- 함수를 값으로 다루는 함수

//#함수를 인자로 받아서 실행하는 함수
//- apply1
//- times
const apply1 = f => f(1);
const add2 = a => a + 2;
log(apply1(add2));  //3
log(apply1(a => a - 1));  //0

const times = (f, n) => {
  let i = -1;
  while(++i < n) f(i);
};
times(log,3);
// 0
// 1
// 2
times(a => log(a+10),3);
// 10
// 11
// 12

//#함수를 만들어 리턴하는 함수(클로저를 만들어 리턴하는 함수)
//- addmaker
const addmaker = a => b => a + b;
const add10 = addmaker(10);
log(add10(5));  //15
log(add10(10)); //20
//b => a + b 는 함수이자 a를 기억하는 클로저이다
//**클로저는 b => a + b 함수가 만들어질때의 환경인 a와 b => a + b 함수 자체의 객체를 통칭해서 말하는 용어이다
//addmaker는 클로저를 리턴하는 함수이다
