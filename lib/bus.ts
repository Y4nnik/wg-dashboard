export type BusDeparture = {
  line: string;
  destination: string;
  departure: string;
  departureTimestamp: number | null;
  delay?: number;
};

const BUS_API =
  "https://dfi.swtue.de/departure_board?max_departures=10&timespan_minutes=120&stop_id=de%3A08416%3A10325%3A0%3A4";

function formatDeparture(raw: any): string {
  if (!raw) return "";

  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);

  if (raw.time) return String(raw.time);
  if (raw.planned_time) return String(raw.planned_time);
  if (raw.departure_time) return formatDeparture(raw.departure_time);
  if (raw.when) return String(raw.when);
  if (raw.datetime) return String(raw.datetime);

  return "";
}

function parseTimeToTimestamp(timeText: string): number | null {
  const match = timeText.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [, hh, mm] = match;

  const now = new Date();
  const date = new Date();
  date.setHours(Number(hh), Number(mm), 0, 0);

  // Falls die Zeit heute schon vorbei ist, optional auf morgen setzen.
  // Für eure Anzeige mit den nächsten Abfahrten ist das meistens nicht nötig,
  // aber es macht die Funktion robuster:
  if (date.getTime() < now.getTime() - 60_000) {
    date.setDate(date.getDate() + 1);
  }

  return date.getTime();
}

function extractTimestamp(raw: any): number | null {
  if (!raw) return null;

  if (typeof raw === "number") {
    return raw > 1_000_000_000_000 ? raw : raw * 1000;
  }

  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof raw === "object") {
    if (typeof raw.timestamp === "number") {
      return raw.timestamp > 1_000_000_000_000
        ? raw.timestamp
        : raw.timestamp * 1000;
    }

    if (typeof raw.epoch === "number") {
      return raw.epoch > 1_000_000_000_000 ? raw.epoch : raw.epoch * 1000;
    }

    if (typeof raw.datetime === "string") {
      const parsed = Date.parse(raw.datetime);
      if (!Number.isNaN(parsed)) return parsed;
    }

    if (typeof raw.iso === "string") {
      const parsed = Date.parse(raw.iso);
      if (!Number.isNaN(parsed)) return parsed;
    }

    if (typeof raw.date === "string" && typeof raw.time === "string") {
      const parsed = Date.parse(`${raw.date}T${raw.time}`);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
}

export async function getBusDepartures(): Promise<BusDeparture[]> {
  const res = await fetch(BUS_API, {
    headers: {
      Accept: "text/event-stream",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Bus API Fehler: ${res.status}`);
  }

  if (!res.body) {
    throw new Error("Kein Stream erhalten");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      if (!event.includes("event: departures")) continue;

      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (!dataLine) continue;

      const jsonText = dataLine.replace(/^data:\s*/, "").trim();

      try {
        const json = JSON.parse(jsonText);

        if (!Array.isArray(json) || json.length === 0) {
          continue;
        }

        const departures: BusDeparture[] = json.map((d: any) => {
          const departure =
            formatDeparture(d.departure) ||
            formatDeparture(d.departure_time) ||
            formatDeparture(d.time) ||
            formatDeparture(d.when);

          const departureTimestamp =
            extractTimestamp(d.departure) ||
            extractTimestamp(d.departure_time) ||
            extractTimestamp(d.time) ||
            extractTimestamp(d.when) ||
            parseTimeToTimestamp(departure) ||
            null;

          return {
            line: String(
              d.line?.name ??
                d.line?.short_name ??
                d.line ??
                d.route ??
                "?"
            ),
            destination: String(
              d.destination ??
                d.direction ??
                d.headsign ??
                d.destination_text ??
                ""
            ),
            departure,
            departureTimestamp,
            delay:
              typeof d.delay === "number"
                ? d.delay
                : typeof d.delay_minutes === "number"
                ? d.delay_minutes
                : 0,
          };
        });

        if (departures.length > 0) {
          return departures.slice(0, 6);
        }
      } catch (error) {
        console.error("Fehler beim Parsen der Busdaten:", error);
      }
    }
  }

  return [];
}