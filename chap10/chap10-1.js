const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, flatten, find, add, flatMap} = require('./chap10');

//## async/await
//- **Promise 를  리턴하는 함수가 있다면, 그 함수를 동기적으로 사용할 수 있게 만드는 문법이다.

//라이브러리가 Promise 값을 리턴한다면 async await 를 바로 사용할 수 있지만....
//개발자가 프로미스를 다뤄서 리턴한다거나 프로미스를 값으로 다루면서 평가시점을 정한다고 할때 프로미스를 직접적으로 
//다룰 수 있어야 한다

function delay(time){
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

//아래와 같이 함수 앞에 async를 붙이고 내부에 await를 붙임 
async function delayIdentity(a) {
  await delay(500); //delay 프로미스 함수가 실행하고(시간지연) 입력한 a값이 그대로 리턴된다
  return a;
}
delayIdentity('yo').then(log); 
//yo

//아래의 함수만 보면 프로미스리턴해야 await를 통와는 연관이 없는것처럼 보이지만... 
//await에는 반드시 프로미스를 리턴해야 결과를 기다려서 해당값을 인자에 넣을 수 있다
async function f1(){
  const a = await delayIdentity(10);
  const b = await delayIdentity(5);
  return a+b;
}
log(f1()); //Promise { <pending> }
//**잘알아둬야 하는것이 async의 리턴값은 무조건 프로미스값이므로 위와 같이 프로미스값이 리턴된다
// 심지어 아래와 같이 a,b 가 프로미스값을 리턴하지 않더라도 함수 앞에 async를 선언한다면 await가 없더라도 
// promise 값이 리턴된다
async function f2(){
  const a = 10;
  const b = 5;
  return a + b;
}
log(f2()); //Promise { 15 }
//위와 같이 await가 없지만 리턴은 프로미스로 된다 

//아래처럼 즉시호출함수로 밖으로 뺄 수 있다
(async ()=>{
  log(await f2());  //15
  log(f2());  //Promise { 15 }
})();
//** 즉! 프로미스 값은 await로 리턴받는다면 잠시 묵혀뒀다가 
//1) 함수의 외부에서 .then() 으로 받아 출력할 수 있고
//2) () 즉시 실행으로 내부에서도 (동기적으로) 출력할 수 있다
//(await를 사용하면 동기적으로 함수 내부에서 프로미스 값을 합성할 수 있다)
//합성한 값은 외부에서 then()으로 받는다


//아래와 같이 프로미스 값을 만들고
log('=====promise======');
const pa = Promise.resolve(10);
(async () => {
  log(pa);
  log(await pa);  //10
  log(await pa);  //10
  log(await pa);  //10
})();

log('---f---')
f1();
f1().then(log);
go(f2(), log);





//## QnA. Array.prototype.map이 있는데 왜 FxJS의 map 함수가 필요한지?
function delayI(a){
  return new Promise(resolve => setTimeout(() => resolve(a),100));
}

async function f2(){
  const list = [1, 2, 3, 4];
  let res = list.map(a => delayI(a * a)); 
  log(res.reduce(add)); 
  //[object Promise][object Promise][object Promise][object Promise]
  //이렇게 []안의 값들을 더하려고 해도 promise 값이기 때문에 더할 수 없다 
  //그래서 아래와 같이 map() 내부에서 async / await 처리를 해도
  const temp = list.map(async a => await delayI(a * a));
  log(temp);   
  //[ Promise { <pending> }, Promise { <pending> }, Promise { <pending> }, Promise { <pending> } ]
  // 위처럼 배열내부에서 각자 promise를 받는다
  res = await temp; //그래서 f2() 함수에 async를 하고 temp 자체에 await를 해도
  log(res);
  //[ Promise { <pending> }, Promise { <pending> }, Promise { <pending> }, Promise { <pending> } ]
  // 위처럼 배열 내부의 promise를 풀 수가 없다
}
//f2();
//**결국 map() 함수 자체가 promise값을 제어해주지 못하기 때문에 아무리 async / await를 사용한다 해도 
//비동기 상황을 제어할 수 없다 
//일반적인 for문이나 if문을 사용할때는 async await로 비동기 상황 제어가 가능하지만... 함수가 promise를 
//제어하지 못한다면 아무리 async await를 걸어도 비동기 제어가 되지 않는다! 


// async function f3(){
//   const list = [1,2,3,4];
//   const temp = map(a => delayI(a * a), list); //앞에서 직접 구현한(promise처리한) map()이다
//   log(temp); //Promise    이것 역시 프로미스 값이 나오지만 이 프로미스는 [1,4,9,16] 를 가지고 있다
//   const res1 = await temp;
//   log(res1);
// }
// f3();
// //**즉!! await 는 promise 객체 내부의 값을 꺼내는 역할을 해준다!! 
