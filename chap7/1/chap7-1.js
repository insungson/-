const {log, map, filter, reduce, curry, go, pipe} = require('./chap7');

//#range
//숫자 하나를 받고 그 숫자의 크기만한 배열을 리턴하는 함수이다

const add = (a, b) => a + b;

const range = l => {//길이 l 를 받고 
  let res = [];
  let i = -1;
  while(++i < l){
    //log(l, 'range');
    res.push(i);
  }
  return res;
};

let list = range(4);
log(list);  //[ 0, 1, 2, 3 ]
log(reduce(add,list));  //6     //list 의 배열을 다 더해준다


//# 느긋한 L.range
//제너레이터로 이터레이터를 만들어서 위와 같은 방식으로 표현함
const L = {};

L.range = function* (l){
  //log('hi~');
  let i = -1;
  while(++i < l){
    //log(i, 'L.range');
    yield i;
  }
};

let list1 = L.range(4);
// log(list1.next());
// // hi~
// // 0 'L.range'
// // { value: 0, done: false 
// log(list1.next());
// // 1 'L.range'
// // { value: 1, done: false }
// log(list1.next());
// // 2 'L.range'
// // { value: 2, done: false }
log('구분',list1,' 타입: ',typeof(list1)); //구분 {}
log('리듀스처리',reduce(add, list1));
//구분 {}  타입:  object
// hi~
// 0 'L.range'
// 1 'L.range'
// 2 'L.range'
// 3 'L.range'
// 리듀스처리 6

//첫번째 range() 는 배열로 반환되지만 
//두번째 L.range() 는 이터레이터로 반환된다 여기서 log를찍으면 로그값들이 안나온다
//(range() 는 내부적으로 next()를 통해 값을 가져오기 때문에 reduce의 결과 값이 같다)
//(주석처리한것처럼 list.next() 를 해줘야 입력코드들이 나온다)
//첫번째 range는 [] 배열을 만들고 reduce에 들어가서 다시 배열을 이터레이터로 만들고 값을 리턴을 하고
//두번째 L.range는 [] 배열을 만들지 않고 이터레이터 객체를 바로 하나씩 값을 꺼내서 리턴을 한다 (좀더 효율적이다)

//아래에서 test() 함수를 만들어서 range(), L.range()의 속도롤 비교해보자
//range() : 위에서 만든 배열 -> 이터레이터 -> 출력    
//L.range() : 이터레이터 -> 출력
function test(name, time, f){
  console.time(name);
  while(time--) f();
  console.timeEnd(name);
}
test('range', 10, () => reduce(add, range(10000)));
test('L.range', 10, () => reduce(add, L.range(10000)));
// range: 18.474ms
// L.range: 9.271ms


//#take
//- take는 이터러블 프로토콜을 따르고 이터러블 안의 값을 next를 통해 순회해서 꺼낸 후 
//  리미트로 정한 값까지만 push를 한다

const take = curry((l, iter) => {
  let res = [];
  for(const a of iter){
    res.push(a);
    if(res.length == l) return res;
  }
  return res;
});

//아래에서 range(배열을만든 후 reduce), L.range(이터러블객체 생성 후 reduce) 의 속도를 비교해보자
//range()는 10000의 공간의 배열을 만든 후(이터러블 작업 후) 5개의 값만 reduce를 진행하는 반면
//L.range()는 1000 개의 이터러블 작업 후 5개의 값만 reduce를 하기 때문에 훨씬 효율적이다
//(배열을 만드는 작업을 하지 않는다)
console.time('range');
go(
  range(10000),
  take(5),
  reduce(add),
  log
);
console.timeEnd('range');

console.time('L.range');
go(
  L.range(10000),
  take(5),
  reduce(add),
  log
);
console.timeEnd('L.range');

// 10
// range: 0.606ms
// 10
// L.range: 0.235ms
