import type {
  DragItem,
  DragTarget,
  MistakeTag,
  PickImageOption,
  StepCard,
  TaskAnswerKey,
  TaskContent,
} from "@/lib/learning/types";
import type { IconId } from "@/components/kid/icons";

export interface DerivedTask {
  content: TaskContent;
  answerKey: TaskAnswerKey;
}

export interface PickImageFormInput {
  type: "pick_image";
  options: PickImageOption[];
  correctOptionId: string;
  distractorTags: Record<string, MistakeTag>;
}

export function derivePickImage(input: PickImageFormInput): DerivedTask {
  const distractors = input.options
    .filter((o) => o.id !== input.correctOptionId && input.distractorTags[o.id])
    .map((o) => ({
      value: { type: "pick_image" as const, optionId: o.id },
      mistakeTag: input.distractorTags[o.id],
    }));

  return {
    content: { type: "pick_image", options: input.options },
    answerKey: {
      correct: { type: "pick_image", optionId: input.correctOptionId },
      distractors,
    },
  };
}

export interface NumberFormInput {
  type: "number";
  maxDigits: number;
  correctValue: number;
  distractors: { value: number; mistakeTag: MistakeTag }[];
}

export function deriveNumber(input: NumberFormInput): DerivedTask {
  return {
    content: { type: "number", maxDigits: input.maxDigits },
    answerKey: {
      correct: { type: "number", value: input.correctValue },
      distractors: input.distractors.map((d) => ({
        value: { type: "number", value: d.value },
        mistakeTag: d.mistakeTag,
      })),
    },
  };
}

export interface TrueFalseFormInput {
  type: "true_false";
  correctValue: boolean;
}

export function deriveTrueFalse(input: TrueFalseFormInput): DerivedTask {
  return {
    content: { type: "true_false" },
    answerKey: {
      correct: { type: "true_false", value: input.correctValue },
      distractors: [{ value: { type: "true_false", value: !input.correctValue }, mistakeTag: "doan_lung_tung" }],
    },
  };
}

export interface DragDropFormInput {
  type: "drag_drop";
  items: DragItem[];
  targets: DragTarget[];
  correctMapping: Record<string, string>;
}

export function deriveDragDrop(input: DragDropFormInput): DerivedTask {
  const distractors: TaskAnswerKey["distractors"] = [];

  if (input.items.length > 1 && input.targets.length > 1) {
    // Hoán vị: mỗi thẻ nhận ô của thẻ kế tiếp — mô phỏng lỗi nhầm vị trí.
    const rotatedMapping: Record<string, string> = {};
    input.items.forEach((item, i) => {
      const nextItem = input.items[(i + 1) % input.items.length];
      rotatedMapping[item.id] = input.correctMapping[nextItem.id];
    });
    distractors.push({
      value: { type: "drag_drop", mapping: rotatedMapping },
      mistakeTag: "nham_hang_chuc",
    });
  }

  return {
    content: { type: "drag_drop", items: input.items, targets: input.targets },
    answerKey: {
      correct: { type: "drag_drop", mapping: input.correctMapping },
      distractors,
    },
  };
}

export interface OrderStepsFormInput {
  type: "order_steps";
  /** Các bước nhập theo ĐÚNG thứ tự — hệ thống tự xáo trộn khi hiển thị cho học sinh. */
  stepsInCorrectOrder: { id: string; text: string; iconId: IconId }[];
}

function reversed<T>(arr: T[]): T[] {
  return [...arr].reverse();
}

function swappedFirstTwo<T>(arr: T[]): T[] {
  if (arr.length < 2) return [...arr];
  const copy = [...arr];
  [copy[0], copy[1]] = [copy[1], copy[0]];
  return copy;
}

export function deriveOrderSteps(input: OrderStepsFormInput): DerivedTask {
  const steps: StepCard[] = input.stepsInCorrectOrder.map(({ id, text, iconId }) => ({ id, text, iconId }));
  const correctOrder = steps.map((s) => s.id);
  const shuffledForDisplay = reversed(steps);

  const distractors: TaskAnswerKey["distractors"] = [];
  const swapped = swappedFirstTwo(correctOrder);
  if (swapped.join(",") !== correctOrder.join(",")) {
    distractors.push({ value: { type: "order_steps", order: swapped }, mistakeTag: "nham_hang_chuc" });
  }
  const reversedOrder = reversed(correctOrder);
  if (
    reversedOrder.join(",") !== correctOrder.join(",") &&
    reversedOrder.join(",") !== swapped.join(",")
  ) {
    distractors.push({ value: { type: "order_steps", order: reversedOrder }, mistakeTag: "doan_lung_tung" });
  }

  return {
    content: { type: "order_steps", steps: shuffledForDisplay },
    answerKey: {
      correct: { type: "order_steps", order: correctOrder },
      distractors,
    },
  };
}

export type TaskFormInput =
  | PickImageFormInput
  | NumberFormInput
  | TrueFalseFormInput
  | DragDropFormInput
  | OrderStepsFormInput;

export function deriveTask(input: TaskFormInput): DerivedTask {
  switch (input.type) {
    case "pick_image":
      return derivePickImage(input);
    case "number":
      return deriveNumber(input);
    case "true_false":
      return deriveTrueFalse(input);
    case "drag_drop":
      return deriveDragDrop(input);
    case "order_steps":
      return deriveOrderSteps(input);
  }
}
