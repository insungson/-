const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, C, range, map, filter, flatten, find, add, flatMap} = require('./chap10');


function delayI(a){
  return new Promise(resolve => setTimeout(() => resolve(a),100));
}


//## QnA. 최신자바스크립트에서 비동기는 async/await로 제어할 수 있는데 왜 파이프라인(체인연결)이 필요한지?
//파이프라인,체인연결과   async/await 는 서로 다른 문제를 해결하기 위한 기술이다
//파이프라인은 함수를 합성하기위해, async/await는 then().then() 체인을 문장형으로 풀어내기위해 만든 함수이다

//파이프라인은(아래의 f5() 함수처럼 이터러블 중심으로 함수들을 연결하고 사고하는 방식)
//비동기 프로그래밍이 아니라!! 명령형 프로그래밍을 하지 않고, 더 안전하게 함수를 합성하는것이 목적이다
//비동기 상황이냐 동기 상황이냐에 대한 관심을 갖기 보단 어떤 코드를 리스트로 다루면서 연속적인 함수 실행과
//함수 합성을 통해서 더 효과적으로 함수들을 조합하고 로직을 테스트하기 쉽고 유지보수 하기 쉽게 만드는데 목적이 있다

//async/await는 
//원래 표현식으로 갇혀있는 (이런 방식 promise.then().then().then()) 식으로 로직을 작성하는게 
//어렵다보니 문장으로 다루기 위해서 async 함수와 await 키워드를 통해서 특정 부분에서 함수체인이 아니라 
//문장형으로 다루기 위한 목적을 가지고 있다
//비동기 상황을 동기적인 문장으로 풀어서 코딩을 하고 싶을때 사용하는 기법이다


//아래의 f5() 함수는 비동기적 상황 delayI()이 모든 함수에서 일어나고 있다
//하지만 동기적으로 async await 라든지.. promise.then(), callback 함수등이 보이지 않기 때문에 
//동기적으로 코드가 표현이 되었고.. 실제로도 그렇게 사용을 할 수 있는 상태이다
function f5(list){
  return go(
    list,
    L.map(a => delayI(a*a)),
    L.filter(a => delayI(a%2)),
    L.map(a => delayI(a + 1)),
    C.take(2),
    reduce((a,b) => delayI(a+b))
  );
}
go(f5([1,2,3,4,5,6,7,8]), a => log(a));
//12
//하지만!! 이코드의 주목적은 async await를 없애기 위한 코드가 아니라 
//복잡한 for(), if()문을 간단하게 해결하기 위한 코드이다


//f6()에서 위의 코드를 파이프라인이 아닌 async await로 만들어보자
async function f6(list) { //리스트를 받고
  let temp = [];
  for(const a of list){ //리스트를 for()문으로 순회시킨다
    const b = await delayI(a * a);
    //리스트의 요소를 비동기처리하고 await로 비동기적 상황을 풀어서(promise값을 풀어서) 변수 b에 할당한다
    if(await delayI(b % 2)){//역시 이곳도 await로 비동기적 값을 풀어서(promise값을 풀어서) if문을 사용한다
      const c = await delayI(b + 1);//여기도 await로 +1한 비동기적 값을 풀어서 변수 c에 할당한다
      temp.push(c); //push()로 temp에 값을 넣는다
      if(temp.length == 2) break;  //take() 처리
    }
  }
  let res = temp[0], i = 0; //reduce() 처리 
  while(++i < temp.length){
    res = await delayI(res + temp[i]);
  }
  return res;
}
go(f6([1, 2, 3, 4, 5, 6, 7, 8]),log);
//12

//만약 delayI() 함수에서 프로미스값이 아닌 입력값 a를 리턴한다면 
//f5()는 문제없지 작동하지만
//f6()은 프로미스값이 출력된다(async 함수는 비동기방식을(프로미스값) 리턴하기 때문이다) 
//(그리고 f5()처럼 내부 함수에서 promise()값을 제어해주지 않기 때문이다)

//f5(), f6()는 해결점이 다르다
//f5()는 각 상황별로 함수를 만들고 테스트를 했기 때문에 유지보수가 쉽다.
//f6()은 문장으로 풀어썻기 때문에 추후 유지보수나 테스트가 어렵다.




//## QnA. async/await와 파이프라인을 같이 사용하기도 하나요?

async function f52(list){
  const r1 = await go(
    list,
    L.map(a => delayI(a * a)),
    L.filter(a => delayI(a % 2)),
    L.map(a => delayI(a + 1)),
    C.take(2),
    reduce((a, b) => delayI(a + b))
  );
  const r2 = await go(
    list,
    L.map(a => delayI(a * a)),
    L.filter(a => delayI(a % 2)),
    reduce((a, b) => delayI(a + b))
  );
  const r3 = await delayI(r1 + r2);
  
  return r3 + 10;
}
go(f52([1, 2, 3, 4, 5, 6, 7, 8]), a => log(a, 'f52'));
//106 'f52'
//go() 의 내부 reduce() 안에서(reduceF()여기서도 처리함) 프로미스값을 처리하는 then()으로 리턴을 받기 때문에
//f52() 에 프로미스값이 리턴되는 async 함수를 사용해도 문제없이 출력 된다



//## QnA. 동기 상황에서 에러 핸들링은 어떻게 해야하는지?
//log(f7(['0', '1', '2', '{']));  처럼 만약에 f7() 인풋값에 에러가 발생할 인풋값이 들어갈때 에러를 핸들링 하는 방법
//자바스크립트에선 보통 try catch문으로 에러핸들링을 한다

//만약 아래서  log(f7(null)); 을 줄때는  
function f7(list){  //여기서 list = [] 로 디폴트값을 []로 주는 것도 방법이다
  try{
    return list
      .map(a => JSON.parse(a))  //문자열로 들어갈때 자바스크립트 값이나 객체로 바꿔준다
      .filter(a => a % 2)
      .slice(0,2);
  }catch(e){
    log(e);  //로그를 찍어서 핸들링을 하자
    return [];
  }
}
log(f7(['0', '1', '2', '{'])); 
//SyntaxError: Unexpected end of JSON input   

//위와 같이 try catch로 에러를 컨트롤 하면 된다


