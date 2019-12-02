const {log, map, filter, reduce} = require('./chap5');

//함수형 프로그래밍에서는 코드를 값으로 다루는 아이디어를 많이 사용한다. 코드를 값으로 다루기 때문에 어떤 함수가
//코드인 함수를 받아서 원하는 시점에서 값을 출력하게 다룰 수 있기 때문에 여러방식으로 표현할 수 있다.
const products = [
  {name: '반팔티', price: 15000},
  {name: '긴팔티', price: 20000},
  {name: '핸드폰케이스', price: 15000},
  {name: '후드티', price: 30000},
  {name: '바지', price: 25000}
];

const add = (a,b) => a + b;


//#코드를 값으로 다루어 표현력 높이기

//##go, pipe 함수 만들기
//해당 함수를 만들어보자
//go : 내부함수를 하나로 계속 합쳐준다 (초기값을 줘야한다) 앞의 함수를 뒤로 계속 넘긴다
//pipe : 내부함수를 하나로 계속 합쳐준다, go()에 넣어 앞의 함수를 뒤로 계속 넘긴다 (외부에서 인자를 준다 ...as부분)

const go = (...args) => {
  //log(...args,'hh');
  return reduce((a, f) => f(a), args);};    
//...args 로 리스트 안의 인자들만 가져온다
//reduce() 의 특성을 이용해 인자를 다음 함수에 넣는 함수를 만든다  (a,f) => f(a)
//args는 이터러블 으로 계속 다음 함수에 넣어 하나로 합친다
//args는 이런 구조이다 [ [product 이터러블 객체], [Function], [Function], [Function], [log] ]
//...args는 이런 구조이다 [product 이터러블 객체], [Function], [Function], [Function], [log]  전체배열이 아니다
//**결국 구조분해로 값만 넣고 reduce()로 실질적으로 합치는 것이다

//args를 로그로 찍어보면 아래와 이터러블로 나온다
// [ [ { name: '반팔티', price: 15000 },
//     { name: '긴팔티', price: 20000 },
//     { name: '핸드폰케이스', price: 15000 },
//     { name: '후드티', price: 30000 },
//     { name: '바지', price: 25000 } ],  //product 객체 이터러블
//   [Function],        //함수들도 [] 배열안에 있다
//   [Function],
//   [Function],
//   [Function: bound consoleCall] ] 'hh'
//
//...args를 로그로 찍어보면 
// [ { name: '반팔티', price: 15000 },
//   { name: '긴팔티', price: 20000 },
//   { name: '핸드폰케이스', price: 15000 },
//   { name: '후드티', price: 30000 },
//   { name: '바지', price: 25000 } ] [Function] [Function] [Function] [Function: bound consoleCall] 'hh'

const pipe1 = (f, ...fs) => (...as) => {log(as,fs,'d'); return go(f(...as), ...fs);};
//**[ 0, 1 ] [ [Function], [Function] ] 'd'  
//**위와 같이 찍고 실행해 보면 (...as) 는 pipe(함수들)(...as인자들) 라고 보면 된다
//**결국 go(첫함수(인자), ...값들)  ===  go(함수들)   인 것이다
//f : 첫번째 함수
//...fs : 나머지 함수들
//...as : pipe()함수 외부에서 줄 인자들

const pipe = (f, ...fs) => (...as) => go(f(...as), ...fs);
//const pipe = (f, ...fs) : pipe 함수 자체라고 생각하면 된다
//(...as) : pipe()함수 자체에 들어갈 인자라고 생각하면 된다
//go() : 함수로 앞의 함수를 뒤로 계속 넘겨준다
//나머진 구조분해를 통해 위처럼 조립하면 된다

//1) const pipe = () => () => {};  //이게 기본 형태이다
//  ...fs로 함수들을 받고, a로 시작하는 인자를 받아서, 위에서 만든 go()에 넣어서 인자를 함수들(...fs)에 넣어 
//  결과를 출력한다 (2번 내용)
//2) const pipe = (...fs) => (a) => go(a, ...fs);
//  pipe()에서 처음을 함수로 받고(f 로 표현),  그 안에서 인자를 2개(이상) 받고,(...as 로 표현가능), 
//  기존의 go() 를 활용하여 초기값을 다음 함수에 계속 넣어주는 형태가 된다면 아래와 같이 최종본이 완성된다(3번)
//3) const pipe = (f, ...fs) => (...as) => go(f(..as), ...fs);
//  하나씩 까보면 이렇다 처음에 const f = pipe(함수들)  은 const pipe = (f, ...fs) 와 같고
//  f(0,1)  은 (...as)  를 넣는것과 같다 이렇게 초기값과 함수를 go()에 넣어준다

