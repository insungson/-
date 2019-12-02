const log = console.log;

//# 제너레이터 / 이터레이터
//- 제너레이터 : 이터레이터이자 이터러블을 생성하는 함수(제너레이터를 실행한 결과는 이터레이터이다!)
//- 제너레이터는 잘 만들어진(well formed)이터레이터를 리턴하는 함수이다
function* gen(){  //여기서 만든 제너레이터를 
  yield 1;
  if(false) yield 2; //이렇게 조건을 넣어서 순회하는것을 뺄수도 있다
  yield 3;
}
let iter = gen(); 
//**iter에 만든 제너레이터를 넣고 아래에서 비교해보면 [Symbol.iterator]() 을 사용안해도 잘 처리되는것을 
//확인할 수 있다 (true값 나옴)
log(iter[Symbol.iterator]() == iter); //true
log(iter.next()); //{ value: 1, done: false }
log(iter.next()); //{ value: 3, done: false }
log(iter.next()); //{ value: undefined, done: true }
log(iter.next()); //{ value: undefined, done: true }

for(const a of gen())log(a);
// 1
// 3


//#odd 
//- 홀수만 출력하는 이터러블을 제너레이터를 통해 만들어보자
//우선 for문을 사용하여 만들어보자
function* odd1(s){
  for(let i = 0; i < s; i++){
    if(i % 2) yield i;
  }
}
let itexam = odd1(10);
log(itexam.next()); //{ value: 1, done: false }
log(itexam.next()); //{ value: 3, done: false }

//위의 방식을 쪼개서 아래와 같이 제너레이터를 만들어보자
function* infinity(i = 0){ //default 가 0이고 값을 넣으면 그 값이 된다
  while(true) yield i++;
}
function* limit(l, iter){
  for(const a of iter){
    yield a;
    if(a === l) return;
  }
}
function* odd2(l){
  for(const a of limit(l,infinity(1))){
    if(a % 2) yield a;
  }
}
let iter2 = odd2(10);
log(iter2.next()); //{ value: 1, done: false }
log(iter2.next()); //{ value: 3, done: false }
log(iter2.next()); //{ value: 5, done: false }
log(iter2.next()); //{ value: 7, done: false }
log(iter2.next()); //{ value: 9, done: false }

for(const a of odd2(40)) log(a);


//#for of, 전개연산자, 구조분해, 나머지연산자 
//- 제너레이터는 이터러블을 사용하고 있는 함수들을 쉽게 만들어준다

//전개연산자 사용
log(...odd2(10)); //1 3 5 7 9
log([...odd2(10), ...odd2(20)]); //[ 1, 3, 5, 7, 9, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19 ]

//구조분해 사용
const [head, ...tail] = odd2(5);
log(head);  //1
log(tail);  //[ 3, 5 ]

//나머지 연산자 사용
const [a,b, ...rest] = odd2(10);
log(a); //1
log(b); //3
log(rest);  //[ 5, 7, 9 ]