const {log, curry, go, pipe, L} = require('./chap7');

//#이터러블 중심 프로그래밍에서 지연평가 (Lazy Evaluation)
//- 자바스크립트에서 제너레이터 이터러블 프로그래밍을 할 때 지연성에 대한 효율을 알아보자
//1) 제때 계산법
//   - 가장 필요할때까지 평가를 미루다가 정말 필요할 때 해당하는 코드들을 평가하여 값들을 만들어낸다
//2) 느긋한 계산법
//3) 제너레이터 / 이터레이터 프로토콜을 기반으로 구현


//##L.map
//- 지연성을 가진 L.map에 대해 구현해보자
L.map1 = function*(f, iter){
  for(const a of iter) yield f(a);
  //이터러블 객체를 제너레이터 yield를 통해 그대로 꺼낸 후 사용자함수에 넣음
};
let it1 = L.map1(a => a + 10, [1,2,3]);
log(it1.next());
log(it1.next());
log(it1.next());
// { value: 11, done: false }
// { value: 12, done: false }
// { value: 13, done: false }

//L.map() 에서는 배열을 따로 만드는게 아니라 제너레이터를 통한 이터레이터 작업까지만 해준것이다.
//log([it1.next().value]);  //를 통해 원하는 값의 value만 넣는 배열을 만들 수 있고
//log([...it1]); //[ 11, 12, 13 ]  //을 통해서 배열을 만들 수 있다



//## L.filter
//- 제너레이터 함수를 통해 L.filter를 만들어보자

L.filter = function*(f, iter){
  for(const a of iter){
    if(f(a)) yield a;
    //조건문을 넣어 사용자함수에 이터러블 요소를 넣어 있을때만 yield처리
  }
};
let it2 = L.filter(a => a % 2, [1,2,3,4]);
log('L.filter()------');
log(it2.next());
log(it2.next());
log(it2.next());
// { value: 1, done: false }
// { value: 3, done: false }
// { value: undefined, done: true }



//## range, map, filter, take, reduce 중첩 사용
//앞에서 만든 함수들을 [] 배열이 아닌 이터레이터를 사용해서 바꿔보자 (지연성을 가진 L 시리즈 만들기 전 중간단계)
const range = l => {
  let i = -1;
  let res = [];
  while(++i < l){
    res.push(i);
  }
  return res;
};

const map = curry((f, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();//이터레이터에 [Symbol.iterator]() 를 실행하여 이터러블로 만들고
  let cur;    //현재 루프를 돌면서 저장할 임시 변수를 설정하고 
  while(!(cur = iter.next()).done){//while 문을 사용하여 이터레이터 객체의 특성을 사용하여 적용시킨다
    const a = cur.value;        //여기까지가 for(a of iter)  와 같은 코드이다
    res.push(a);
  }
  return res;
});

const filter = curry((f, iter) => {
  let res =[];
  iter = iter[Symbol.iterator](); //임시저장이 아닌 이터러블로 만들기 위해 적용된 값을 변수에 넣어준다
  let cur;
  while(!(cur = iter.next()).done){
    const a  = cur.value;
    if(f(a)) res.push(a);
  }
  return res;
});

const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  let cur;
  while(!(cur = iter.next()).done){
    const a = cur.value;
    res.push(a);
    if(res.length == l) return res;
  }
  return res;
});

const reduce = curry((f, acc, iter) => {
  if(!iter){
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }else{
    iter = iter[Symbol.iterator]();
  }
  let cur;
  while(!(cur = iter.next()).done){
    const a = cur.value;
    acc = f(acc, a);
  }
  return acc;
});

console.time('tes');
go(
  range(100000),
  map(n => n + 10),
  filter(n => n % 2),
  take(10),
  log
);
console.timeEnd('tes');
//[ 1, 3, 5, 7, 9, 11, 13, 15, 17, 19 ]
//tes: 18.965ms



