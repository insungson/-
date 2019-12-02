//##Map, Filter, Reduce
const log = console.log;

const products = [    
  {name: '반팔티', price: 15000},
  {name: '긴팔티', price: 20000},
  {name: '핸드폰케이스', price: 15000},
  {name: '후드티', price: 30000},
  {name: '바지', price: 25000}
];


//#Map
//map()을 배열을 이용하여, 이터러블 프로토콜을 이용하여 만들어보자

//그냥 이름만 뽑아보자
let names = [];
for(const a of products){
  names.push(a.name);
}
log(names); //[ '반팔티', '긴팔티', '핸드폰케이스', '후드티', '바지' ]
//가격도 마찬가지이다..

//이제 위의 코드를 일반 함수로 만들어보자
const map = (f, iter) => {
  let res = [];
  for(const a of iter){
    res.push(f(a)); //고차함수 활용
  }
  return res; //push한 배열을 보냄
};
log(map(p => p.name, products));
//[ '반팔티', '긴팔티', '핸드폰케이스', '후드티', '바지' ]
log(map(p => p.price, products));
//[ 15000, 20000, 15000, 30000, 25000 ]


//#이터러블 프로토콜을 따른 map의 다형성
//이터러블 프로토콜로 map()을 만들어보자

//기존의 map()은 아래같이 사용한다
log([1,2,3].map(a => a+1)); //[ 2, 3, 4 ]

// //**하지만!! document.querySelectorAll('*') 는 prototype에 map함수가 구현이 안되어 있기 때문에 map을
// //사용하면 에러가 발생한다
// log(map(el => el.nodeName, document.querySelectorAll('*')));

// //**웹 API인 document.querySelectorAll()은 이터러블 프로토콜을 따르기 때문에 아래와 같이 
// //[Symbol.iterator]() 를 실행하면 출력이 된다
// const it = document.querySelectorAll('*')[Symbol.iterator]();
// log(it.next());
// log(it.next());
// log(it.next());

function* gen(){  //제너레이터로 이터레이터를 만들고 map()을 적용시켜보자
  yield 2;
  if(false) yield 3;
  yield 4;
}
log(map(a => a * a, gen())); //[ 4, 16 ]

let m = new Map();
m.set('a', 10);
m.set('b', 20);

// //Map으로 생성된 객체는 이터러블이기 때문에 [Symbol.iterator]() 를 붙이면 특정 이터레이터를 리턴한다
// const it = m[Symbol.iterator]();
// log(it.next()); //{ value: [ 'a', 10 ], done: false }
// log(it.next()); //{ value: [ 'b', 20 ], done: false }
// log(it.next()); //{ value: undefined, done: true }

log(new Map(map(([k,v]) => [k, v * 2], m)));
//Map { 'a' => 20, 'b' => 40 }
//Map의 특성상 [key,value] 로 받기 때문에 그에 맞게 [k,v] 로 구조분해를 한 것을 위에서 만든 map()을 이용하여
//표현해준다



//#filter 
//filter()을 배열을 이용하여, 이터러블 프로토콜을 이용하여 만들어보자

//우선 filter 같은 코드를 만들어보자
let under2000 = [];
for(const p of products){
  if(p.price < 20000) under2000.push(p);
}
log(under2000);
// [ { name: '반팔티', price: 15000 },
//   { name: '핸드폰케이스', price: 15000 } ]
log(...under2000);
//{ name: '반팔티', price: 15000 } { name: '핸드폰케이스', price: 15000 }
//... 전개연산자를 사용하면 내부 값만 복사 가능하다

//배열이 기본이 되는 filter()를 만들어보자
const filter = (f,iter) => { //함수, 이터러블객체를 받아서
  let res = [];
  for(const a of iter){ 
    if(f(a)) res.push(a); //이터러블 값을 풀어서 함수에 넣고 맞으면 res 배열에 넣고 리턴한다
  }
  return res;
};
log(...filter(p => p.price < 20000, products)); //...로 얕은 복사를 해서 값만 가져온다
//{ name: '반팔티', price: 15000 } { name: '핸드폰케이스', price: 15000 }

log(filter(n => n % 2, [1,2,3,4])); //[ 1, 3 ]
log(filter(n => n % 2, function* (){
  yield 1;
  yield 2;
  yield 3;
  yield 4;
}()));
//[ 1, 3 ]


//#reduce
//reduce() 함수를 만들어보자

//일단 reduce()의 기본? 적인 덧셈 방법을 코드로 만들어보자
const nums = [1,2,3,4,5];
//배열 내부의 함을 구해보자
let total = 0;  //계속 누적시킬 값 (1)
for(const a of nums){ //이터러블 객체 (2)
  total = total + a;  //함수 (3)
}
log(total); //15

//(1)(2)(3) 세가지 요소를 활용하여 reduce()함수를 만들어보자
const reduce = (f, acc, iter) => {
  if(!iter){  //2개의 요소가 들어갈때 3개 요소로 만들어줌
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }
  for(const a of iter){
    acc = f(acc, a);  //누적값 = 함수(누적값, 이터러블_다음값)   으로 포괄적으로 적용시킨다
  }
  return acc; //누적값 리턴으로 밖으로 뺌
};
const add = (a,b) => a + b;  //덧셈함수 따로 만듬
log(reduce(add, 0, [1,2,3,4,5])); //15
log(reduce(add,[1,2,3,4,5])); //15

log(reduce(
  (total_price, product) => total_price + product.price,  //이렇게 acc = f(acc,a) 형식으로 넣으면 된다
  0, 
  products)); //105000