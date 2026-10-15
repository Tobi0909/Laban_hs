import type { TaskType } from "@/lib/db/schema";
import type {
  AnswerValue,
  Explanation,
  TaskAnswerKey,
  TaskContent,
  WorkedExample,
} from "@/lib/learning/types";
import type { ReflectionChoice } from "@/lib/learning/pick-reflection";
import type { Calibration } from "@/lib/learning/grade";

export const TOPIC_TITLE = "Phép cộng có nhớ trong phạm vi 100";

export interface SeedTask {
  difficulty: 1 | 2 | 3;
  type: TaskType;
  prompt: string;
  content: TaskContent;
  answerKey: TaskAnswerKey;
  workedExample: WorkedExample;
  explanation: Explanation;
}

const num = (value: number): AnswerValue => ({ type: "number", value });

export const SEED_TASKS: SeedTask[] = [
  // ---- Độ khó 1: số có 2 chữ số + số có 1 chữ số ----
  {
    difficulty: 1,
    type: "number",
    prompt: "27 cộng 6 bằng mấy?",
    content: { type: "number", maxDigits: 2 },
    answerKey: {
      correct: num(33),
      distractors: [
        { value: num(23), mistakeTag: "quen_nho" },
        { value: num(32), mistakeTag: "nham_hang_chuc" },
        { value: num(39), mistakeTag: "doan_lung_tung" },
      ],
    },
    workedExample: {
      steps: [
        { text: "7 cộng 6 bằng 13, viết 3 nhớ 1 chục", iconId: "drop" },
        { text: "2 chục cộng 1 chục nhớ bằng 3 chục", iconId: "leaf" },
        { text: "Vậy 27 + 6 = 33", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Cộng hàng đơn vị trước, nhớ 1 chục sang hàng chục nếu tổng từ 10 trở lên", iconId: "sun" }],
    },
  },
  {
    difficulty: 1,
    type: "pick_image",
    prompt: "Chọn kết quả đúng của 9 cộng 4",
    content: {
      type: "pick_image",
      options: [
        { id: "opt12", iconId: "star", label: "12" },
        { id: "opt13", iconId: "star", label: "13" },
        { id: "opt14", iconId: "star", label: "14" },
        { id: "opt15", iconId: "star", label: "15" },
      ],
    },
    answerKey: {
      correct: { type: "pick_image", optionId: "opt13" },
      distractors: [
        { value: { type: "pick_image", optionId: "opt12" }, mistakeTag: "doan_lung_tung" },
        { value: { type: "pick_image", optionId: "opt14" }, mistakeTag: "doan_lung_tung" },
        { value: { type: "pick_image", optionId: "opt15" }, mistakeTag: "doan_lung_tung" },
      ],
    },
    workedExample: {
      steps: [
        { text: "Đếm thêm từ 9: 10, 11, 12, 13", iconId: "apple" },
        { text: "9 + 4 = 13", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Khi 2 số cộng lại từ 10 trở lên, kết quả có 2 chữ số", iconId: "sun" }],
    },
  },
  {
    difficulty: 1,
    type: "true_false",
    prompt: "35 cộng 8 bằng 43, đúng hay sai?",
    content: { type: "true_false" },
    answerKey: {
      correct: { type: "true_false", value: true },
      distractors: [{ value: { type: "true_false", value: false }, mistakeTag: "doan_lung_tung" }],
    },
    workedExample: {
      steps: [
        { text: "5 cộng 8 bằng 13, viết 3 nhớ 1 chục", iconId: "drop" },
        { text: "3 chục cộng 1 chục nhớ bằng 4 chục", iconId: "leaf" },
        { text: "Vậy 35 + 8 = 43 — câu này Đúng", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Thử cộng lại từng bước để kiểm tra phép tính đã cho", iconId: "sun" }],
    },
  },

  // ---- Độ khó 2: số có 2 chữ số + số có 2 chữ số ----
  {
    difficulty: 2,
    type: "number",
    prompt: "46 cộng 27 bằng mấy?",
    content: { type: "number", maxDigits: 3 },
    answerKey: {
      correct: num(73),
      distractors: [
        { value: num(63), mistakeTag: "quen_nho" },
        { value: num(77), mistakeTag: "nham_hang_chuc" },
        { value: num(82), mistakeTag: "doan_lung_tung" },
      ],
    },
    workedExample: {
      steps: [
        { text: "6 cộng 7 bằng 13, viết 3 nhớ 1 chục", iconId: "drop" },
        { text: "4 chục cộng 2 chục cộng 1 chục nhớ bằng 7 chục", iconId: "leaf" },
        { text: "Vậy 46 + 27 = 73", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Đừng quên cộng thêm số nhớ vào hàng chục", iconId: "sun" }],
    },
  },
  {
    difficulty: 2,
    type: "drag_drop",
    prompt: "Kéo thẻ số vào đúng hàng Chục và hàng Đơn vị của số 58",
    content: {
      type: "drag_drop",
      items: [
        { id: "chip5", label: "5" },
        { id: "chip8", label: "8" },
      ],
      targets: [
        { id: "box_chuc", label: "Hàng chục" },
        { id: "box_donvi", label: "Hàng đơn vị" },
      ],
    },
    answerKey: {
      correct: { type: "drag_drop", mapping: { chip5: "box_chuc", chip8: "box_donvi" } },
      distractors: [
        {
          value: { type: "drag_drop", mapping: { chip5: "box_donvi", chip8: "box_chuc" } },
          mistakeTag: "nham_hang_chuc",
        },
      ],
    },
    workedExample: {
      steps: [
        { text: "Số 58 có 5 chục và 8 đơn vị", iconId: "leaf" },
        { text: "Chữ số đứng trước là hàng chục, đứng sau là hàng đơn vị", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Hàng chục luôn đứng bên trái, hàng đơn vị đứng bên phải", iconId: "sun" }],
    },
  },
  {
    difficulty: 2,
    type: "true_false",
    prompt: "68 cộng 15 bằng 84, đúng hay sai?",
    content: { type: "true_false" },
    answerKey: {
      correct: { type: "true_false", value: false },
      distractors: [{ value: { type: "true_false", value: true }, mistakeTag: "doan_lung_tung" }],
    },
    workedExample: {
      steps: [
        { text: "8 cộng 5 bằng 13, viết 3 nhớ 1 chục", iconId: "drop" },
        { text: "6 chục cộng 1 chục cộng 1 chục nhớ bằng 8 chục", iconId: "leaf" },
        { text: "Vậy 68 + 15 = 83 — câu đề bài nói 84 là Sai", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Cộng lại cẩn thận từng hàng rồi so sánh với số đề bài cho", iconId: "sun" }],
    },
  },

  // ---- Độ khó 3: tổng vượt 100 hoặc quy trình nhiều bước ----
  {
    difficulty: 3,
    type: "number",
    prompt: "76 cộng 48 bằng mấy?",
    content: { type: "number", maxDigits: 3 },
    answerKey: {
      correct: num(124),
      distractors: [
        { value: num(114), mistakeTag: "quen_nho" },
        { value: num(104), mistakeTag: "nham_hang_chuc" },
        { value: num(118), mistakeTag: "doan_lung_tung" },
      ],
    },
    workedExample: {
      steps: [
        { text: "6 cộng 8 bằng 14, viết 4 nhớ 1 chục", iconId: "drop" },
        { text: "7 chục cộng 4 chục cộng 1 chục nhớ bằng 12 chục", iconId: "leaf" },
        { text: "Vậy 76 + 48 = 124", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Khi hàng chục cộng lại từ 10 trở lên, kết quả có thêm hàng trăm", iconId: "sun" }],
    },
  },
  {
    difficulty: 3,
    type: "order_steps",
    prompt: "Sắp xếp đúng các bước cộng có nhớ của phép tính 64 cộng 19",
    content: {
      type: "order_steps",
      steps: [
        { id: "s4", text: "Vậy 64 + 19 = 83", iconId: "star" },
        { id: "s1", text: "Cộng hàng đơn vị: 4 + 9 = 13, viết 3 nhớ 1", iconId: "drop" },
        { id: "s3", text: "Viết 8 vào hàng chục của kết quả", iconId: "sun" },
        { id: "s2", text: "Cộng hàng chục: 6 + 1 = 7, cộng thêm 1 nhớ = 8", iconId: "leaf" },
      ],
    },
    answerKey: {
      correct: { type: "order_steps", order: ["s1", "s2", "s3", "s4"] },
      distractors: [
        {
          value: { type: "order_steps", order: ["s2", "s1", "s3", "s4"] },
          mistakeTag: "nham_hang_chuc",
        },
        {
          value: { type: "order_steps", order: ["s1", "s3", "s2", "s4"] },
          mistakeTag: "doan_lung_tung",
        },
      ],
    },
    workedExample: {
      steps: [
        { text: "Luôn cộng hàng đơn vị trước", iconId: "drop" },
        { text: "Rồi mới cộng hàng chục (nhớ cộng thêm số nhớ)", iconId: "leaf" },
        { text: "Cuối cùng viết kết quả đầy đủ", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Thứ tự luôn là: đơn vị trước, chục sau, rồi mới viết kết quả", iconId: "sun" }],
    },
  },
  {
    difficulty: 3,
    type: "drag_drop",
    prompt: "Kéo thẻ số vào đúng hàng Chục và hàng Đơn vị của số 76",
    content: {
      type: "drag_drop",
      items: [
        { id: "chip7", label: "7" },
        { id: "chip6", label: "6" },
      ],
      targets: [
        { id: "box_chuc", label: "Hàng chục" },
        { id: "box_donvi", label: "Hàng đơn vị" },
      ],
    },
    answerKey: {
      correct: { type: "drag_drop", mapping: { chip7: "box_chuc", chip6: "box_donvi" } },
      distractors: [
        {
          value: { type: "drag_drop", mapping: { chip7: "box_donvi", chip6: "box_chuc" } },
          mistakeTag: "nham_hang_chuc",
        },
      ],
    },
    workedExample: {
      steps: [
        { text: "Số 76 có 7 chục và 6 đơn vị", iconId: "leaf" },
        { text: "Chữ số đứng trước (7) là hàng chục", iconId: "star" },
      ],
    },
    explanation: {
      steps: [{ text: "Đọc số từ trái sang phải: hàng chục rồi đến hàng đơn vị", iconId: "sun" }],
    },
  },
];

export interface SeedReflectionTemplate {
  calibration: Calibration;
  mistakeTag: string | null;
  question: string;
  choices: ReflectionChoice[];
}

export const SEED_REFLECTION_TEMPLATES: SeedReflectionTemplate[] = [
  // match (đoán đúng về bản thân)
  {
    calibration: "match",
    mistakeTag: null,
    question: "Em đoán rất đúng về bản thân! Điều gì giúp em biết vậy?",
    choices: [
      { id: "c1", label: "Em đã luyện nhiều rồi" },
      { id: "c2", label: "Em nhớ cách làm" },
      { id: "c3", label: "Em thấy bài giống bài cũ" },
    ],
  },
  {
    calibration: "match",
    mistakeTag: null,
    question: "Em biết rất rõ sức mình. Em cảm thấy thế nào?",
    choices: [
      { id: "c1", label: "Em thấy vui" },
      { id: "c2", label: "Em thấy tự tin hơn" },
    ],
  },
  {
    calibration: "match",
    mistakeTag: null,
    question: "Dự đoán của em khớp với kết quả đấy! Em học được điều gì?",
    choices: [
      { id: "c1", label: "Em hiểu bài này rồi" },
      { id: "c2", label: "Em cần cô giúp đúng như em nghĩ" },
      { id: "c3", label: "Em sẽ nhớ cách này" },
    ],
  },

  // under (tự tin thấp nhưng làm đúng)
  {
    calibration: "under",
    mistakeTag: null,
    question: "Em làm đúng rồi đấy! Vì sao lúc đầu em chưa chắc chắn?",
    choices: [
      { id: "c1", label: "Em thấy bài hơi lạ" },
      { id: "c2", label: "Em quên nhưng rồi nhớ ra" },
      { id: "c3", label: "Em chỉ đoán thôi mà trúng" },
    ],
  },
  {
    calibration: "under",
    mistakeTag: null,
    question: "Em giỏi hơn em nghĩ đấy! Lần sau em sẽ tự tin hơn chứ?",
    choices: [
      { id: "c1", label: "Có, em sẽ tự tin hơn" },
      { id: "c2", label: "Em vẫn muốn hỏi cô trước" },
    ],
  },
  {
    calibration: "under",
    mistakeTag: null,
    question: "Kim thấy em làm đúng rồi! Điều gì đã giúp em làm được?",
    choices: [
      { id: "c1", label: "Em nhớ ra cách làm" },
      { id: "c2", label: "Em tính cẩn thận từng bước" },
      { id: "c3", label: "Em may mắn thôi" },
    ],
  },

  // over (tự tin cao nhưng sai) — 1 mẫu / mistake_tag
  {
    calibration: "over",
    mistakeTag: "quen_nho",
    question: "Hình như em quên nhớ 1 chục rồi. Lần sau em sẽ làm gì?",
    choices: [
      { id: "c1", label: "Em sẽ nhớ viết số nhớ" },
      { id: "c2", label: "Em sẽ tính lại cẩn thận" },
      { id: "c3", label: "Em sẽ hỏi cô" },
    ],
  },
  {
    calibration: "over",
    mistakeTag: "nham_hang_chuc",
    question: "Em nhầm giữa hàng chục và hàng đơn vị rồi. Em sẽ làm gì?",
    choices: [
      { id: "c1", label: "Em sẽ nhìn kỹ vị trí từng số" },
      { id: "c2", label: "Em sẽ tính lại từ đầu" },
      { id: "c3", label: "Em sẽ hỏi cô" },
    ],
  },
  {
    calibration: "over",
    mistakeTag: "doan_lung_tung",
    question: "Có vẻ em đoán hơi nhanh. Lần sau em sẽ làm gì?",
    choices: [
      { id: "c1", label: "Em sẽ tính từng bước thay vì đoán" },
      { id: "c2", label: "Em sẽ xem lại ví dụ trước" },
    ],
  },
];
