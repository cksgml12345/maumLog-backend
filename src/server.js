import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "..", "data", "db.json");
const app = express();
const port = Number(process.env.PORT || 8080);

const emotionPresets = [
  {
    code: "JP",
    keywords: "#미소 #가벼움 #작은행복",
    empathy: "오늘은 잔잔하지만 분명한 기쁨이 있었어요. 그 순간들을 천천히 오래 붙잡아도 괜찮아요.",
    score: "82/100",
    summary: "오늘 하루는 사소한 장면 속에서 기쁨이 천천히 번져간 하루였어요."
  },
  {
    code: "HP",
    keywords: "#행복 #충만함 #따뜻함",
    empathy: "마음이 꽤 따뜻해진 하루였네요. 좋은 감정은 나를 지탱해주는 기록이 되니 충분히 누려도 좋아요.",
    score: "91/100",
    summary: "오늘 하루는 행복이 선명하게 남아 있는 하루였어요."
  },
  {
    code: "PR",
    keywords: "#성취 #뿌듯함 #발전",
    empathy: "스스로를 칭찬해도 좋은 날이에요. 해낸 감각이 앞으로의 자신감을 만들어줄 거예요.",
    score: "87/100",
    summary: "오늘 하루는 해냈다는 감정이 또렷하게 남은 하루였어요."
  },
  {
    code: "TI",
    keywords: "#피곤 #휴식 #회복",
    empathy: "많이 애쓴 흔적이 보여요. 오늘은 잘 버틴 것만으로도 충분하고, 쉬는 것도 중요한 선택이에요.",
    score: "58/100",
    summary: "오늘 하루는 피로가 누적되어 몸과 마음이 쉬고 싶어한 하루였어요."
  },
  {
    code: "SD",
    keywords: "#슬픔 #위로 #감정정리",
    empathy: "마음이 쉽게 가라앉지 않았던 하루였네요. 억지로 괜찮아지려 하기보다, 슬픈 마음을 알아주는 게 먼저예요.",
    score: "42/100",
    summary: "오늘 하루는 슬픔과 서운함이 조용히 남아 있는 하루였어요."
  },
  {
    code: "AN",
    keywords: "#화남 #답답함 #거리두기",
    empathy: "속이 많이 답답했을 수 있어요. 감정이 커질수록 잠시 멈추고 내 마음의 경계를 지켜주는 게 중요해요.",
    score: "39/100",
    summary: "오늘 하루는 답답함과 화가 마음을 크게 흔든 하루였어요."
  },
  {
    code: "AX",
    keywords: "#불안 #긴장 #숨고르기",
    empathy: "마음이 자주 흔들렸던 것 같아요. 불안을 없애려 하기보다, 지금 안전하다는 감각을 조금씩 회복해보면 좋아요.",
    score: "47/100",
    summary: "오늘 하루는 긴장과 불안이 계속 마음 주변을 맴돈 하루였어요."
  },
  {
    code: "DP",
    keywords: "#우울 #무기력 #돌봄",
    empathy: "많이 지치고 무거운 하루였겠어요. 작은 일 하나만 해내도 충분하니, 오늘은 나를 덜 몰아붙여도 괜찮아요.",
    score: "31/100",
    summary: "오늘 하루는 무기력과 우울감이 깊게 내려앉은 하루였어요."
  }
];

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