//## L.range, L.map, L.filter, take, reduce 중첩 사용
//- 앞에서 제너레이터 이터레이터의 특성을 이용해 만든 함수들을 좀더 구체적으로 바꿔보자
//- 아래 함수들의 실행 순서를 파악하기 위해 각 함수의 주요 포인트에 브레이크를 걸고 실행을 해보자
L.range = function* (l){
  let i = -1;
  while(++i < l) yield i;
};
L.map = curry(function* (f, iter){
  iter = iter[Symbol.iterator]();
  let cur;
  while(!(cur = iter.next()).done){
    const a = cur.value;
    yield f(a);
  }
});
L.filter = curry(function* (f, iter){
  iter = iter[Symbol.iterator]();
  let cur;
  while(!(cur = iter.next()).done){
    const a = cur.value;
    if(f(a)) yield a;
  }
});
//배열로 만든 range코드가 아래와 같이 
// [0, 1, 2, 3, 4, 5, 6, 7, 8...]  전체 배열을 만들고 
// [10, 11, 12, ...]   map을 통해 전체 배열에 사용자함수(+10)를 적용시키고
// [11, 13, 15 ..]     filter를 통해 전체 배열에 적용시키고
// [11, 13]            거기서 필요한 배열만 뽑는다
//
//제너레이터 이터레이터의 range 코드는 아래와 같이 
// [0    [1     첫번째 인자를(0) take -> filter -> map -> range로 인자를 받고
// 10     11    map을 통해 받은 첫번째 인자만 사용자함수(+10)을 적용시키고
// false]  true] filter를 통해 맞는지 틀린지 확인후 추가시킨다
//              그리고 두번째인자 (1)을  take -> filter -> map -> range로 인자를 받고
//              map을 통해 받은 첫번째 인자만 사용자함수(+10)을 적용시키고
//              filter를 통해 맞는지 틀린지 확인후 추가시킨다

//아래의 코드를 보면 take함수가 가장 먼저 실행된다
//take -> filter -> map -> L.range 이렇게 실행이 되는데 이유는 평가를 미뤄두고 next()를 실행하면서 
//관련 이터레이터를 불러오기 위해 위처럼 실행되는 것이다
//take에서 cur = iter.next()).done 의 iter를 가져오기 위해 filter로 넘어가고, 
//filter에서 cur = iter.next()).done 의 iter를 가져오기 위해 map으로 넘어가고,
//map에서 cur = iter.next()).done 의 iter를 가져오기 위해 range로 넘어가게 되는 것이다
//range에서 while문안의 yield i; 에서 next() 를 통해 얻고자 하는 값이 나왔기 때문에 
//다시 map -> filter -> take 로 가서 실행하는 것이다
//이처럼 배열로 만들어진것과 제너레이터 이터레이터를 통해 만들어지는 것에는 
//처음부터 배열을 만들고 map -> filter -> take를 만든 배열 방식
//필요한 값을 정해놓고 그걸 가져와 사용하는 제너레이터 이터레이터 방법이 있다
//물론 연산은 필요한 값을 가져다 쓰면 그만큼 적은 범위를 연산하는 제너레이터 이터레이터 함수가 성능이 좋다
console.time('L');
go(
  L.range(Infinity),
  L.map(n => n + 10),
  L.filter(n => n % 2),
  take(10),
  log
);
console.timeEnd('L');
// [ 11, 13, 15, 17, 19, 21, 23, 25, 27, 29 ]
// L: 0.575ms




//### map, filter 계열 함수들이 가지는 결합 법칙 (순서를 바꿔도 결과는 항상 같다)
//- 사용하는 데이터가 무었이든지
//- 사용하는 보조 함수가 순수 함수라면 무었이든지 (n => n + 2 같은 순수 함수)
//- 아래와 같이 결합한다면 둘 다 결과가 같다.

// [[mapping, mapping], [filtering, filtering], [mapping, mapping]] //가로순서를
// [[mapping, filtering, mapping], [mapping, filtering, mapping]] //세로순서로 바꿔도 결과값은 같다




//## 결과를 만드는 함수 reduce, take
//- map, filter는 배열이나 이터러블한 값 안에 있는 원소들에게 함수들을 합성해주는 역할을 한다면 
//  reduce, take 같은 함수들은 이터러블이나 배열같이 안쪽에 있는 값들을 꺼내서 더하거나, 하는 식으로
//  배열, 이터레이터 한 형태를 유지시키는게 아닌 그 안의 값을 꺼내거나 깨트리면서 결과를 도출하는 역할을 한다
//  그래서 map, filter 같은 함수들은 지연성을 가질 수 없다고 볼 수 있고, reduce 같은 함수는 연산을 시작하는 
//  시작점을 알리는 함수라고 할 수 있다
//
//즉! 함수들을 만들때 map,filter 같은 계열의 함수를 반복해서 사용하다가 특정 지점에서 reduce 같은 함수를 통해서
//그 안의 값을 꺼내 깨트리면서 연산을 시작하거나, 그 다음 로직을 만드는 식으로 함수를 만들어 나가면 된다
//
//함수형 프로그래밍을 만들기전에 a로부터 b라는 값을 만들려고 할 때 a를 받아서 map,filter를 반복하다가 
//어떠한 reduce로 최종적으로 값을 만들어서 return 하겠다 는식으로 사고하면서 함수를 만들면 좋다
//



