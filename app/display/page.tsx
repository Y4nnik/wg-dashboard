import { getBusDepartures } from "@/lib/bus";
import { getNextTrashPickups } from "@/lib/trash";

export const revalidate = 30;

type BusDeparture = {
  line: string;
  destination: string;
  departure: string;
  departureTimestamp: number | null;
  delay?: number;
};

type TrashPickup = {
  type: string;
  date: string;
  isoDate: string;
};

function getMinutesLabelFromTime(timeText: string): string {
  const match = timeText.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeText || "--";

  const [, hh, mm] = match;

  const now = new Date();
  const departure = new Date();
  departure.setHours(Number(hh), Number(mm), 0, 0);

  if (departure.getTime() < now.getTime() - 60_000) {
    departure.setDate(departure.getDate() + 1);
  }

  const diffMin = Math.ceil((departure.getTime() - now.getTime()) / 60000);

  if (diffMin <= 0) return "jetzt";
  if (diffMin === 1) return "1 min";
  return `${diffMin} min`;
}

function getPickupLabel(dateText: string): string {
  const match = dateText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return dateText;

  const [, dd, mm, yyyy] = match;
  const pickup = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (pickup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "heute";
  if (diffDays === 1) return "morgen";
  return `in ${diffDays} Tagen`;
}

export default async function DisplayPage() {
  const [departures, pickups] = await Promise.all([
    getBusDepartures(),
    getNextTrashPickups(4),
  ]);

  const busList = departures.slice(0, 4);
  const trashList = pickups.slice(0, 3);

  return (
    <html lang="de">
      <head>
        <title>WG Display</title>
        <meta httpEquiv="refresh" content="30" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          background: "#0f172a",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <section
              style={{
                background: "#1e293b",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h1
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "48px",
                  lineHeight: 1.1,
                }}
              >
                🚌 Busse
              </h1>

              <div
                style={{
                  fontSize: "26px",
                  opacity: 0.85,
                  marginBottom: "20px",
                }}
              >
                Gottfr.-Pressel-Weg
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {busList.length === 0 ? (
                  <div style={{ fontSize: "28px" }}>Keine Busdaten</div>
                ) : (
                  busList.map((bus: BusDeparture, index: number) => (
                    <div
                      key={`${bus.line}-${bus.departure}-${index}`}
                      style={{
                        background: "#334155",
                        borderRadius: "14px",
                        padding: "20px 22px",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "16px",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "34px",
                            fontWeight: 700,
                            lineHeight: 1.1,
                          }}
                        >
                          {bus.line} {bus.destination}
                        </div>

                        <div
                          style={{
                            fontSize: "24px",
                            opacity: 0.8,
                            marginTop: "10px",
                          }}
                        >
                          Abfahrt: {bus.departure || "--"}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "54px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getMinutesLabelFromTime(bus.departure)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              style={{
                background: "#1e293b",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 18px 0",
                  fontSize: "38px",
                  lineHeight: 1.1,
                }}
              >
                🗑️ Müll
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "14px",
                }}
              >
                {trashList.length === 0 ? (
                  <div style={{ fontSize: "24px" }}>Keine Termine</div>
                ) : (
                  trashList.map((pickup: TrashPickup) => (
                    <div
                      key={`${pickup.type}-${pickup.isoDate}`}
                      style={{
                        background: "#334155",
                        borderRadius: "14px",
                        padding: "16px 18px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {pickup.type}
                      </div>

                      <div
                        style={{
                          fontSize: "22px",
                          opacity: 0.85,
                          marginTop: "8px",
                        }}
                      >
                        {pickup.date}
                      </div>

                      <div
                        style={{
                          fontSize: "22px",
                          marginTop: "6px",
                        }}
                      >
                        {getPickupLabel(pickup.date)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}