async function ensureDbFile() {
  try {
    await fs.access(dataFile);
  } catch {
    const initialDb = {
      users: [],
      diaries: [],
      nextUserId: 1,
      nextDiaryId: 1
    };
    await fs.writeFile(dataFile, JSON.stringify(initialDb, null, 2));
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(dataFile, JSON.stringify(db, null, 2));
}

function buildToken(userId) {
  return `maumlog-token-${userId}`;
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

function detectEmotionCode(content) {
  const normalized = String(content || "").toLowerCase();

  const rules = [
    { code: "AN", words: ["화", "짜증", "분노", "열받", "답답", "angry"] },
    { code: "AX", words: ["불안", "걱정", "초조", "긴장", "anxious"] },
    { code: "DP", words: ["우울", "무기력", "허무", "depress"] },
    { code: "SD", words: ["슬프", "슬픈", "눈물", "서운", "sad"] },
    { code: "TI", words: ["피곤", "피곤했", "지쳤", "졸리", "힘들", "tired"] },
    { code: "PR", words: ["뿌듯", "성취", "해냈", "자랑", "proud"] },
    { code: "HP", words: ["행복", "행복했", "좋았", "기뻤", "즐거", "happy"] },
    { code: "JP", words: ["기쁨", "웃", "설렜", "신났", "joy"] }
  ];

  const hit = rules.find((rule) =>
    rule.words.some((word) => normalized.includes(word))
  );

  return hit?.code || "HP";
}

function analyzeDiaryContent(content) {
  const safeContent = String(content || "").trim();
  const preview = safeContent ? safeContent.replace(/\s+/g, " ").slice(0, 80) : "오늘 하루를 담은 기록";
  const emotionCode = detectEmotionCode(safeContent);
  const preset =
    emotionPresets.find((entry) => entry.code === emotionCode) || emotionPresets[1];

  return {
    condition1_response: `${preset.summary} ${safeContent ? `특히 "${preview}"라는 마음이 인상적이었어요.` : ""}`.trim(),
    condition2_response: `오늘의 노래 추천: ${emotionCode === "HP" || emotionCode === "JP" ? "AKMU - 시간과 낙엽" : "아이유 - 마음"}`,
    condition3_response: preset.score,
    condition4_response: preset.code,
    condition5_response: preset.empathy,
    condition6_response: preset.keywords,
    ai_response: safeContent || "기록된 일기 내용이 아직 없습니다."
  };
}

function withoutPassword(user) {
  const { login_password, ...safeUser } = user;
  return safeUser;
}

async function resolveCurrentUser(req) {
  const db = await readDb();
  const token = getTokenFromRequest(req);
  let user = null;

  if (token) {
    user = db.users.find((entry) => entry.access_token === token) || null;
  }

  if (!user && db.users.length > 0) {
    user = db.users[0];
  }

  return { db, user };
}

app.get("/service1/health", async (_req, res) => {
  const db = await readDb();
  res.json({
    success: true,
    users: db.users.length,
    diaries: db.diaries.length
  });
});

app.post("/service1/user/check", async (req, res) => {
  const db = await readDb();
  const loginId = String(req.body.login_id || "").trim();
  const exists = db.users.some((user) => user.login_id === loginId);

  res.json({
    success: true,
    available: loginId.length >= 5 && !exists
  });
});

app.post("/service1/user/signup", async (req, res) => {
  const db = await readDb();
  const {
    login_id,
    login_password,
    password_confirm,
    user_name,
    nickname,
    birth_date,
    email
  } = req.body;

  if (!login_id || !login_password || !user_name || !birth_date) {
    return res.status(400).json({
      success: false,
      message: "필수 항목을 모두 입력해주세요."
    });
  }

  if (login_password !== password_confirm) {
    return res.status(400).json({
      success: false,
      message: "비밀번호가 일치하지 않습니다."
    });
  }

  if (db.users.some((user) => user.login_id === login_id)) {
    return res.status(409).json({
      success: false,
      message: "이미 사용 중인 아이디입니다."
    });
  }

  const userId = db.nextUserId++;
  const newUser = {
    user_id: userId,
    login_id,
    login_password,
    user_name,
    nickname: nickname || user_name,
    birth_date,
    email: email || "",
    mbti: "",
    user_description: "",
    access_token: buildToken(userId),
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  await writeDb(db);

  return res.status(201).json({
    success: true,
    message: "회원가입이 완료되었습니다.",
    user_id: userId
  });
});

app.post("/service1/user/login", async (req, res) => {
  const db = await readDb();
  const { login_id, login_password } = req.body;
  const user = db.users.find(
    (entry) =>
      entry.login_id === login_id && entry.login_password === login_password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "아이디 또는 비밀번호가 올바르지 않습니다."
    });
  }

  if (!user.access_token) {
    user.access_token = buildToken(user.user_id);
    await writeDb(db);
  }

  return res.json({
    success: true,
    access_token: user.access_token,
    user_name: user.user_name,
    nickname: user.nickname
  });
});

app.post("/service1/user/profile", async (req, res) => {
  const { user } = await resolveCurrentUser(req);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "사용자를 찾을 수 없습니다."
    });
  }

  return res.json({
    success: true,
    ...withoutPassword(user)
  });
});