//## reduce
//- 객체로부터 url의 queryString 을 만드는 부분을 만들어보자(map, filter 를 사용하는 법을 알아보자)
//- 아래에서 join() 은 reduce() 를 통해 만들었고,
//- Object.entries() 는 map()을 통해 만들었다

const queryStr1 = obj => go(
  obj,
  Object.entries,
  map(([k,v]) => `${k} = ${v}`),
  reduce((a,b) => `${a} & ${b}`),
);
log(queryStr1({limit: 10, offset: 10, type: 'notice'}));
//limit,10 & offset,10 & type,notice

//pipe() 를 써서 더 간소화 시켜보자
const queryStr2 = pipe(
  Object.entries,
  map(([k,v]) => `${k}=${v}`),
  reduce((a,b) => `${a} & ${b}`) //이부분은 join() 함수와 비슷한 역할을 한다
);
log(queryStr2({limit: 10, offset: 10, type: 'notice'}));
//limit,10 & offset,10 & type,notice

//reduce를 통해 join() 을 만들어보자 
const join = curry((sep = '=', iter) => reduce((a,b) => `${a}${sep}${b}`, iter));
//(기존의 자바스크립트는     배열.join()  처럼 배열 뒤에 붙여서 사용한다)
log([1,2,3,4].join('-'));
//1-2-3-4
//(만든것을 사용)
log(join('_',[1,2,3,4]));
//1 _ 2 _ 3 _ 4

////Object.entries를 제너레이터 이터레이터로 만들어보자
L.entries = function* (obj){
  for(const k in obj) yield [k, obj[k]];
  //for in 은 이터러블 객체의 키만 뽑아낸다
  //[key, value] 형태를 이렇게 만들었다
};

const queryStr = pipe(
  L.entries,
  L.map(([k,v]) => `${k}=${v}`),//entries에서 나눈 key,value값을 구조분해로 문자열로 만든다    
  //이터러블 프로토콜을 통해 만들었기 때문에 join()에 가기전까지 지연성이 확보된다
  //지연성 : 앞에서 설명한것처럼 배열을 다 만들고 연산하지 않고, 연산을 미루고 필요한 만큼만 불러와서 
  //        연산을 처리하는것 (속도가 빠르다)
  join(' & ')
);

log(queryStr({limit: 10, offset: 10, type: 'notice'}));
//limit=10 & offset=10 & type=notice

//위에서 만든 join()은 이터러블, 배열 전부 적용이 가능하다 
function* a(){
  yield 10;
  yield 11;
  yield 12;
  yield 13;
}
//log(a().join('_')); //기존의 join()은 이터러블을 적용할 수 없다
log(join('_',a()));
//10_11_12_13



//## take, find
//find는 take를 사용해서 만들수 있다

const users = [
  {age: 32},
  {age: 31},
  {age: 37},
  {age: 28},
  {age: 25},
  {age: 32},
  {age: 31},
  {age: 37}
];

const find = curry((f, iter) =>//currying을 통해 
  go(  
    iter,
    L.filter(f),
    //기존의 filter(f) 를 사용하면 []배열을 전부 만들고 수행을 하는데 L.filter로 수행하면 필요한부분만 추출함
    take(1),
    //하나의 값만 꺼내므로 take() 를 통해 1개만 선택한다
    ([s]) => s
    //리턴의 부분으로 [] 배열을 깨서 리턴해준다 (구조분해해서 출력)
  )
);

log(find(a => a.age < 30, users));
//{ age: 28 }

//아래와 같이 사용할 수도 있다
go(
  users,
  L.map(a => a.age),
  find(a => a < 30),
  log
);
//28