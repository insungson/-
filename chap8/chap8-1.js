const {log, curry, isIterable, reduce, go, pipe, take, takeAll, L, range, map, filter, find, add} = require('./chap8');

//## Promise
//- 자바스크립트에서 비동기 동시성 프로그래밍을 하는 방법은 크게 2가지가 있다
//1) 콜백 패턴
//2) promise 메서드 체인을 통해 함수를 합성
//   async await 를 통해 합성하는 방법(promise 기반)

//콜백 방식을 살펴보고, promise와 콜백의 차이를 살펴보고,
//함수형 프로그래밍과 연관하여 promise가 어떻게 다른지 살펴볼 것이다



//## 일급
//- 콜백과 프로미스의 가장 큰 차이는 비동기 값을 일급으로 다룬 것이다
//- **프로미스는 프로미스라는 클래스를 통해 만들어진 인스턴스를 리턴하는데
//- **그 프로미스 값은 대기, 성공, 실패를 다루는 일급 값으로 이뤄져 있다( resolve -> then(), reject -> catch() )
//**여기서 대기 되는 값을 만든다는게 중요하다!!
//**예를 들면 아래의 프로미스에서 비동기 상황에 대한 값을 만들어서 리턴을 하고 있다!! (중요!!)
//return new Promise(resolve => setTimeout(() => resolve(a+20), 100));

//**중간결과를 잡는 대기 상태를 log를 통해 살펴보면 콜백은 undefined, 프로미스는 Promise{} 객체가 있음을 알 수 있다

//콜백함수
function add10(a, callback){              //인자 a  추후 전달할 함수 callback 을 인자로 받는다
  setTimeout(() => callback(a+10), 1000); //a + 10을 받을 함수에 전달한다
}
let a = add10(5, res => { //a + 10 의 결과를 res => {} 함수에 넘겨준다
  add10(res, res => {     //다시 res 인자를 받고 다음 함수로 넘겨준다
    add10(res, res => {   //여기선 2번을 넘겨준다 (3번 더해지고 )
      log(res);
    });
  });
});
log('test',a);
// test undefined   callback() 내부의 인자가(a+10) 컨텍스트로 넘어오기 때문에 log로 찍어도 undefined가 된다
// 35

//**콜백 함수 특징
//**add10() 은 실행 후 리턴값이 중요하지 않고 setTimeout() 이 일어난다는 코드적인 상황과 
//**SetTimeout이 끝났을때 다시 실행해주는 함수인 컨택스트 a + 10 만 남아있다고 볼 수 있다


//프로미스
function add20(a){
  return new Promise(resolve => setTimeout(() => resolve(a+10),1000));
  //promise가 끝난것을 resolve로 알려줌
}
let b = add20(5).then(add20).then(add20).then(log);//콜백과 달리 then()으로 쉽게 추가하는게 가능하다 
log('test',b); //test Promise { <pending> }        
// 35    이건 40번째 줄 let b에 대한 값이다

//**프로미스 함수 특징
//**Promise 객체가 리턴된다 그리고 Promise가 리턴되기 때문에 이후 어떤 변수에 할당해서 
//**then()으로 추가적인 작업을 할 수 있다 
//위에서 Promise { <pending> } 가 남아있는걸 확인할 수 있다

//ex) var a = promise객체.then(a => a+10); 
//    a.then(log);  
//처럼 then()을 통해 계속 추가작업을 이어갈 수 있다 
//(비동기 상황을 값으로 다룰 수 있다 (일급이다- 어떤 변수나 함수에 적용시킬 수 있다))
//반면... 콜백은 추가작업이 안되고 함수의 내부에서 진행해야한다




//## 일급 활용
//프로미스가 비동기에서 값을 다루는 일급의 성질을 가지고 있다는 특징을 사용해서 다양한것을 할 수 있다
//(함수에 적용시킬 수 있다)

