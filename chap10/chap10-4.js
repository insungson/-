const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, C, range, map, filter, flatten, find, add, flatMap} = require('./chap10');


function delayI(a){
  return new Promise(resolve => setTimeout(() => resolve(a),100));
}


//## QnA. 비동기 상황에서 에러 핸들링은 어떻게 해야하는지?
//아래와 같이 프로미스값(비동기적 상황)이 컨트롤 되지 않은 함수인 map(),filter(),slice() 를 사용하면
//에러가 발생해도 try catch 문에서 catch()문으로 에러를 잡지 못하는 일이 발생한다
//즉! map(), filter(), slice() 함수에서 비동기를 컨트롤 해야한다

// async function f8(list){
//   try {
//     return await list
//       .map(async a => await new Promise(resolve => {
//         resolve(JSON.parse(a));} //아래의 입력에서 잘못된 값이 들어가서 여기서 에러가 발생해도
//         ))
//       .filter(a => a % 2)
//       .slice(0, 2);
//   } catch (error) {             //catch 에서 위에서 발생한 에러를 잡지 못한다
//     log(e, '--------------------');
//     return [];
//   }
// }
// f8(['0', '1', '2', '{']).then(log).catch(e => { //여기서도 에러를 잡지 못한다
//   log('에러를 헨들링 하겠다');
// });
// //[]
// //(node:15004) UnhandledPromiseRejectionWarning: SyntaxError: Unexpected end of JSON input

//list.map().filter().slice() 가 [promise,promise,promise,promise] 를  리턴하므로 
//프로미스값이 아닌 배열([])에 await를 걸어도 의미가 없는 것이다
//그렇기 때문에 에러가 발생해도 f8() 내부의 catch문에 걸리지 않는 것이고,
//async function f8(){return 프로미스객체}   처럼 f8() 함수 자체에 async가 걸렸는데 
//기존의 map(), filter(), slice()가 프로미스 값을 처리못해서 
//[promise,promise,promise,promise] 를  리턴하므로 async f8() 에대한 에러가
//f8().then().catch();   에서도  안걸리는 것이다





//## QnA. 동기/비동기 에러 핸들링에서의 파이프라인의 이점은?

async function f9(list){
  try {
    return await go(  //go() 의 리턴값이 promise 값이 되어야 await를 통해 내부값이 밖으로 나오고 
      list,           //내부값이 에러가 발생한다면 아래의 catch() 로 잡을 수 있다
      map(a => new Promise(resolve => {
        resolve(JSON.parse(a));
      })),
      filter(a => a % 2),
      take(2)
    );
  } catch (error) {         //위에서 에러가 발생해도 여기서 에러를 잡지 못한다
    log(e, '----------');   //** 즉!! try문 내부에서 에러가 발생해야 catch로 잡을 수 있다
    return [];              //예를 들면 try문 내부를 이렇게 고치면 try{await promise.reject('~~')} 
  }                         //여기서의 catch에서 에러를 잡을 수 있다!
}
f9(['0', '1', '2', '3', '4', '{']).then(a => log(a, 'f9')).catch(e => {
  log('에러를 헨들링 하겠다', e);
});
// 에러를 헨들링 하겠다 ReferenceError: e is not defined


//f9()에 걸린 async 함수의 에러는 
//f9().then().catch();  에서 catch()로 잡아준다
//그리고 프로미스값에 대한 처리가 된 map(),filter(),take() 에 의해 promise 가 리턴되기 때문에
//await 프로미스값 으로 프로미스값 의 내부값을 밖으로 뺄수 있어 f9() 내부의 try catch문에 걸리는것이다

//재밌는점은 위의 map() -> L.map(), filter() -> L.filter() 으로 바꾸면 지연적으로 2개만 처리하기 
//때문에 에러가 발생하지 않는다
//[ 1, 3 ] 'f9'   이렇게 값이 나옴