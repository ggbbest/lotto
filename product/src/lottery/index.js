import "./index.css";
import "../css/animate.min.css";
import "./canvas.js";
import {
  addQipao,
  setPrizes,
  showPrizeList,
  setPrizeData,
  resetPrize
} from "./prizeList";
import { NUMBER_MATRIX } from "./config.js";

const ROTATE_TIME = 3000;
const BASE_HEIGHT = 1080;

let TOTAL_CARDS,
  btns = {
    enter: document.querySelector("#enter"),
    lotteryBar: document.querySelector("#lotteryBar")
  },
  prizes,
  EACH_COUNT,
  ROW_COUNT = 7,
  COLUMN_COUNT = 17,
  COMPANY,
  HIGHLIGHT_CELL = [],
  // 当前的比例
  Resolution = 1;

let camera,
  scene,
  renderer,
  controls,
  threeDCards = [],
  targets = {
    table: [],
    sphere: []
  };

let selectedCardIndex = [],
  rotate = false,
  basicData = {
    prizes: [], //상품 정보
    users: [], //모든 직원
    luckyUsers: {}, //승자
    leftUsers: [] //당첨되지 않은 분들
  },
  interval,
  // 현재 추첨된 상품은 가장 낮은 상품부터 큰 상품이 추첨될 때까지
  currentPrizeIndex,
  currentPrize,
  // 추첨
  isLotting = false,
  currentLuckys = [];

initAll();

/**
 * 모든 DOM 초기화
 */
function initAll() {
  window.AJAX({
    url: "/getTempData",
    success(data) {
      // 기본 데이터 가져오기
      prizes = data.cfgData.prizes;
      EACH_COUNT = data.cfgData.EACH_COUNT;
      COMPANY = data.cfgData.COMPANY;
      HIGHLIGHT_CELL = createHighlight();
      basicData.prizes = prizes;
      setPrizes(prizes);

      TOTAL_CARDS = ROW_COUNT * COLUMN_COUNT;

      // 추첨결과 설정 읽기
      basicData.leftUsers = data.leftUsers;
      basicData.luckyUsers = data.luckyData;

      let prizeIndex = basicData.prizes.length - 1;
      for (; prizeIndex > -1; prizeIndex--) {
        if (
          data.luckyData[prizeIndex] &&
          data.luckyData[prizeIndex].length >=
            basicData.prizes[prizeIndex].count
        ) {
          continue;
        }
        currentPrizeIndex = prizeIndex;
        currentPrize = basicData.prizes[currentPrizeIndex];
        break;
      }

      showPrizeList(currentPrizeIndex);
      let curLucks = basicData.luckyUsers[currentPrize.type];
      setPrizeData(currentPrizeIndex, curLucks ? curLucks.length : 0, true);
    }
  });

  window.AJAX({
    url: "/getUsers",
    success(data) {
      basicData.users = data;

      initCards();
      // startMaoPao();
      animate();
      shineCard();
    }
  });
}

