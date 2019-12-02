const log = console.log;

//#기존과 달라진 ES6에서의 리스트 순회!!
//- for i++
//- for of

//기존의 list 순회
let number = '';
const list = [1,2,3];
for(var i = 0; i < list.length; i++){
  number = number + list[i];
}
log(number);//123

let string = '';
const str = 'abc';
for(var i = 0; i < str.length; i++){
  string += str[i];
}
log(string); //abc

//바뀐 리스트 순회방법
for(var a of list){
  number += a;
}
log(number);//123123

for(var b of str){
  string += b;
}
log(string);//abcabc


//#Array를 통해 알아보기
//- 배열의 인덱스로 접근 가능 ex) arr[0] = 1, arr[1] = 2 이런식이다
//Symbol.iterator의 value()로 이뤄진것을 알 수 있다
log('Arr---------');
const arr = [1,2,3];
//arr[Symbol.iterator] = null //TypeError: arr[Symbol.iterator] is not a function  
let iter1 = arr[Symbol.iterator]();
for(const a of arr){
  log(a);
}
// Arr---------
// 1
// 2
// 3
log(iter1.next()); //{ value: 1, done: false }
while(!(a = iter1.next()).done){
  log(a.value);
}
// 1
// 2
// 3
//**arr 는 이터러블이고, [Symbol.iterator]() 를 통해 이터레이터로 바꿔준다
//이제 iter.next(); 를 입력하면 {value, done}으로 이뤄진 객체를 리턴할 수 있다
//**for of 의 정체는 위의 이터레이터에서 value값을 계속 출력한다. done이 true가 될때까지(true시 value값 없음)
//내부에 배열 객체를 리턴해주는 함수가 있음을 알 수 있다.
//arr[Symbol.iterator] = null;  //로 내부의 Symbol.iterator 함수를 없애면 에러발생


//#Set을 통해 알아보기
//- 배열의 인덱스로 접근이 불가능   ex) arr[0] = undefined, arr[1] = undefined 이런식
//- 이터러블 프로토콜을 따르기 때문에 배열의 인덱스로는 접근할 수 없지만 [Symbol.iterator]()로 
//- 기존의 이터러블 -> 이터레이터 로 바꿔주면, 객체.next() 로 {value,done} 으로 이뤄진 객체를 볼 수 있다
//- Symbol.iterator 의 value() 로 이뤄진것을 알 수 있다
log('Set ------------');
const set = new Set([1,2,3]);
for(const a of set)log(a);
// Set ------------
// 1
// 2
// 3
log(set[0],'안나옴'); //undefined '안나옴'
let settest = '';
const set1 = set[Symbol.iterator]();
log(set1.next()); //{ value: 1, done: false }
while(!(a = set1.next()).done){
  settest += a.value;
}
log(settest); //23   //앞에서 next()를 했으므로 23만찍힘


//#Map 을 통해 알아보기
//- 배열의 인덱스로 접근 불가능 ex) arr[0] = undefined 이런식
//- Symbol.iterator 의 entries() 로 이뤄진것을 알 수 있다
log('Map ----------');
let key='';
let value='';
let all='';
const map = new Map([['a',1],['b',2],['c',3]]);
for(const a of map.keys()){key += a;}
log(key); //abc
for(const a of map.values()){value += a;}
log(value); //123
for(const a of map.entries()){all += a;}
log(all); //a,1b,2c,3


//#이터러블 / 이터레이터 프로토콜
//- 이터러블 : 이터레이터를 리턴하는 [Symbol.iterator]() 를 가진 값
//- 이터레이터 : {value, done} 객체를 리턴하는 next()를 가진 값
//- 이터러블 / 이터레이터 프로토콜 : 이터러블을 for of , 전개연산자 등과 함께 동작하도록 만든 규약

//# 사용자 정의 이터러블을 만들어보며 알아보자

//3,2,1로 끝나는 이터러블 만들어보기
const iterable = {
  [Symbol.iterator]() { //메서드를 커스텀하게 바꿔보자
    let i =3;
    return {
      next(){ //next() 실행 시 이터레이터 {value, done} 객체를 리턴하게 만들면 된다
        return i == 0 ? {done : true} : {value : i--, done : false};
      },
      //처음 [Symbol.iterator]() 를 실행할 때 next() 메서드로 기본 요건을 만들고 
      [Symbol.iterator](){
        return this; //자기 자신을 리턴해주는 [Symbol.iterator]() 메서드를 다시 넣으면 
      }              //이전까지 진행된 상태에서 계속 진핼할 수 있도록 만들어 줄 수 있다
    };
  }
};

let iterator = iterable[Symbol.iterator]();
log(iterator.next()); //{ value: 3, done: false }
log(iterator.next()); //{ value: 2, done: false }
for(a of iterator) log(a);  //1     
//위에서 자기 자신을 리턴해 줬기 때문에 next() 첫실행을 제외한 나머지 부분이 잘 순회가 된다 
//for문을 돌려도 이어서 값이 나온다
//즉! 이터레이터가 자기 자신을 리턴하는 Symbol.iterator() 메서드를 가지고 있을 때가 
//잘 만들어진 이터레이터라고 할 수 있다

//**이미 많은 오픈 소스 라이브러리에서 순회가 가능한 형태를 가진 값들은 대부분 위의 이터러블, 이터레이터 프로토콜을
//따르도록 만들었다. 예를 들면 facebook의 immutable js 역시 for of 문을 통해서 순회할 수 있도록 
//Symbol.iterator()가 구현되어 있다.  지금은 브라우저의 웹 API (DOM) 역시 이터레이터 이터러블 프로토콜을 따르고 있다

//예를 들면 아래와 같이 DOM Element 를 조회한 상태에서 순회가 가능하다
for(const a of document.querySelectorAll('*')) log(a);
const all1 = document.querySelectorAll('*');
//all변수가 배열이라서 그런게 아니라 [Symbol.iterator]() 가 구현되어 있어서 그렇다
let iter3 = all1[Symbol.iterator]();//이터러블[Symbol.iterator]() 를 사용하여  이터러블 -> 이터레이터 로 바꿔주면
log(iter3.next());  //{value, done} 객체를 확인할 수 있다
log(iter3.next());
log(iter3.next());


//#전개연산자 
//- 역시 마찬가지로 이터레이터, 이터러블 프로토콜을 따른다
//- ...a 처럼 펼쳐지면서 나타내는것을 전개 연산자라고 한다
//- 얕은복사로도 이용한다
const a4 = [1,2];
log([...a4, ...[3,4]]); //[ 1, 2, 3, 4 ]
//a[Symbol.iterator] = null;  
log([...a4, ...arr, ...set, ...map.keys()]);
//[ 1, 2, 1, 2, 3, 1, 2, 3, 'a', 'b', 'c' ]