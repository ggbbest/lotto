const express = require("express");
const opn = require("opn");
const bodyParser = require("body-parser");
const path = require("path");
const chokidar = require("chokidar");
const cfg = require("./config");

const {
  loadXML,
  loadTempData,
  writeXML,
  saveDataFile,
  shuffle,
  saveErrorDataFile
} = require("./help");

let app = express(),
  router = express.Router(),
  cwd = process.cwd(),
  dataBath = __dirname,
  port = 8090,
  curData = {},
  luckyData = {},
  errorData = [],
  defaultType = cfg.prizes[0]["type"],
  defaultPage = `default data`;

//여기에 지정된 매개변수는 json 형식을 사용합니다.
app.use(
  bodyParser.json({
    limit: "1mb"
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

if (process.argv.length > 2) {
  port = process.argv[2];
}

app.use(express.static(cwd));

//요청 주소가 비어 있습니다. 기본적으로 index.html 파일로 리디렉션됩니다.
app.get("/", (req, res) => {
  res.redirect(301, "index.html");
});

//교차 도메인 액세스 설정
app.all("*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

app.post("*", (req, res, next) => {
  log(timestamp()+`콘텐츠 요청:${JSON.stringify(req.path, 2)}`);
  next();
});

// 이전에 설정한 데이터 가져오기
router.post("/getTempData", (req, res, next) => {
  getLeftUsers();
  res.json({
    cfgData: cfg,
    leftUsers: curData.leftUsers,
    luckyData: luckyData
  });
});

// 모든 사용자 가져오기
router.post("/reset", (req, res, next) => {
  luckyData = {};
  errorData = [];
  log(timestamp()+`데이터 재설정 성공`);
  saveErrorDataFile(errorData);
  return saveDataFile(luckyData).then(data => {
    res.json({
      type: "success"
    });
  });
});

// 모든 사용자 가져오기
router.post("/getUsers", (req, res, next) => {
  res.json(curData.users);
  log(timestamp()+`복권 사용자 데이터 LOAD.`);
});

// 경품 정보 얻기
router.post("/getPrizes", (req, res, next) => {
  // res.json(curData.prize);
  log(timestamp()+`상품 데이터 반환 성공`);
});

// 경품 데이터 저장
router.post("/saveData", (req, res, next) => {
  let data = req.body;
  setLucky(data.type, data.data)
    .then(t => {
      res.json({
        type: "설정변경완료"
      });
      log(timestamp()+`경품 데이터 저장 성공`);
    })
    .catch(data => {
      res.json({
        type: "설정변경실패！"
      });
      log(timestamp()+`상품 데이터 저장실패`);
    });
});

// 경품 데이터 저장
router.post("/errorData", (req, res, next) => {
  let data = req.body;
  setErrorData(data.data)
    .then(t => {
      res.json({
        type: "설정변경완료！"
      });
      log(`누락된 인사 데이터를 성공적으로 저장`);
    })
    .catch(data => {
      res.json({
        type: "설정 실패！"
      });
      log(timestamp()+`누락된 인사 데이터를 저장하지 못했습니다.`);
    });
});

// 엑셀에 데이터 저장
router.post("/export", (req, res, next) => {
  let type = [1, 2, 3, 4, 5, defaultType],
    outData = [["번호", "이름", "부서"]];
  cfg.prizes.forEach(item => {
    outData.push([item.text]);
    outData = outData.concat(luckyData[item.type] || []);
  });

  writeXML(outData, "/추첨결과.xlsx")
    .then(dt => {
      // res.download('/추첨결과.xlsx');
      res.status(200).json({
        type: "success",
        url: "추첨결과.xlsx"
      });
      log(timestamp()+`데이터 내보내기 성공!`);
    })
    .catch(err => {
      res.json({
        type: "error",
        error: err.error
      });
      log(timestamp()+`데이터 내보내기 실패!`);
    });
});

//일치하지 않는 경로 또는 요청의 경우 기본 페이지로 돌아갑니다.
// 다른 요청을 구별하고 다른 페이지 콘텐츠를 반환합니다.
router.all("*", (req, res) => {
  if (req.method.toLowerCase() === "get") {
    if (/\.(html|htm)/.test(req.originalUrl)) {
      res.set("Content-Type", "text/html");
      res.send(defaultPage);
    } else {
      res.status(404).end();
    }
  } else if (req.method.toLowerCase() === "post") {
    let postBackData = {
      error: "empty"
    };
    res.send(JSON.stringify(postBackData));
  }
});

function log(text) {
  global.console.log(text);
  global.console.log(timestamp()+"-----------------------------------------------");
}

function setLucky(type, data) {
  if (luckyData[type]) {
    luckyData[type] = luckyData[type].concat(data);
  } else {
    luckyData[type] = Array.isArray(data) ? data : [data];
  }

  return saveDataFile(luckyData);
}

function setErrorData(data) {
  errorData = errorData.concat(data);

  return saveErrorDataFile(errorData);
}

app.use(router);

function loadData() {
  console.log(timestamp()+"엑셀 데이터 파일 불러오기");
  let cfgData = {};

  // curData.users = loadXML(path.join(cwd, "data/users.xlsx"));
  curData.users = loadXML(path.join(dataBath, "data/users.xlsx"));
  // 재편성
  shuffle(curData.users);

  // 추출된 결과 읽기
  loadTempData()
    .then(data => {
      luckyData = data[0];
      errorData = data[1];
    })
    .catch(data => {
      curData.leftUsers = Object.assign([], curData.users);
    });
}

function getLeftUsers() {
  //  현재 추출된 사용자 기록
  let lotteredUser = {};
  for (let key in luckyData) {
    let luckys = luckyData[key];
    luckys.forEach(item => {
      lotteredUser[item[0]] = true;
    });
  }
  // 현재 추출되었지만 온라인 상태가 아닌 기록
  errorData.forEach(item => {
    lotteredUser[item[0]] = true;
  });

  let leftUsers = Object.assign([], curData.users);
  leftUsers = leftUsers.filter(user => {
    return !lotteredUser[user[0]];
  });
  curData.leftUsers = leftUsers;
}

loadData();

function timestamp(){ 
  var today = new Date(); 
  today.setHours(today.getHours() + 9); 
  return today.toISOString().replace('T', ' ').substring(0, 19); 
}

module.exports = {
  run: function(devPort, noOpen) {
    let openBrowser = true;
    if (process.argv.length > 3) {
      if (process.argv[3] && (process.argv[3] + "").toLowerCase() === "n") {
        openBrowser = false;
      }
    }

    if (noOpen) {
      openBrowser = noOpen !== "n";
    }

    if (devPort) {
      port = devPort;
    }

    let server = app.listen(port, () => {
      let host = server.address().address;
      let port = server.address().port;
      global.console.log(`lottery server listenig at http://${host}:${port}`);
      openBrowser && opn(`http://127.0.0.1:${port}`);
    });
  }
};