const delay10 = a => new Promise(resolve => setTimeout(() => resolve(a), 3000));
//0.1초 후 a를 그대로 전달하는 비동기 함수이다
const go1 = (a, f) => a instanceof Promise ? a.then(f) : f(a);
//a가 프로미스(비동기)라면 then으로 받고 아니면 일반함수로 받는다
//go1()이 잘동작하려면 f()가 동기적으로 동작하는 함수이고 a값은 동기적으로 알수 있는값이어야 한다
//a는 비동기적인 값이(프로미스값) 아니어야 값이 잘 적용되고 add5가 실행될 수 있다는 의미이다
const add5 = a => a + 5;

var r = go1(10, add5);
log(r); //15
//go1(go1(n1, add5), log); //이렇게 log를 go1 함수에 집어 넣어도 된다 (위의 2줄과 같다)
var r1 = go1(delay10(10), add5);
log('--',r1); //-- Promise { <pending> }
r1.then(log); //15


//동기, 비동기의 처리 차이를 한번 더 살펴보자
const n1 = 10;  //동기변수
log('동기',go1(go1(n1, add5),log));  //콜백으로 동기변수를 보내보자
//동기 undefined  
//결과를 확인해보면 undefined가 뜬다
const n2 = delay10(10);//비동기 변수
log('비동기',go1(go1(n2, add5), log));//콜백으로 비동기변수를 보내보자
//비동기 Promise { <pending> }
//결과를 확인해보면 Promise { <pending> }가 뜬다
//delay10() 에서 resolve() 로 값을 보내서 promise 객체가 들어온 것이다




//## Composition //함수 합성과정에서의 프로미스
//- 프로미스는 비동기 상황에서 함수 합성을 안전하게 할 수 있는 도구이다!! 
//- 비동기 값을 가지고 함수 실행을 안전하게 하는 모나드이다 
//- 모나드 : 함수 합성을 안전하게 할 수 있는 도구! 
//-         [1]   어떤 컨테이너에([]) 값이(1) 들어있다 그 값을 통해서 함수합성을 안전하게 해나가는 것을 말한다 

//자바스크립트에서는 직접적으로 모나드 개념을 사용하지 않지만.. Array, Promise 을 통해서 모나드를 알 수 있고,
//모나드에 함수 합성에서의 안정성, 응용등을 살펴볼 수 있다 

// f . g   //이렇게 함수를 합성했다고 하면
// f(g(x)) //x인자가 g 함수에 전달되고 그 결과가 f 함수에 전달되어 f 가 그 결과를 만드는것이다

const g = a => a+1;
const f = a => a*a;

log(f(g(1))); //4     //여기선 값이 1이 들어가서 4 라는 값이 잘 나온다
log(f(g()));  //NaN   //여기선 값이 없어서 Nan값이 나오며 에러가 발생한다 (합성이 가능한 인자만 들어와야 한다)
//그렇다면 위의 예시처럼 함수 합성 시 어떠한 인자, 혹은 인자가 없을때의 함수 합성을 어떻게 안전하게 할 수 있을까?
// 모나드를 사용한다!

//모나드 형태의 함수 합성
Array(7);     //[] 배열의 7개 공간이 생긴다 (이값은 undefined value 가 아니다)
Array.of(7);  //[7] 배열에 7 숫자의 요소가 들어간다
Array.of(1).map(g).map(f).forEach(r => log(r,'모나드'));  //4 '모나드'
//Array.of(1) === [1] 은 같다
[].map(g).map(f).forEach(r => log(r,'모나드1'));  //아무것도 출력되지 않음
//모나드는 위처럼 [] 박스를 가지고 있고 박스안에 실제 효과 혹은 연산에 필요한 재료들을 가지고 있다
//박스가 가지고 있는 메서드를 통해서 함수 합성을 한다 
//위의 예시에서 map() 함수를 통해 함수를 합성한다