app.post("/service1/user/profile/update", async (req, res) => {
  const { db, user } = await resolveCurrentUser(req);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "사용자를 찾을 수 없습니다."
    });
  }

  const { user_name, nickname, mbti, user_description, email } = req.body;
  user.user_name = user_name ?? user.user_name;
  user.nickname = nickname ?? user.nickname;
  user.mbti = mbti ?? user.mbti;
  user.user_description = user_description ?? user.user_description;
  user.email = email ?? user.email;

  await writeDb(db);

  return res.json({
    success: true,
    ...withoutPassword(user)
  });
});

app.post("/service1/diaryChat/ai-response", async (req, res) => {
  const { content, record_date } = req.body;
  const analysis = analyzeDiaryContent(content);

  res.json({
    success: true,
    record_date,
    ...analysis
  });
});

app.post("/service1/diaryChat/create", async (req, res) => {
  const { db, user } = await resolveCurrentUser(req);
  const payload = req.body || {};
  const diaryIdx = db.nextDiaryId++;
  const analysis = payload.condition4_response
    ? {
        condition1_response: payload.condition1_response || "",
        condition2_response: payload.condition2_response || "",
        condition3_response: payload.condition3_response || "",
        condition4_response: payload.condition4_response || "HP",
        condition5_response: payload.condition5_response || "",
        condition6_response: payload.condition6_response || "",
        ai_response: payload.ai_response || payload.content || ""
      }
    : analyzeDiaryContent(payload.content);

  const diary = {
    diary_idx: diaryIdx,
    user_id: user?.user_id || null,
    content: payload.content || "",
    record_date: payload.record_date || new Date().toISOString().slice(0, 10),
    condition1: payload.condition1 || "",
    condition2: payload.condition2 || "",
    condition3: payload.condition3 || "",
    condition4: payload.condition4 || "",
    condition5: payload.condition5 || "",
    condition6: payload.condition6 || "",
    ai_model: payload.ai_model || "local-maumlog-analyzer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...analysis
  };

  db.diaries.push(diary);
  await writeDb(db);

  res.status(201).json({
    success: true,
    diary_idx: diaryIdx,
    data: diary
  });
});

app.post("/service1/diaryChat/list", async (req, res) => {
  const { db, user } = await resolveCurrentUser(req);
  const { start_date, page = 1, page_size = 100 } = req.body || {};

  let diaries = db.diaries.filter((entry) =>
    user?.user_id ? entry.user_id === user.user_id : true
  );

  if (start_date) {
    diaries = diaries.filter((entry) => entry.record_date.startsWith(start_date));
  }

  diaries.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));

  const pageNumber = Number(page) || 1;
  const pageSizeNumber = Number(page_size) || 100;
  const start = (pageNumber - 1) * pageSizeNumber;
  const data = diaries.slice(start, start + pageSizeNumber);

  res.json({
    success: true,
    data,
    total: diaries.length,
    page: pageNumber,
    page_size: pageSizeNumber
  });
});

app.post("/service1/diaryChat/detail", async (req, res) => {
  const db = await readDb();
  const diaryIdx = Number(req.body.diary_idx);
  const diary = db.diaries.find((entry) => entry.diary_idx === diaryIdx);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: "일기를 찾을 수 없습니다."
    });
  }

  res.json({
    success: true,
    data: diary
  });
});

app.post("/service1/diaryChat/update", async (req, res) => {
  const db = await readDb();
  const diaryIdx = Number(req.body.diary_idx);
  const diary = db.diaries.find((entry) => entry.diary_idx === diaryIdx);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: "일기를 찾을 수 없습니다."
    });
  }

  diary.content = req.body.content ?? diary.content;
  diary.updated_at = new Date().toISOString();
  const refreshedAnalysis = analyzeDiaryContent(diary.content);
  Object.assign(diary, refreshedAnalysis);

  await writeDb(db);

  res.json({
    success: true,
    data: diary
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "서버 오류가 발생했습니다."
  });
});

ensureDbFile()
  .then(() => {
    app.listen(port, () => {
      console.log(`maumlog-backend listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
