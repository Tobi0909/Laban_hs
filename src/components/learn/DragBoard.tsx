"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { DragItem, DragTarget } from "@/lib/learning/types";
import { vi } from "@/lib/i18n/vi";
import { clsx } from "@/lib/clsx";

export interface DragBoardProps {
  items: DragItem[];
  targets: DragTarget[];
  onSubmit: (mapping: Record<string, string>) => void;
  disabled?: boolean;
}

function Chip({ item, disabled }: { item: DragItem; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        "flex h-16 w-16 touch-none items-center justify-center rounded-[20px] border-b-[6px] border-sky-deep bg-sky font-baloo text-2xl font-bold text-ink",
        isDragging && "z-10 opacity-80",
      )}
    >
      {item.label}
    </button>
  );
}

function TargetBox({
  target,
  placedItem,
}: {
  target: DragTarget;
  placedItem: DragItem | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-h-24 w-28 flex-col items-center justify-center gap-2 rounded-[20px] border-4 border-dashed bg-card p-2 text-center",
        isOver ? "border-sun" : "border-border",
      )}
    >
      <span className="font-nunito text-sm text-ink/60">{target.label}</span>
      {placedItem ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-sky font-baloo text-xl font-bold text-ink">
          {placedItem.label}
        </span>
      ) : (
        <span className="h-12 w-12 rounded-[16px] border-2 border-dashed border-border/60" />
      )}
    </div>
  );
}

export function DragBoard({ items, targets, onSubmit, disabled }: DragBoardProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    setMapping((prev) => {
      const next = { ...prev };
      // Mỗi ô chỉ chứa 1 thẻ — gỡ thẻ khác đang ở ô này nếu có.
      for (const [itemId, targetId] of Object.entries(next)) {
        if (targetId === over.id && itemId !== active.id) delete next[itemId];
      }
      next[String(active.id)] = String(over.id);
      return next;
    });
  };

  const unplacedItems = items.filter((i) => !mapping[i.id]);
  const allPlaced = items.every((i) => mapping[i.id]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex w-full flex-col items-center gap-6">
        <p className="text-center font-nunito text-lg text-ink/70">{vi.learn.dragHint}</p>

        <div className="flex gap-4">
          {targets.map((t) => {
            const itemId = Object.entries(mapping).find(([, targetId]) => targetId === t.id)?.[0];
            const placedItem = items.find((i) => i.id === itemId) ?? null;
            return <TargetBox key={t.id} target={t} placedItem={placedItem} />;
          })}
        </div>

        <div className="flex min-h-20 gap-3 rounded-[20px] border border-dashed border-border p-3">
          {unplacedItems.length === 0 && (
            <span className="self-center text-sm text-ink/40">Đã kéo hết thẻ</span>
          )}
          {unplacedItems.map((item) => (
            <Chip key={item.id} item={item} disabled={disabled} />
          ))}
        </div>

        <button
          type="button"
          disabled={disabled || !allPlaced}
          onClick={() => onSubmit(mapping)}
          className="rounded-lg bg-sky-deep px-5 py-2 font-medium text-white disabled:opacity-50"
        >
          {vi.learn.submit}
        </button>
      </div>
    </DndContext>
  );
}
