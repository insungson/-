const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add, flatMap} = require('./chap9');

//## 지연된 함수열을 병렬적으로 평가하기 - C.reduce, C.take
//브라우저나 NODE.js 같은 환경에서는 비동기 IO로 동작하는데 비동기IO는 싱글스레드로 IO를 동기적으로 처리하기 보다는
//비동기적으로 처리해서 하나의 스레드에서 CPU작업을 효율적으로 분배한다
//자바스크립트가 기본적으로 싱글스레드 이기 때문에 병렬적인 작업은 없지만 실무에서는 종종 사용된다
//예를 들면 Node.js 에서 데이터베이스에 날리는 쿼리를 병렬적으로 출발시켜 한번에 쿼리를 얻거나,  
//REDIS 같은 Nosql 데이터베이스에서 여러개의 키로 여러개의 결과를 한번에 얻고자 할때  병렬적 작업이 필요하게 된다
//실제로 NODE.JS가 직접 해당하는 일을 처리하는것이 아니라 NETWORK이나 기타 IO로 해당작업을 보내고 대기한 상태에서
//데이터를 받는 시점들을 다루는 것을 NODE.JS가 하는것이기 때문에 어떤 처리들을 동시에 출발 시켰다가 하나의 로직으로 
//귀결시키는 병렬적인 처리를 하는 방법을 알아야 한다

const C = {};

function noop() {//이렇게 빈 함수에 catch를 하는 이유는 로그창에 아무것도 안뜨게 하기 위해서이다
}           //(로그창 에러제거목적)

//아래의 함수는 arr.forEach(a => a instanceof Promise ? a.catch(noop) : a) 로 임시처리 작업을 해주고
//, arr    뒤에 arr로 리턴해준다
const catchNoop = ([...arr]) => (arr.forEach(a => a instanceof Promise ? a.catch(noop) : a), arr);
//기존의 reduce()가 인풋값을 하나씩 처리했다면 
//...arr 로 reduce() 실행 이전의 함수들을 전부 비동기가 일어나지 않고 바로 다 실행을 시켜버린다  
//이후 reduce()를 통해 순회시키면서 값을 꺼낸다
//예를 들면 [1,2,3,4,5]의 인풋값이 있을 때 
//기존의 reduce()는 1에 대해 map,filter를 처리하고 reduce 처리하고, 2로 넘어가 같은 작업을 계속 한다면 
//병렬처리한 C.reduce()는 [1,2,3,4,5]를 전부 map, filter 처리하고
//(map에서 [1,2,3,4,5], filter에서 [1,2,3,4,5]를 처리)
//난 결과를 reduce 로 한번에 처리한다

//**여기서 a.catch(noop) 를 하지 않는다면 실행은 제대로 되지만 Promise.reject()발생시 에러로그가 뜬다
//**이부분을 임시로 a.catch(noop) 를 하려 처리한다 (콜스택 상의 에러처리)
//만약 위의 코드를 아래와 같이 catch() 한 값을 넘겨주게 된다면 
//var arr = arr.map(a => a instanceof Promise ? a.catch(noop) : a), arr
//이후 작업에서 catch()를 할 수 없기 때문에 결과값이 출력되지 않는다 
//(catch()를 해버리면 비동기 작업이 끝난것으로 인식하기 떄문이다)
//(map()은 [] 내부에 값을 할당하고 forEach()는 [] 내부를 순환하기 때문에 forEach()로 임시처리를 한다)



C.reduce = curry((f,acc,iter) => iter ? //함수f, 누적할값acc, 이터러블값iter를 인풋으로 받아서 
  reduce(f, acc, catchNoop(iter)) :           //iter가 2번째인자인지 3번째인자인지 골라서 넣어주면 된다
  reduce(f, catchNoop(acc)));
//위의것은 아래의 것을 간결하게 바꾼것이다
// C.reduce = curry((f, acc, iter) => {
//   const iter2 = catchNoop(iter ? [...iter] : [...acc]);  //이렇게 하면 L.reduce와 달리 ...iter 로서
//   return iter ?                                  //모든 인자를 실행하고 다음으로 넘어간다
//     reduce(f, acc, iter2) :  //reduce() 부분에서 삼항연산자를 없애기 위해 catchNoop()를 사용하면
//     reduce(f, iter2);        //{return } 객체 안에서 return 주는 부분도 없앨 수 있다
// }); 


C.take = curry((l,iter) => take(l, catchNoop(iter)));
//take도 마찬가지로 catch()를 임시처리해주는것으로 바꾼다
// C.take = curry((l,iter) => {
//   iter = catchNoop(...iter);   //iter를 catchNoop() 으로 병렬적 처리를(...iter) 하되 
//   return take(l,iter);         //임시에러처리로 에러도 안뜨게한다
// });


