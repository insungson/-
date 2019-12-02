const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, flatten, find, add, flatMap} = require('./chap10');



//## QnA. Array.prototype.map이 있는데 왜 FxJS의 map 함수가 필요한지?
function delayI(a){
  return new Promise(resolve => setTimeout(() => resolve(a),100));
}


// async function f2(){
//   const list = [1, 2, 3, 4];
//   let res = list.map(a => delayI(a * a)); 
//   log(res.reduce(add)); 
//   //[object Promise][object Promise][object Promise][object Promise]
//   //이렇게 []안의 값들을 더하려고 해도 promise 값이기 때문에 더할 수 없다 
//   //그래서 아래와 같이 map() 내부에서 async / await 처리를 해도
//   const temp = list.map(async a => await delayI(a * a));
//   log(temp);   
//   //[ Promise { <pending> }, Promise { <pending> }, Promise { <pending> }, Promise { <pending> } ]
//   // 위처럼 배열내부에서 각자 promise를 받는다
//   res = await temp; //그래서 f2() 함수에 async를 하고 temp 자체에 await를 해도
//   log(res);
//   //[ Promise { <pending> }, Promise { <pending> }, Promise { <pending> }, Promise { <pending> } ]
//   // 위처럼 배열 내부의 promise를 풀 수가 없다
// }
// //f2();
// //**결국 map() 함수 자체가 promise값을 제어해주지 못하기 때문에 아무리 async / await를 사용한다 해도 
// //비동기 상황을 제어할 수 없다 
// //일반적인 for문이나 if문을 사용할때는 async await로 비동기 상황 제어가 가능하지만... 함수가 promise를 
// //제어하지 못한다면 아무리 async await를 걸어도 비동기 제어가 되지 않는다! 



async function f3(){
  const list = [1,2,3,4];
  const temp = map(a => delayI(a * a), list); //앞에서 직접 구현한(promise처리한) map()이다
  log(temp); 
  //Promise { <pending> }    이것 역시 프로미스 값이 나오지만 이 프로미스는 [1,4,9,16] 를 가지고 있다
  const res1 = await temp;
  log(res1);
  //[ 1, 4, 9, 16 ] 
  //위에서 await를 걸어준다면 [1,4,9,16] 으로 제대로된 값이 나온다

}
f3();
//**즉!! await 는 promise 객체 내부의 값을 꺼내는 역할을 해준다!! 


//다른 예제를 보자
async function f4(){
  const list = [1,2,3,4,5];
  const res = await map(a => delayI(a * a), list);
  //log(res,'f4');
  //[ 1, 4, 9, 16, 25 ] 'f4'
  //위의 res는 프로미스 값이 풀어진 일반 자바스크립트 값이다  
  return res;
}
//기존의 배열을 프로미스값 처리가 가능한 map()에 넣어 계산이 된 프로미스 값을 불러왔고, 
//await를 통해 프로미스값을 처리해서 내부의 계산된 값을 log()로 찍을 수 있다

log(f4(),'외부 f4');
//Promise { <pending> } '외부 f4'
//**await로 프로미스값을 풀어줘도 async 함수는 무조건 프로미스값을 리턴하기 때문에 위와 같이 promise 객체가 나온다
f4().then(log);
//[ 1, 4, 9, 16, 25 ]   
//그래서 then()으로 받으면 제대로된 값이 나온다

(async () => {
  log('------');
  log(await f4());
})();
//[ 1, 4, 9, 16, 25 ]
//이렇게 프로미스값을 await로 벗겨서 로그를 찍고 async 함수를 즉시함수 처리하여 값을 나오게 만들 수 있다


async function f5(){
  const list = [1,2,3,4,5,6];
  const res = await map(a => delayI(a*a), list);
  return res;
}
log(f5());    //**await로 프로미스값을 풀어줘도 async 함수는 무조건 프로미스값을 리턴하기 때문이다
f5().then(log); //[ 1, 4, 9, 16, 25, 36 ]   //그래서 then()으로 받으면 제대로된 값이 나온다
(async () => {
  log(await f5(),'-');
})(); //[ 1, 4, 9, 16, 25, 36 ] '-'
//이렇게 프로미스값을 await로 벗겨서 로그를 찍고 async 함수를 즉시함수 처리하여 값을 나오게 만들 수도 있다



//await가 async 내부에 있든 말든 어차피 프로미스값으로 return 되기 때문에 아래같이 delayI()로 발생된 
//프로미스값을 리턴해주고.. 위의 방법처럼 즉시함수로 출력할 수도 있다
function f6(){
  return map(a => delayI(a*a), [1,2,3,4,5,6,7]);
}
(async () => {
  log(await f6());
})(); //[ 1, 4, 9, 16, 25, 36, 49 ]

