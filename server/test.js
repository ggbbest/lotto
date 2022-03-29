const fs = require("fs");

// 추첨결과데이터의 정확성 테스트
var selected = {},
  repeat = [],
  luckyData = require("/Users/xiechang/Documents/project/lucky/product/dist/temp.json"),
  errorData = require("/Users/xiechang/Documents/project/lucky/product/dist/error.json");

for (let key in luckyData) {
  let item = luckyData[key];
  item.forEach(user => {
    let id = user[0];
    if (selected[id]) {
      repeat.push(user[1]);
      return;
    }
    selected[id] = true;
  });
}

errorData.forEach(user => {
  let id = user[0];
  if (selected[id]) {
    repeat.push(user[1]);
    return;
  }
  selected[id] = true;
});

if (repeat.length > 0) {
  console.log(repeat);
  return;
}
console.log("반복 옵션 없음");