C.takeAll = C.take(Infinity); //기존의 take()에 계속 추가해주는 Infinity를 넣는다

C.map = curry(pipe(L.map, C.takeAll)); //기존의 L.map을 pipe로 위의 C.takeAll과 연결한다

C.filter = curry(pipe(L.filter, C.takeAll)); //기존의 L.filter을 pipe로 위의 C.takeAll과 연결한다

//이작업은 아래의 go() 함수안의 NODE.JS에서 이뤄지는것이 아니라 외부 환경으로 보내져서 병렬적으로 처리되는
//작업이고 C.reduce()로 한번에 작업하는게 부하가 아니라 효율적인 작업이라면 C.reduce()를 통해 한번에 처리할 수 있다 
const delay1000 = a => new Promise(resolve => {
 // console.log('hi~');
  setTimeout(() => resolve(a),1000);
});

console.time('');//go()를 실행하기 전에 시간 체크를 위한 코드
//아래의 코드가 9개의 값을 병렬적으로 처리한다고 가정하고 로직을 짜보자
go(
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  L.map(a => delay1000(a * a)),
  L.filter(a => delay1000(a % 2)),
  L.map(a => delay1000(a * a)),
//  C.take(2),  //[ 1, 81 ]
  C.reduce(add),  //9669
  log,
  _ => console.timeEnd('')
);
//C.reduce(), C.take()를 실행하기 전까지 L.map(), L.filter() 는 그냥 함수를 대기한 상태이므로 
//C.take(), C.reduce()를 주석처리하면 log()로 값을 찍을 수 없다(take(), reduce() 도 마찬가지)
//기존의 reduce()는 처음 입력값을 순차적으로 연산하지만.. 
//한번에 모아서 보낸후 처리하는 병렬적 작업을 C.reduce()를 통해 해보자

//Promise.reject()에 대한 처리는 나중에 .catch() 로 잡아내긴 하지만 
//Promise.reject()를 발생시킴과 동시에 로그에 에러메시지가 뜬다.
//이부분을 해결하기 위해선 catchNoop() 함수 내에서 임시로 catch() 작업을 해주면 된다

////////////////////////////////////////////////
//catch()를 임시로 작업해 두는것과 아닌것의 차이
//아래 같이 reject를 발생시킬때 아래와 같이 catch()를 해준다면
let a = Promise.reject('hi');
a = a.catch(a => a);
//아래와 같은 코드와 같은 것이다
let b = Promise.reject('hi').catch(a => a);
//즉! b라는 값 자체가 catch()까지 한 Promise 값이 되는것이다 
//이미 catch()가 되었기 때문에 이후 더이상 catch()를 할 수 없다
a.catch(a => log(a, 'catch')); //hi catch     처럼 여기서 catch()를 할 수 있다
//////////////////////////////////////////////////




//## 즉시 병렬적으로 평가하기 - C.map, C.filter
//map, filter 함수도 각각 함수가 병렬처리를 할 수 있도록 C.map, C.filter로 만들어보자
//위에서 C.map(), C.filter() 로직을 짜고 아래와 같이 실행하면 각 함수가 병렬처리하는것을 확인할 수 있다
//차이를 위해 그냥 map(), filter() 도 동작시켜보자
C.map(a => delay1000(a * a), [1,2,3,4]).then(log); //[ 1, 4, 9, 16 ]
C.filter(a => delay1000(a % 2), [1, 2, 3, 4]).then(log); //[ 1, 3 ]




// ## 즉시, 지연, Promise, 병렬적 조합하기
//모든 함수를 기본함수를 사용하여 정직하게 연산해도 되고(map(),filter(),take())
//원하는(혹은 모든) 함수를 지연적으로 처리하는 함수를 사용해서 연산해도 되고(L.map(), L.filter(), L.take())
//원하는(혹은 모든) 함수를 병렬적으로 처리하는 함수를 사용해서 연산해도 된다(C.map(), C.filter(), C.take())
//네트워크나 디비에 상황에 맞게 함수를 골라서 사용하면 되는것이다

const delay500 = (a, name) => new Promise(resolve => {
  console.log(`${name}: ${a}`);
  setTimeout(() => resolve(a), 100);
});

console.time('');
go([1, 2, 3, 4, 5, 6, 7, 8],
  L.map(a => delay500(a * a, 'map 1')),
  // map(a => delay500(a * a, 'map 1')),  
  L.filter(a => delay500(a % 2, 'filter 2')),
  // C.filter(a => delay500(a % 2, 'filter 2')),
  L.map(a => delay500(a + 1, 'map 3')),
  C.take(2),
  reduce(add),
  log,
  _ => console.timeEnd(''));