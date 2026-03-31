import fs from "node:fs/promises";
import path from "node:path";

export type TrashPickup = {
  type: string;
  date: string;
  isoDate: string;
};

function parseGermanDate(value: string): Date | null {
  // Beispiel: "Do 08.01.2026"
  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getNextTrashPickups(limit = 5): Promise<TrashPickup[]> {
  const filePath = path.join(process.cwd(), "data", "abfuhr.csv");
  const raw = await fs.readFile(filePath, "latin1");

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = lines[0].split(",");
  const terminIndex = header.indexOf("TERMIN");
  const fractionIndex = header.indexOf("FRAKTION");

  if (terminIndex === -1 || fractionIndex === -1) {
    throw new Error("CSV enthält nicht die erwarteten Spalten TERMIN/FRAKTION.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = lines
    .slice(1)
    .map((line) => line.split(","))
    .map((cols) => {
      const dateText = cols[terminIndex]?.trim();
      const type = cols[fractionIndex]?.trim();
      const date = parseGermanDate(dateText);

      if (!date || !type) return null;

      return {
        type,
        date: dateText,
        isoDate: date.toISOString(),
        timestamp: date.getTime(),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .filter((row) => row.timestamp >= today.getTime())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, limit)
    .map(({ timestamp, ...rest }) => rest);

  return rows;
}