[].map(g).map(f);
//박스에 1의 값을 넣고 로그로 찍어보면 
log([1].map(g).map(f)); //[ 4 ]      
//**array 라는 값은 개발자가 어떤 효과를 만들거나 값들을 다룰때 사용하는 도구지만 
//**사용자 화면에 보이는 실제 결론은 아니다
//실제 결론은 값이 어떻게 변했는지에 대한 결과이다 
//**즉! 여기서 필요한 값은 4 이지 [4] 가 아니다
//실무에선 array 내부에 필요한 값을(div, td, tr 같은 태그들) 넣을지언정 array인 채로 HTML에 출력하지 않는다 

//그래서 [1].map(g).map(f).forEach(r => log(r));  ===  log(f(g(1)));    와 결과는 같다
//차이는
//log(f(g()));  는 값이 없을때 효과까지 가버려서 에러가 발생하는 반면
//[].map(g).map(f).forEach(r => log(r)); 는 값이 없을때는 효과를 일으키지 않아서 에러가 발생하지 않는다

//array의 경우 박스 안에 값이 여러개일지라도 함수를 합성해서 결과를 만들 수 있고 중간에 filter()를 둬서
// 원하는 값을 뽑을 수도 있다 (홀수값)
[1,2,3].map(g).filter(a => a%2).map(f).forEach(r => log(r,'홀수')); //9 '홀수'



//프로미스는 어떤 함수 합성을 하는 값인가? 아래의 예를 보자
//위에서 []박스 인 배열을 Array.of() 함수로 만든것처럼 Promise.resolve(2) 를 통해서 promise 값을 만든다
//array는 map() 을 통해서 함수를 합성했다면... promise는 then() 을 통해서 함수를 합성한다
Promise.resolve(2).then(g).then(f).then(r => log(r,'홀수 프로미스'));   //9 '홀수 프로미스'
//비동기가 일어나는 값으로(Promise.resolve(2))
//g(),f() 를 합성한 후에(then(g).then(f))
//값을 출력한다 (.then(r => log(r)))
//** 위처럼 프로미스는 비동기적으로 일어난 상황을 안전하게 합성해주는 경우이다!!

//** Array, Promise 에서 아래와 같이 사용하는것은 용도가 다르다!! 
[].map(g).map(f).forEach(f => log(f, '배열'));                    //아무것도 안뜬다
//배열의 경우 []에 값이 없으면 효과가 안일어나지만
Promise.resolve().then(g).then(f).then(f => log(f, '프로미스'));  //NaN '프로미스'
//promise의 경우 resolve()에 값이 없으면 효과가 일어나 에러가 발생한다
//** 프로미스는 resolve() 안에 어떠한 값이 있거나, 없거나 하는 관점에서의 안전한 함수 합성이 아니고,
//   비동기 상황(프로미스 대기가 일어난 상황)에서의 

//아래의 예를 보자
new Promise(resolve => setTimeout(() => resolve(2),100)).then(g).then(f).then(r => log(r, '-비동기-')); //9 '-비동기-'
//프로미스에서 비동기 상황의 모나드 박스는  new Promise(resolve => setTimeout(() => resolve(2), 100)) 인데
[1,2,3].map(g).filter(a => a%2).map(f).forEach(r => log(r,'-배열-')); //9 '-배열-'
////배열의 경우 forEach() 부분을 모나드라고 할 수 있다





//## Kleisli Composition
//- 오류가 있을 수 있는 상황에서의 함수 합성을 안전하게 할 수 있는 하나의 규칙이다
//- 들어온 인자가 잘못된 인자라 함수에서 오류가 날 수 있는 상황이나(위에서 출력이 안되거나, Nan으로 값이 안나올경우)
//- 정확한 인자가 들어와도 함수가 의존하는 외부의 상태에 대해서 결과를 정확히 전달할 수 없는 상황일때, 에러가 발생한다
//- 위와 같은 상황을 해결하기 위해 kleisli 합성을 사용한다

