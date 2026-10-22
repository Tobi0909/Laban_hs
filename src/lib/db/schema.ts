import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const taskType = [
  "pick_image",
  "drag_drop",
  "number",
  "true_false",
  "order_steps",
] as const;
export type TaskType = (typeof taskType)[number];

export const contentStatus = ["draft", "approved"] as const;
export type ContentStatus = (typeof contentStatus)[number];

export const calibration = ["match", "over", "under"] as const;
export type Calibration = (typeof calibration)[number];

export const nextStepChoice = [
  "practice",
  "review_example",
  "how_to",
  "harder",
] as const;
export type NextStepChoice = (typeof nextStepChoice)[number];

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  joinCode: text("join_code").notNull().unique(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  avatarId: text("avatar_id").notNull(),
  pictureSecretHash: text("picture_secret_hash").notNull(),
  qrTokenHash: text("qr_token_hash").notNull(),
  allowFreeText: boolean("allow_free_text").notNull().default(false),
  guardianConsentAt: timestamp("guardian_consent_at", {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classSessions = pgTable("class_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  openedBy: uuid("opened_by")
    .notNull()
    .references(() => teachers.id),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  difficulty: integer("difficulty").notNull(),
  type: text("type", { enum: taskType }).notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"),
  options: jsonb("options"),
  answerKey: jsonb("answer_key").notNull(),
  rubric: jsonb("rubric"),
  steps: jsonb("steps"),
  workedExample: jsonb("worked_example"),
  explanation: jsonb("explanation"),
  status: text("status", { enum: contentStatus }).notNull().default("draft"),
  approvedBy: uuid("approved_by").references(() => teachers.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const reflectionTemplates = pgTable("reflection_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  calibration: text("calibration", { enum: calibration }).notNull(),
  mistakeTag: text("mistake_tag"),
  question: text("question").notNull(),
  choices: jsonb("choices").notNull(),
  status: text("status", { enum: contentStatus }).notNull().default("draft"),
  approvedBy: uuid("approved_by").references(() => teachers.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const aiDrafts = pgTable("ai_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classSessionId: uuid("class_session_id")
    .notNull()
    .references(() => classSessions.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id),
  confidence: integer("confidence").notNull(),
  reasonCard: text("reason_card"),
  answer: jsonb("answer"),
  stepsOrder: jsonb("steps_order"),
  isCorrect: boolean("is_correct").notNull(),
  criteriaMet: jsonb("criteria_met"),
  mistakeTag: text("mistake_tag"),
  calibration: text("calibration", { enum: calibration }).notNull(),
  clientId: text("client_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reflections = pgTable("reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => reflectionTemplates.id),
  choiceId: text("choice_id").notNull(),
  freeText: text("free_text"),
});

export const nextSteps = pgTable(
  "next_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    suggested: text("suggested", { enum: nextStepChoice }).notNull(),
    suggestedReasonId: text("suggested_reason_id"),
    chosen: text("chosen", { enum: nextStepChoice }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("next_steps_attempt_id_idx").on(table.attemptId)],
);
