export function generateSlots({
  startDelay = 30,
  durationHours = 5,
  interval = 15,
}: {
  startDelay?: number;
  durationHours?: number;
  interval?: number;
} = {}): Date[] {
  const slots: Date[] = [];
  const now = new Date();

  const start = new Date(now.getTime() + startDelay * 60 * 1000);

  start.setMinutes(Math.ceil(start.getMinutes() / interval) * interval);
  start.setSeconds(0);
  start.setMilliseconds(0);

  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  let current = new Date(start);

  while (current <= end) {
    slots.push(new Date(current));
    current.setMinutes(current.getMinutes() + interval);
  }

  return slots;
}

export function groupSlotsByDay(slots: Date[]) {
  const groups: Record<string, Date[]> = {};

  for (const slot of slots) {
    const key = slot.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  }

  return Object.entries(groups).map(([label, slots]) => ({
    label,
    slots,
  }));
}

export function formatSlot(date: Date) {
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}