// f . g
// f(g(x)) = f(g(x))    
//양변에 x인자가 같으면 결과는 항상 같다  하지만 실무에서는 왼쪽의 f(g(x)) 에서 g(x)가  두번째 f(g(x)) 에서
//실행할때는 다른 값으로 변할 수 있기 때문에 오류가 발생한다. 
//이부분에 대해 해결하는게 Kleisli 합성이다 아래를 보자

// f(g(x)) = g(x)
//아무런 에러없이 g(x)에서 f()가 실행된다면  f(g(x)) = f(g(x)) 일 것이다 
//하지만 g(x)에서 에러가 날 경우  f(g(x)) = g(x) 이런 경우의 수를 만드는것이 Kleisli 합성이다 
//** 즉 ! g(x) 에서 에러가 날 경우 f()를 합성해도 마치 합성한게 아닌듯이 만드는 방법이 Kleisli 합성이다

let users = [   //이것을 상태라고 볼때 
  {id: 1, name: 'aa'},
  {id: 2, name: 'bb'},
  {id: 3, name: 'cc'}
];
const getUserById = id => find(u => u.id == id, users);//유저id 찾는 함수
const getName = ({name}) => name; //객체에서 name을 추출해서 리턴하는 함수이다
const getId = getUserById;  //위의 함수를 g()로 담는다 

// const GET_Name_Id = id => getName(getId(id)); //함수를 합성하는 fg()는 g(id)를 받아서 f()를 실행한다
// const r2 = GET_Name_Id(2);
// log(r2,'==l==');  //bb ==l==   이름이 잘 나옴
// users.pop(); //위에서 설명한 g(x) 의 값이 변하는 경우를 pop()으로 예시를 들을때 
// users.pop();
// const r3 = GET_Name_Id(2); //pop()으로 users의 데이터가 빠졌기 때문에 에러가 발생한다 
// log(r3); //TypeError: Cannot destructure property `name` of 'undefined' or 'null'.

//즉 위에서 말한 부분에서 f(g(x)) 의 g(x) 부분인 getId(id) 부분이 users.pop() 으로 바뀌어서 에러가 발생한것이다

//프로미스의 resolve, reject 를 통해서 에러부분을 컨트롤하여 결과를 출력해보자
const GET_Name_Id = id => getUserById(id) ? Promise.resolve(id).then(getId).then(getName) : Promise.reject('없어요');
// GET_Name_Id(2).then(log); //bb
users.pop();
users.pop();
GET_Name_Id(2).then(log).catch(a => log(a));  //없어요


//http://seonho.kim/2017/09/16/monad-and-clojure/
//모나드란?
// input -> f() -> 저장공간 -> g() -> output  (변수, 로컬디스크에 저장하고 그 값에 접근하여 output을 얻는것)
// 위의 개념이지만, 함수형 프로그래밍에선 f() 나 g() 외에 다른 함수가 저장공간에 접근하게 되면 g() 의 결과를 
// 장담할 수 없으므로 함수형 프로그램에선 권장하지 않는다
// 그래서 아래와 같이 g(),f()를 합성하여 동일한 입력에 대해 동일한 결과가 나오는 함수를 만든다
// input -> g(f(x)) -> output    (여기서 중요한 점은 f()의 리턴값을 g()가 활용할 수 있어야 한다)
// 1. 함수들 간의 특정 자료형을 처리할 수 있도록 미리 정한다(개발자들간 협의)
// 2. 이러한 함수 f()를 감싸는 컨테이너를 만든 다음  ((모나드!))
// 3. 이 컨테이너를 다음 함수 g()에 전달하면   ((return))
// 4. 함수 g() 는 함수 f() 의 결과를 자연스럽게(협의된 자료형에 근거하여) 활용할 수 있게 된다 ((바인딩))
//  (바인딩 : 메서드와 객체를 묶어놓는 것) bind: 묶다, 결속시키다