const {map, filter, reduce, curry, pipe, go, log} = require('./chap6');

const products = [
  {name: '반팔티', price: 15000, quantity: 1, is_selected: true}, //장바구니의 선택,미선택 부분
  {name: '긴팔티', price: 20000, quantity: 2, is_selected: false},
  {name: '핸드폰케이스', price: 15000, quantity: 3, is_selected: true},
  {name: '후드티', price: 30000, quantity: 4, is_selected: false},
  {name: '바지', price: 25000, quantity: 5, is_selected: false}
];

//chap6-2.html  에서 만든 함수의 과정을 적어본다

//먼저 상품의 수량을 뽑는 함수를 만들어보자
go(
  products,
  map(p => p.quantity),
  log
);  //[ 1, 2, 3, 4, 5 ]
//상품의 수량 총합을 구하는 함수를 만들어보자
go(
  products,
  map(p => p.quantity),
  reduce((a,b) => a + b),
  log
);  //15

//상품 수량을 뽑은 함수를 products 이터러블이 들어오면 
const total_quantity = products => go(
  products,
  map(p => p.quantity),
  reduce((a,b) => a + b),
  log
);
total_quantity(products); //15     처럼 값이 잘 나오는것을 확인할 수 있다
//위의 코드(total_quantity)에서 products를 go()에 넣는다는건 pipe()로 함수만 묶을 수도 있다는 뜻이다
//아래와 같이 함수만 묶어보자
const total_quantity1 = pipe(
  map(p => p.quantity),
  reduce((a,b) => a+b)
);
//이번에는 상품금액과 수량을 곱한 것을 더한 합산 금액을 계산해 보자
const total_price1 = pipe(
  map(p => p.quantity * p.price),
  reduce((a,b) => a+b)
);
log(total_price1(products)); //345000   총수량 * 금액 나옴

//total_quantity와 total_price에서 사용되는 reduce()안에 들어가는 코드가 동일하기 때문에 아래와 같이 만들고 
//코드르 줄여보자
const add = (a,b) => a + b;
const total_quantity2 = pipe(
  map(p => p.quantity),
  reduce(add));
const total_price2 = pipe(
  map(p => p.price * p.quantity),
  reduce(add));

//위의 코드를 더 줄여보자
//total_quantity2 와 total_price2 는 map() 내부의 함수를 제외하고 완전히 동일한 코드이다
//sum() 에 map() 에 들어갈 함수 f 를 넣고 이터러블 객체를 받을 iter를 go()에 넣어 합을 구하는 함수를 만들자
//이제 sum()함수를 만들때 필요한 인자는 f , iter 2개이다
const sum = (f, iter) => go(
  iter,
  map(f),
  reduce(add)
);
//sum() 을 사용해 총수량 함수를 만들어보자
log(sum(p => p.quantity, products));  //15
//총액수 함수를 만들어보자
log(sum(p => p.quantity * p.price, products)); //345000
//이제 total_quantity, total_price  함수를 만들어보자
const total_quantity3 = products => sum(p => p.quantity, products);
const total_price3 = products => sum(p => p.price * p.quantity, products);

//기존의 sum() 함수에 curry() 작업을 한 sum1() 함수를 만든다
const sum1 = curry((f,iter) => go(
  iter,
  map(f),
  reduce(add)
));
//아래와 같이 위의 total_quantity, total_price  함수를 바꿔보자
const total_quantity4 = products => sum1(p => p.quantity)(products);
//                        (1)                             (2)
//(1)에서 products를 받는 함수 sum(p => p.quantity) 이 리턴한 함수의 products를 전달하고만 있기 떄문에 
//products를 받는 products => sum(p => p.quantity)(products) 자리에  sum(p => p.quantity) 코드를 넣어도
//똑같이 동작한다는 의미이다
//그래서 아래와 같이 코드가 바뀐다
const total_quantity5 = sum1(p => p.quantity);
const total_price5 = sum1(p => p.quantity * p.price);

log('---------');
log(total_price5(products)); //345000
log(total_quantity5(products)); //15

//참고로 위에서 만든 sum1()은 아래같이 사용할 수 있다
log('한국나이 계산 ',sum1(u => u.age + 1)([
  {age:30},
  {age:20},
  {age:10},
]));
//한국나이 계산  63
