const {log, curry, reduce, take, go, pipe, takeAll, add, find, range, L, filter, map} = require('./chap7');

//## L.flatten
// L.flatten 은 이중,삼중 배열이 한개의 배열로 지연성을 가지며 펼쳐지는 함수이다

log([...[1, 2], 3, 4, ...[5, 6], ...[7, 8, 9]]);
//[ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
//...배열    처럼 이중 배열을 풀어도 된다

const isIterable = a => a && a[Symbol.iterator];
//a를 받아서 a가 Symbol.iterator인지 확인하는 함수 

L.flatten = function* (iter){
  for(const a of iter){
    if(isIterable(a)) for(const b of a) yield b;
    else yield a;
  }
};

//지연성을 갖도록 만들었기 때문에 next() 로 출력한다
var it = L.flatten([[1, 2], 3, 4, [5, 6], [7, 8, 9]]);
log(it.next()); //{ value: 1, done: false }
log(it.next()); //{ value: 2, done: false }
log(it.next()); //{ value: 3, done: false }
log(it.next()); //{ value: 4, done: false }
log(take(6, L.flatten([[1, 2], 3, 4, [5, 6], [7, 8, 9]]))); //이렇게 take(6)을 줘서 6개만 즉시출력도 가능
//[ 1, 2, 3, 4, 5, 6 ]

//아래는 take(Infinity)를 사용하여 next() 없이 즉시 출력이 가능하도록 바꾸었다  
const flatten = pipe(L.flatten, takeAll);

log(flatten([[1, 2], 3, 4, [5, 6], [7, 8, 9]]));
//[ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]



//## yield *
//'yield*' 를 활용하면 위 코드를 아래와 같이 변경할 수 있다. 
//'yield* iterable' === 'for(const val of iterable) yield val;'   이다 
//아래의 코드 L.flatten1,  L.flatten2 를 벼교해보자
L.flatten1 = function* (iter){
  for(const a of iter){
    if(isIterable(a)) for(const b of a) yield b;
    else yield a;
  }
};

L.flatten2 = function* (iter){
  for(const a of iter){
    if(isIterable(a)) yield* a;
    else yield a;
  }
};



//## L.deepFlat
//만약 깊은 Iterable을 모두 펼치고 싶다면 아래와 같이 'L.deepFlat' 을 구현하여 사용하자
//`L.deepFlat`은 깊은 Iterable을 펼쳐준다

L.deepFlat = function* f(iter){
  for(const a of iter){
    if(isIterable(a)) yield* f(a); //재귀함수로 다시 실행시킨다
    else yield a;
  }
};

log([...L.deepFlat([1, [2, [3, 4], [[5]]]])]);
//[ 1, 2, 3, 4, 5 ]



//## L.flatMap
//Map, Flat 을 동시에 사용하는 함수이다(최신 자바스크립트에 있는 메서드이다)
//(자바스크립트가 기본적으로 지연적으로 작동하지 않기 때문에 만들어진 함수이다)

// //아래는 기존 자바스크립트에 내장된 함수를 사용할때이다
// log([[1, 2], [3, 4], [5, 6, 7]].flatMap(a => a)); 
// //[1,2,3,4,5,6,7]  처럼 그냥 펼쳐준다
// log([[1, 2], [3, 4], [5, 6, 7]].flatMap(a => a.map(a => a * a))); 
// //[1,4,9,16,25,36,49] map을 사용하여 처럼 내부에서 제곱이 되게 처리할 수도 있다
// log(flatten([[1, 2], [3, 4], [5, 6, 7]].map(a => a.map(a => a * a))));
// //[1,4,9,16,25,36,49]  동일한 값이 나오는데.. 기존의 배열에 map() 처리한것을 flatten() 매서드로 감싸면
// //flatMap()이 된다
// //flatMap()을 만든 이유는 위처럼 map(), flatten()을 사용시 비효율적이다 
// //이유는 map() 으로 배열을 만들고, flatten()으로 배열을 1차적으로 만들기 때문이다
// //flatMap()은 이 작업을 1번에 하기 때문에 효율적이다 (전체를 순회하지 않고 필요한 부분 설정히 그부분까지 추출)
// //(전체를 순회한다면 효율적으로 더 좋아지진 않지만 필요한 부분 설정시 좀 더 효율적임)
// log(flatten([[1, 2], [3, 4], [5, 6, 7]].map(a => a.map(a => a * a))));