go(
  add(0,1),
  a => a + 10,
  //log, //찍으면 11 나옴(앞에서 뒤로 넘긴다는의미)
  a => a + 20,
  log
  ); //31

const f = pipe(     //add 가 f 와 같고, 나머지 함수들이 ...fs와 같다
  add,
  a => a + 10,
  a => a + 20
);
log(f(0,1)); //31     (0,1) 이 ...as 와 같다

//아래는 기존의 reduce()를 사용한 코드이다
log(
  reduce(
    add,
    map(p => p.price, filter(p => p.price < 20000, products))
  )
);  //30000

//go() 를 이용해서 아래같이 바꿔보자
go(
  products,
  products => filter(p => p.price < 20000,products),
  products => map(p => p.price, products),
  prices => reduce(add,prices),
  log
);  //30000

/////////////////curry 개념 후 다시 보기////////////////////

//아래의 코드는 curry 부분을 참고하여 위의 코드를 줄여본 것이다
//chap4.js 에서 만든 filter, map, reduce 코드에 curry() 함수 만든것을 붙여서 만든 것이다
//그럼 기존의 인자를 하나만 받게되면 이후 인자를 더 받도록 기다리는 함수를 리턴되게 되어있다 
log('curry 적용 ------');

go(
  products,
  products => filter(a => a.price < 20000)(products),
  //(p => p.price < 20000) 함수를 먼저 받아서 함수가 되고, (products) 를 인자로 받아서 함수를 실행한다
  //이게 curry()방식이다
  products => map(p => p.price)(products),
  prices => reduce(add, prices),
  log
);  //30000

//products => filter(p => p.price < 20000)(product),
//에서 products를 받아서 filter(p => p.price < 20000) 함수에 그대로 (products) 를 인자로 전달한다는 의미는 
//filter(p => p.price < 20000) 이것만 사용한다는 것과 같은 의미이다
//즉!  products => filter(p => p.price < 20000)(products)  와 filter(p => p.price < 20000) 는 같은 코드이다
//그래서 currying을 통해서 아래와 같이 코드를 줄일 수 있다
go(
  products,
  filter(p => p.price < 20000),
  map(p => p.price),
  reduce(add),
  log
);  //30000


/////////////////////////////////////////////////////////////

//#curry
//- 함수를 받아서 함수를 리턴하고, 인자를 받아서 원하는 갯수만큼의 인자가 들어왔을때 받아두었던 함수에 
//  인자를 넣어 리턴한다

const curry = f => (a, ..._) => _.length ? f(a, ..._) : (..._) => f(a, ..._);
//f 함수를 받아서 
// (a, ..._) => _.length ? f(a, ,,,_) : (..._) => f(a, ..._);  함수를 리턴한다
// (a, ..._) 인자가 2개 이상이면,
// f(a, ..._) 로 받아둔 함수를 바로 실행하고,  만약 2개보다 작다면 
// (..._) => f(a, ..._);  함수를 다시 리턴한 후에 
// (..._) 그 인자들을 합쳐서 f(a, ..._) 함수를 실행하는 함수이다

//위의 함수를 아래같이 사용해보자
const mult = curry((a,b) => a * b);
log(mult); //(a, ..._) => _.length ? f(a, ..._) : (..._) => f(a, ..._); 
//log(mult(1,1)) //1   만약 인자가 2개라면 이렇게 1이 나온다
log(mult(1)); //(..._) => f(a, ..._);  인데 이 함수는 남은 인자들과 그 다음에 받을 인자를 앞의 함수에 넣게 되어있다
log(mult(1)(2)); //2    한번 더 인자를 넣으면 처음의 함수가 실행된다

const mult3 = mult(3); //이렇게 함수를 만들어주고, 아래처럼 이 함수를 다르게 사용할 수 있는 패턴이다
log(mult3(10)); //30
log(mult3(5));  //15
log(mult3(3));  //9

//chap5.js 에서 map, filter, reduce 함수에 curry를 붙인다
//(위로 올라가서 go()함수에 curry()을 적용시켜 코드를 바꿔보자)


//#함수 조합으로 함수 만들기
//기존의 함수 중복을 제거하는 리펙토링을 해보자
const total_price = pipe(
  map(p => p.price),
  reduce(add)
);
const base_total_price = predi => pipe(
  filter(predi), 
  total_price);

go(
  products,
  base_total_price(p => p.price < 20000),
  log); //30000
go(products,
  base_total_price(p => p.price >= 20000),
  log); //75000