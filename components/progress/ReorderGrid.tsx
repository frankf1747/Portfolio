"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import { progressClient } from "@/lib/progress/client";
import { moveItem, positionChanges } from "@/lib/progress/order";
import type { ProjectSummary } from "@/lib/progress/types";
import ProjectCard from "./ProjectCard";
import "./reorder.scss";

/* The overview in the owner's edit mode. Cards keep their normal look; a bar
   above each adds a drag handle and ↑ ↓ buttons (keyboard, and phones where
   dragging is fiddly). Every move is saved at once: only the rows whose
   position changed are written, and realtime brings everyone's page along. */
export default function ReorderGrid({
  projects,
  now,
  onSaving,
  onError
}: {
  projects: ProjectSummary[];
  now: Date;
  onSaving: (saving: boolean) => void;
  onError: (message: string | null) => void;
}) {
  const bySlug = new Map(projects.map((s) => [s.project.slug, s]));
  const incoming = projects.map((s) => s.project.slug);
  const [order, setOrder] = useState(incoming);
  const saving = useRef(false);

  /* Follow the server's order (realtime refetches) unless a save is in
     flight, so a refetch landing mid-save can't snap the cards back. */
  const incomingKey = incoming.join("|");
  useEffect(() => {
    if (!saving.current) setOrder(incomingKey.split("|").filter(Boolean));
  }, [incomingKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const save = async (next: string[]) => {
    const db = progressClient();
    if (!db) return;
    const current = Object.fromEntries(projects.map((s) => [s.project.slug, s.project.position]));
    const changes = positionChanges(next, current);
    if (!changes.length) return;
    setOrder(next);
    saving.current = true;
    onSaving(true);
    onError(null);
    try {
      for (const { slug, position } of changes) {
        const { data, error } = await db.from("projects").update({ position }).eq("slug", slug).select("slug");
        if (error) throw new Error(error.message);
        // RLS filters rather than errors: no row back means the write was refused.
        if (!data?.length) throw new Error("The database refused the change. Are you signed in as the owner?");
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
      setOrder(incoming);
    } finally {
      saving.current = false;
      onSaving(false);
    }
  };

  const move = (from: number, to: number) => save(moveItem(order, from, to));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(order.indexOf(String(active.id)), order.indexOf(String(over.id)));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <ol className="pg-grid pg-reorder" aria-label="Projects, in display order">
          {order.map((slug, i) => {
            const summary = bySlug.get(slug);
            if (!summary) return null;
            return (
              <SortableCard
                key={slug}
                summary={summary}
                now={now}
                index={i}
                count={order.length}
                onMove={move}
              />
            );
          })}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({
  summary,
  now,
  index,
  count,
  onMove
}: {
  summary: ProjectSummary;
  now: Date;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: summary.project.slug });
  const name = summary.project.name;

  return (
    <li
      ref={setNodeRef}
      className={`pg-sort${isDragging ? " is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="small pg-sort__bar">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="pg-sort__handle"
          aria-label={`Drag ${name} to reorder`}
          {...attributes}
          {...listeners}
        >
          ⠿ DRAG
        </button>
        <span className="pg-sort__pos" aria-hidden="true">
          {index + 1}
        </span>
        <span className="pg-sort__arrows">
          <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${name} up`}>
            ↑
          </button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label={`Move ${name} down`}>
            ↓
          </button>
        </span>
      </div>
      {/* The card stays a link for visitors; while reordering, a click on it
          should not navigate away mid-arrangement. */}
      <div className="pg-sort__card" onClickCapture={(e) => e.preventDefault()}>
        <ProjectCard summary={summary} now={now} />
      </div>
    </li>
  );
}
