/**
 * 奖品设置
 * type: 唯一标识，0是默认특별상的占位符，其它奖品不可使用
 * count: 奖品数量
 * title: 奖品描述
 * text: 奖品标题
 * img: 图片地址
 * 경품 설정
 * 유형: 고유 식별자, 0은 기본 특별 상품의 자리 표시자, 다른 상품은 사용할 수 없습니다.
 * count : 상금 수
 * 제목: 상품 설명
 * 텍스트: 상품명
 * img: 이미지 주소
 */
const prizes = [
  {
    type: 0,
    count: 1000,
    title: "",
    text: "특별상"
  },
  {
    type: 1,
    count: 2,
    text: "우수상",
    title: "신비한 선물",
    img: "../img/secrit.jpg"
  },
  {
    type: 2,
    count: 5,
    text: "1st",
    title: "Mac Pro",
    img: "../img/mbp.jpg"
  },
  {
    type: 3,
    count: 6,
    text: "2nd",
    title: "화웨이 Mate30",
    img: "../img/huawei.png"
  },
  {
    type: 4,
    count: 7,
    text: "3rd",
    title: "Ipad Mini5",
    img: "../img/ipad.jpg"
  },
  {
    type: 5,
    count: 8,
    text: "4th",
    title: "DJI 드론",
    img: "../img/spark.jpg"
  },
  {
    type: 6,
    count: 8,
    text: "5th",
    title: "Kindle",
    img: "../img/kindle.jpg"
  },
  {
    type: 7,
    count: 11,
    text: "6th",
    title: "에디파이어 블루투스 헤드셋",
    img: "../img/edifier.jpg"
  }
];

/**
 * 한 번에 추첨된 경품의 수는 경품에 해당합니다.
 */
const EACH_COUNT = [1, 1, 5, 6, 7, 8, 9, 10];

/**
 * 카드사명 로고
 */
const COMPANY = "C4EI";

module.exports = {
  prizes,
  EACH_COUNT,
  COMPANY
};