L.flatMap = curry(pipe(L.map, L.flatten)); //평가를 한번 더 미룬 flatMap이다
//L.map 을 통해 자연적으로 안쪽에 있는 함수를 적용한 값을 지연적인 이터레이터로 만들어 리턴해주고
//L.flatten 을 통해 배열을 다 펴주기 때문에 pipe()로 연결했다

//const flatMap = pipe(L.flatMap, takeAll); //지연적인 platMap을 작동시키고 takeAll로 즉시동작
//const flatMap = curry(pipe(L.map, L.platMap, takeAll)); //지연적인 map, platMap 연결 후 takeAll로 즉시동작
const flatMap = curry(pipe(L.map, flatten)); // L.platMap, takeAll 과 그냥 flatten이 같기 때문에 이렇게 써도된다
//(위의 3개는 다 같다)

let it1 = L.flatMap(a => a, [[1, 2], [3, 4], [5, 6, 7]]);
log(...it1);  //이터러블로 되어있기 때문에 풀어야 값이 나온다
//1 2 3 4 5 6 7
log(it1);
//{}  

log(flatMap(a => a, [[1, 2], [3, 4], [5, 6, 7]]));
//[ 1, 2, 3, 4, 5, 6, 7 ]

log(flatMap(L.range, [1,2,3]));
//[ 0, 0, 1, 0, 1, 2 ]      처럼 배열의 내부인자 만큼 생성한 배열을 평면배열로 만들어준다
log(map(range, [1,2,3]));
//[ [ 0 ], [ 0, 1 ], [ 0, 1, 2 ] ]    처럼 평면처리를 하지않으면 2중 배열이 생성된다

log(flatMap(L.range, map(a => a+1, [1,2,3])));
//[ 0, 1, 0, 1, 2, 0, 1, 2, 3 ]    이렇게 배열의 갯수를 1씩 늘렸다




//## 2차원 배열 다루기

let arr = [
  [1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10]
];

go(
  arr,
  L.flatten,            //고차배열 -> 1차배열   로 만든다(지연적 처리)
  L.filter(a => a % 2), //지연적인 filter 적용
  L.map(a => a*a),      //지연적인 내부인자처리
  take(4),              //앞에서 4개만 가져옮
  reduce(add),          //
  log
);
//84



//##지연성 / 이터러블 중심 프로그래밍 실무적인 코드
//위의 L.filter, L.flatMap 등이 실제로 어떻게 활용되는지 아래의 코드를 통해 살펴보자

var users = [
  {
    name: 'a', age: 21, family: [
      {name: 'a1', age: 53}, {name: 'a2', age: 47},
      {name: 'a3', age: 16}, {name: 'a4', age: 15}
    ]
  },
  {
    name: 'b', age: 24, family: [
      {name: 'b1', age: 58}, {name: 'b2', age: 51},
      {name: 'b3', age: 19}, {name: 'b4', age: 22}
    ]
  },
  {
    name: 'c', age: 31, family: [
      {name: 'c1', age: 64}, {name: 'c2', age: 62}
    ]
  },
  {
    name: 'd', age: 20, family: [
      {name: 'd1', age: 42}, {name: 'd2', age: 42},
      {name: 'd3', age: 11}, {name: 'd4', age: 7}
    ]
  }
];


go(
  users,
  L.flatMap(u => u.family),   //해당 가족들 배열을 펼친다
  L.filter(u => u.age > 20),  //20세 넘는 객체만 뽑음   ex) {name:'d1', age:42}
  L.map(u => u.age),          //나이만 뽑음  ex) [42]
  take(4),                    //앞에서 4개만 뽑음
  reduce(add),                //총합을 구함
  log
);
//209

go(users, L.flatMap(u => u.family), takeAll, log); 
//가족들 명단만 가져온다 
//(앞에서 배운것처럼 map, filter는 출력을 하지 못한다  reduce, )

// [ { name: 'a1', age: 53 },
//   { name: 'a2', age: 47 },
//   { name: 'a3', age: 16 },
//   { name: 'a4', age: 15 },
//   { name: 'b1', age: 58 },
//   { name: 'b2', age: 51 },
//   { name: 'b3', age: 19 },
//   { name: 'b4', age: 22 },
//   { name: 'c1', age: 64 },
//   { name: 'c2', age: 62 },
//   { name: 'd1', age: 42 },
//   { name: 'd2', age: 42 },
//   { name: 'd3', age: 11 },
//   { name: 'd4', age: 7 } ]