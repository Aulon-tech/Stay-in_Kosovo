"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Stop = {
  placeId: string;
  order: number;
  plannedTime?: string;
  transportMode?: string;
};

function SortableRow({
  id,
  index,
  name,
  stop,
  onChange,
}: {
  id: string;
  index: number;
  name: string;
  stop: Stop;
  onChange: (stop: Stop) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative mb-4">
      <div className="timeline-dot" aria-hidden />
      <div className="kg-card ml-2 p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-1 cursor-grab touch-none text-kg-muted"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
          <div className="flex-1">
            {stop.plannedTime && (
              <span className="tag-neutral mb-1 inline-block">{stop.plannedTime}</span>
            )}
            <p className="text-sm font-semibold text-kg-neutral">
              {name}
            </p>
            <input
              className="input-kg mt-2 !rounded-kg !py-1.5 text-xs"
              value={stop.plannedTime || ""}
              onChange={(e) => onChange({ ...stop, plannedTime: e.target.value })}
              placeholder="HH:MM"
              aria-label="Planned time"
            />
            <select
              className="mt-2 w-full rounded-kg border border-kg-border p-2 text-xs text-kg-neutral"
              value={stop.transportMode || "WALK"}
              onChange={(e) =>
                onChange({ ...stop, transportMode: e.target.value })
              }
              aria-label="Transport mode"
            >
              <option value="WALK">Walk</option>
              <option value="BUS">Bus</option>
              <option value="TAXI">Taxi</option>
              <option value="BIKE">Bike</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SortableStops({
  stops,
  placeMap,
  onChange,
}: {
  stops: Stop[];
  placeMap: Map<string, string>;
  onChange: (s: Stop[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stops.findIndex((s) => s.placeId === active.id);
    const newIndex = stops.findIndex((s) => s.placeId === over.id);
    const moved = arrayMove(stops, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    onChange(moved);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={stops.map((s) => s.placeId)}
        strategy={verticalListSortingStrategy}
      >
        {stops.map((stop, index) => (
          <SortableRow
            key={stop.placeId}
            id={stop.placeId}
            index={index}
            name={placeMap.get(stop.placeId) || stop.placeId}
            stop={stop}
            onChange={(updated) => {
              const next = stops.map((s) =>
                s.placeId === stop.placeId ? updated : s
              );
              onChange(next);
            }}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
