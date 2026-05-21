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
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 rounded-lg bg-gray-50 p-2"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-gray-400"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {index + 1}. {name}
          </p>
          <input
            className="mt-1 w-full rounded border p-1 text-xs"
            value={stop.plannedTime || ""}
            onChange={(e) => onChange({ ...stop, plannedTime: e.target.value })}
            placeholder="HH:MM"
            aria-label="Planned time"
          />
          <select
            className="mt-1 w-full rounded border p-1 text-xs"
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
  );
}

export function SortableStops({
  stops,
  placeMap,
  onChange,
}: {
  stops: Stop[];
  placeMap: Map<string, string>;
  onChange: (stops: Stop[]) => void;
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
        {stops.map((s, idx) => (
          <SortableRow
            key={s.placeId}
            id={s.placeId}
            index={idx}
            name={placeMap.get(s.placeId) || s.placeId}
            stop={s}
            onChange={(updated) => {
              const next = [...stops];
              next[idx] = updated;
              onChange(next);
            }}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
