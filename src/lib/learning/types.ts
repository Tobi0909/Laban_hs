import type { TaskType } from "@/lib/db/schema";
import type { IconId } from "@/components/kid/icons";

export const MISTAKE_TAGS = ["quen_nho", "nham_hang_chuc", "doan_lung_tung"] as const;
export type MistakeTag = (typeof MISTAKE_TAGS)[number];

export const MISTAKE_TAG_LABELS_VI: Record<MistakeTag, string> = {
  quen_nho: "Quên nhớ 1 chục",
  nham_hang_chuc: "Nhầm hàng chục — hàng đơn vị",
  doan_lung_tung: "Đoán số lung tung",
};

export interface PickImageOption {
  id: string;
  iconId: IconId;
  label: string;
}

export interface PickImageContent {
  type: "pick_image";
  options: PickImageOption[];
}

export interface DragItem {
  id: string;
  label: string;
}

export interface DragTarget {
  id: string;
  label: string;
}

export interface DragDropContent {
  type: "drag_drop";
  items: DragItem[];
  targets: DragTarget[];
}

export interface NumberContent {
  type: "number";
  maxDigits: number;
}

export interface TrueFalseContent {
  type: "true_false";
}

export interface StepCard {
  id: string;
  text: string;
  iconId: IconId;
}

export interface OrderStepsContent {
  type: "order_steps";
  /** Thứ tự hiển thị ban đầu (đã xáo trộn) — KHÔNG phải thứ tự đúng. */
  steps: StepCard[];
}

export type TaskContent =
  | PickImageContent
  | DragDropContent
  | NumberContent
  | TrueFalseContent
  | OrderStepsContent;

export type AnswerValue =
  | { type: "pick_image"; optionId: string }
  | { type: "drag_drop"; mapping: Record<string, string> }
  | { type: "number"; value: number }
  | { type: "true_false"; value: boolean }
  | { type: "order_steps"; order: string[] };

export interface Distractor {
  value: AnswerValue;
  mistakeTag: MistakeTag;
}

/** Nằm trong answer_key — KHÔNG BAO GIỜ gửi xuống client trước khi nộp bài. */
export interface TaskAnswerKey {
  correct: AnswerValue;
  distractors: Distractor[];
}

export interface StepExplanationItem {
  text: string;
  iconId: IconId;
}

export interface WorkedExample {
  steps: StepExplanationItem[];
}

export interface Explanation {
  steps: StepExplanationItem[];
}

export type { TaskType };