function initCards() {
  let member = basicData.users,
    showCards = [],
    length = member.length;

  let isBold = false,
    showTable = basicData.leftUsers.length === basicData.users.length,
    index = 0,
    totalMember = member.length,
    position = {
      x: (140 * COLUMN_COUNT - 20) / 2,
      y: (180 * ROW_COUNT - 20) / 2
    };

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  for (let i = 0; i < ROW_COUNT; i++) {
    for (let j = 0; j < COLUMN_COUNT; j++) {
      isBold = HIGHLIGHT_CELL.includes(j + "-" + i);
      var element = createCard(
        member[index % length],
        isBold,
        index,
        showTable
      );

      var object = new THREE.CSS3DObject(element);
      object.position.x = Math.random() * 4000 - 2000;
      object.position.y = Math.random() * 4000 - 2000;
      object.position.z = Math.random() * 4000 - 2000;
      scene.add(object);
      threeDCards.push(object);
      //

      var object = new THREE.Object3D();
      object.position.x = j * 140 - position.x;
      object.position.y = -(i * 180) + position.y;
      targets.table.push(object);
      index++;
    }
  }

  // sphere

  var vector = new THREE.Vector3();

  for (var i = 0, l = threeDCards.length; i < l; i++) {
    var phi = Math.acos(-1 + (2 * i) / l);
    var theta = Math.sqrt(l * Math.PI) * phi;
    var object = new THREE.Object3D();
    object.position.setFromSphericalCoords(800 * Resolution, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  //

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener("change", render);

  bindEvent();

  if (showTable) {
    switchScreen("enter");
  } else {
    switchScreen("lottery");
  }
}

function setLotteryStatus(status = false) {
  isLotting = status;
}

/**
 * 이벤트 바인딩
 */
function bindEvent() {
  document.querySelector("#menu").addEventListener("click", function (e) {
    e.stopPropagation();
    // 추첨이 진행 중인 경우 모든 작업이 금지됩니다.
    if (isLotting) {
      addQipao("천천히...");
      return false;
    }

    let target = e.target.id;
    switch (target) {
      // 디스플레이 디지털 벽
      case "welcome":
        switchScreen("enter");
        rotate = false;
        break;
      // 복권에 들어가다
      case "enter":
        removeHighlight();
        addQipao(`[${currentPrize.title}],추첨중 나가지마세요.`);
        // rotate = !rotate;
        rotate = true;
        switchScreen("lottery");
        break;
      // 초기화
      case "reset":
        let doREset = window.confirm(
          "데이터를 초기화하시겠습니까? 초기화 후 추첨된 경품은 모두 삭제됩니다."
        );
        if (!doREset) {
          return;
        }
        addQipao("모든 데이터 재설정, 다시 그리기");
        addHighlight();
        resetCard();
        // 모든 데이터 재설정
        currentLuckys = [];
        basicData.leftUsers = Object.assign([], basicData.users);
        basicData.luckyUsers = {};
        currentPrizeIndex = basicData.prizes.length - 1;
        currentPrize = basicData.prizes[currentPrizeIndex];

        resetPrize(currentPrizeIndex);
        reset();
        switchScreen("enter");
        break;
      // 즉석로또
      case "lottery":
        setLotteryStatus(true);
        // 각 복권 전에 이전 복권 데이터를 저장
        saveData();
        //남은 추첨 횟수의 데이터 표시 업데이트
        changePrize();
        resetCard().then(res => {
          // 즉석로또
          lottery();
        });
        addQipao(`적출[${currentPrize.title}],조정`);
        break;
      // 다시하기
      case "reLottery":
        if (currentLuckys.length === 0) {
          addQipao(`아직 복권이 없어서 다시는 못뽑아요~~`);
          return;
        }
        setErrorData(currentLuckys);
        addQipao(`다시하기[${currentPrize.title}],준비`);
        setLotteryStatus(true);
        // 재추첨의 경우 바로 추첨되며, 마지막 복권의 데이터는 저장되지 않습니다.
        // 즉석로또
        resetCard().then(res => {
          // 즉석로또
          lottery();
        });
        break;
      // 导出추첨결과
      case "save":
        saveData().then(res => {
          resetCard().then(res => {
            // 将之前的记录置空
            currentLuckys = [];
          });
          exportData();
          addQipao(`데이터가 EXCEL에 저장되었습니다.`);
        });
        break;
    }
  });

  window.addEventListener("resize", onWindowResize, false);
}

function switchScreen(type) {
  switch (type) {
    case "enter":
      btns.enter.classList.remove("none");
      btns.lotteryBar.classList.add("none");
      transform(targets.table, 2000);
      break;
    default:
      btns.enter.classList.add("none");
      btns.lotteryBar.classList.remove("none");
      transform(targets.sphere, 2000);
      break;
  }
}

/**
 * 요소 생성
 */
function createElement(css, text) {
  let dom = document.createElement("div");
  dom.className = css || "";
  dom.innerHTML = text || "";
  return dom;
}

/**
 * 브랜드 만들기
 */
function createCard(user, isBold, id, showTable) {
  var element = createElement();
  element.id = "card-" + id;

  if (isBold) {
    element.className = "element lightitem";
    if (showTable) {
      element.classList.add("highlight");
    }
  } else {
    element.className = "element";
    element.style.backgroundColor =
      "rgba(0,127,127," + (Math.random() * 0.7 + 0.25) + ")";
  }
  //회사 로고 추가
  element.appendChild(createElement("company", COMPANY));

  element.appendChild(createElement("name", user[1]));

  element.appendChild(createElement("details", user[0] + "<br/>" + user[2]));
  return element;
}

function removeHighlight() {
  document.querySelectorAll(".highlight").forEach(node => {
    node.classList.remove("highlight");
  });
}

function addHighlight() {
  document.querySelectorAll(".lightitem").forEach(node => {
    node.classList.add("highlight");
  });
}

/**
 * 지구 등을 렌더링합니다.
 */
function transform(targets, duration) {
  // TWEEN.removeAll();
  for (var i = 0; i < threeDCards.length; i++) {
    var object = threeDCards[i];
    var target = targets[i];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    // new TWEEN.Tween(object.rotation)
    //     .to({
    //         x: target.rotation.x,
    //         y: target.rotation.y,
    //         z: target.rotation.z
    //     }, Math.random() * duration + duration)
    //     .easing(TWEEN.Easing.Exponential.InOut)
    //     .start();
  }

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}

function rotateBall() {
  return new Promise((resolve, reject) => {
    scene.rotation.y = 0;
    new TWEEN.Tween(scene.rotation)
      .to(
        {
          y: Math.PI * 8
        },
        ROTATE_TIME
      )
      .onUpdate(render)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
      .onComplete(() => {
        resolve();
      });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  // x축 또는 y축을 통해 장면 회전
  // rotate && (scene.rotation.y += 0.088);

  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();

  // 렌더 루프
  // render();
}

function render() {
  renderer.render(scene, camera);
}

function selectCard(duration = 600) {
  rotate = false;
  let width = 140,
    tag = -(currentLuckys.length - 1) / 2,
    locates = [];

  // 위치정보 계산, 5개 이상은 2행으로 표시
  if (currentLuckys.length > 5) {
    let yPosition = [-87, 87],
      l = selectedCardIndex.length,
      mid = Math.ceil(l / 2);
    tag = -(mid - 1) / 2;
    for (let i = 0; i < mid; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[0] * Resolution
      });
      tag++;
    }

    tag = -(l - mid - 1) / 2;
    for (let i = mid; i < l; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[1] * Resolution
      });
      tag++;
    }
  } else {
    for (let i = selectedCardIndex.length; i > 0; i--) {
      locates.push({
        x: tag * width * Resolution,
        y: 0 * Resolution
      });
      tag++;
    }
  }

  let text = currentLuckys.map(item => item[1]);
  addQipao(
    `축하합니다${text.join("、")}가져 오기${currentPrize.title}, 새해는 풍족해야 합니다.`
  );

  selectedCardIndex.forEach((cardIndex, index) => {
    changeCard(cardIndex, currentLuckys[index]);
    var object = threeDCards[cardIndex];
    new TWEEN.Tween(object.position)
      .to(
        {
          x: locates[index].x,
          y: locates[index].y * Resolution,
          z: 2200
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: 0,
          y: 0,
          z: 0
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    object.element.classList.add("prize");
    tag++;
  });

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
    .onComplete(() => {
      // 애니메이션 종료 후 조작 가능
      setLotteryStatus();
    });
}

/**
 * 추첨 카드 콘텐츠 재설정
 */
function resetCard(duration = 500) {
  if (currentLuckys.length === 0) {
    return Promise.resolve();
  }

  selectedCardIndex.forEach(index => {
    let object = threeDCards[index],
      target = targets.sphere[index];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  });

  return new Promise((resolve, reject) => {
    new TWEEN.Tween(this)
      .to({}, duration * 2)
      .onUpdate(render)
      .start()
      .onComplete(() => {
        selectedCardIndex.forEach(index => {
          let object = threeDCards[index];
          object.element.classList.remove("prize");
        });
        resolve();
      });
  });
}

/**
 * 즉석로또
 */
function lottery() {
  rotateBall().then(() => {
    // 이전 레코드를 비우다
    currentLuckys = [];
    selectedCardIndex = [];
    // 현재 동시 추첨 횟수입니다. 현재 경품이 추첨된 후, 계속해서 추첨할 수 있지만 데이터가 기록되지 않습니다.
    let perCount = EACH_COUNT[currentPrizeIndex],
      luckyData = basicData.luckyUsers[currentPrize.type],
      leftCount = basicData.leftUsers.length,
      leftPrizeCount = currentPrize.count - (luckyData ? luckyData.length : 0);

    if (leftCount === 0) {
      addQipao("인원이 뽑혔고 이제 모든 인원을 두 번째 추첨을 위해 재설정할 수 있습니다!");
      basicData.leftUsers = basicData.users;
      leftCount = basicData.leftUsers.length;
    }

    for (let i = 0; i < perCount; i++) {
      let luckyId = random(leftCount);
      currentLuckys.push(basicData.leftUsers.splice(luckyId, 1)[0]);
      leftCount--;
      leftPrizeCount--;

      let cardIndex = random(TOTAL_CARDS);
      while (selectedCardIndex.includes(cardIndex)) {
        cardIndex = random(TOTAL_CARDS);
      }
      selectedCardIndex.push(cardIndex);

      if (leftPrizeCount === 0) {
        break;
      }
    }

    // console.log(currentLuckys);
    selectCard();
  });
}

/**
 * 保存上一次的추첨결과
 */
function saveData() {
  if (!currentPrize) {
    //경품이 추첨되면 데이터는 더 이상 기록되지 않지만 추첨은 계속 수행할 수 있습니다.
    return;
  }

  let type = currentPrize.type,
    curLucky = basicData.luckyUsers[type] || [];

  curLucky = curLucky.concat(currentLuckys);

  basicData.luckyUsers[type] = curLucky;

  if (currentPrize.count <= curLucky.length) {
    currentPrizeIndex--;
    if (currentPrizeIndex <= -1) {
      currentPrizeIndex = 0;
    }
    currentPrize = basicData.prizes[currentPrizeIndex];
  }

  if (currentLuckys.length > 0) {
    // todo by xc 서버가 끊기거나 데이터가 손실되는 것을 방지하는 데이터 저장 메커니즘 추가
    return setData(type, currentLuckys);
  }
  return Promise.resolve();
}

function changePrize() {
  let luckys = basicData.luckyUsers[currentPrize.type];
  let luckyCount = (luckys ? luckys.length : 0) + EACH_COUNT[currentPrizeIndex];
  // 왼쪽의 상금 수와 비율 수정
  setPrizeData(currentPrizeIndex, luckyCount);
}

/**
 * 무작위 추첨
 */
function random(num) {
  // Math.floor가 0-num-1 사이의 숫자를 취할 확률은 동일합니다.
  return Math.floor(Math.random() * num);
}

/**
 * Toggle 브랜드 인사 정보
 */
function changeCard(cardIndex, user) {
  let card = threeDCards[cardIndex].element;

  card.innerHTML = `<div class="company">${COMPANY}</div><div class="name">${
    user[1]
  }</div><div class="details">${user[0]}<br/>${user[2] || "PSST"}</div>`;
}

/**
 * 명판의 배경 변경
 */
function shine(cardIndex, color) {
  let card = threeDCards[cardIndex].element;
  card.style.backgroundColor =
    color || "rgba(0,127,127," + (Math.random() * 0.7 + 0.25) + ")";
}

/**
 * 배경 및 인사 정보를 무작위로 전환
 */
function shineCard() {
  let maxCard = 10,
    maxUser;
  let shineCard = 10 + random(maxCard);

  setInterval(() => {
    // 복권 추첨 정지 깜박임
    if (isLotting) {
      return;
    }
    maxUser = basicData.leftUsers.length;
    for (let i = 0; i < shineCard; i++) {
      let index = random(maxUser),
        cardIndex = random(TOTAL_CARDS);
      // 현재 표시된 당첨 목록은 무작위로 전환되지 않습니다.
      if (selectedCardIndex.includes(cardIndex)) {
        continue;
      }
      shine(cardIndex);
      changeCard(cardIndex, basicData.leftUsers[index]);
    }
  }, 500);
}

function setData(type, data) {
  return new Promise((resolve, reject) => {
    window.AJAX({
      url: "/saveData",
      data: {
        type,
        data
      },
      success() {
        resolve();
      },
      error() {
        reject();
      }
    });
  });
}

function setErrorData(data) {
  return new Promise((resolve, reject) => {
    window.AJAX({
      url: "/errorData",
      data: {
        data
      },
      success() {
        resolve();
      },
      error() {
        reject();
      }
    });
  });
}

function exportData() {
  window.AJAX({
    url: "/export",
    success(data) {
      if (data.type === "success") {
        location.href = data.url;
      }
    }
  });
}

function reset() {
  window.AJAX({
    url: "/reset",
    success(data) {
      console.log("重置成功");
    }
  });
}

function createHighlight() {
  let year = new Date().getFullYear() + "";
  let step = 4,
    xoffset = 1,
    yoffset = 1,
    highlight = [];

  year.split("").forEach(n => {
    highlight = highlight.concat(
      NUMBER_MATRIX[n].map(item => {
        return `${item[0] + xoffset}-${item[1] + yoffset}`;
      })
    );
    xoffset += step;
  });

  return highlight;
}

let onload = window.onload;

window.onload = function () {
  onload && onload();

  let music = document.querySelector("#music");

  let rotated = 0,
    stopAnimate = false,
    musicBox = document.querySelector("#musicBox");

  function animate() {
    requestAnimationFrame(function () {
      if (stopAnimate) {
        return;
      }
      rotated = rotated % 360;
      musicBox.style.transform = "rotate(" + rotated + "deg)";
      rotated += 1;
      animate();
    });
  }

  musicBox.addEventListener(
    "click",
    function (e) {
      if (music.paused) {
        music.play().then(
          () => {
            stopAnimate = false;
            animate();
          },
          () => {
            addQipao("배경 음악이 자동으로 재생되지 않습니다. 수동으로 재생하십시오!");
          }
        );
      } else {
        music.pause();
        stopAnimate = true;
      }
    },
    false
  );

  setTimeout(function () {
    musicBox.click();
  }, 1000);
};
