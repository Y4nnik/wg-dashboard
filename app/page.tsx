"use client";

import { useEffect, useState } from "react";

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
  if (!match) return "keine Zeit";

  const [, hh, mm] = match;

  const now = new Date();
  const departure = new Date();
  departure.setHours(Number(hh), Number(mm), 0, 0);

  // falls die Zeit für heute schon vorbei ist, auf morgen schieben
  if (departure.getTime() < now.getTime() - 60_000) {
    departure.setDate(departure.getDate() + 1);
  }

  const diffMin = Math.ceil((departure.getTime() - now.getTime()) / 60000);

  if (diffMin <= 0) return "jetzt";
  if (diffMin === 1) return "in 1 min";
  return `in ${diffMin} min`;
}


export default function HomePage() {
  const [, setNow] = useState(Date.now());
  const [departures, setDepartures] = useState<BusDeparture[]>([]);
  const [pickups, setPickups] = useState<TrashPickup[]>([]);
  const [loadingBus, setLoadingBus] = useState(true);
  const [loadingTrash, setLoadingTrash] = useState(true);

  useEffect(() => {
  const loadBus = async () => {
    try {
      const res = await fetch("/api/bus", { cache: "no-store" });
      const data = await res.json();
      setDepartures(data.departures ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBus(false);
    }
  };

  const loadTrash = async () => {
    try {
      const res = await fetch("/api/trash", { cache: "no-store" });
      const data = await res.json();
      setPickups(data.pickups ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTrash(false);
    }
  };

  loadBus();
  loadTrash();

  const busInterval = setInterval(loadBus, 30_000);
  const clockInterval = setInterval(() => setNow(Date.now()), 30_000);

  return () => {
    clearInterval(busInterval);
    clearInterval(clockInterval);
  };
}, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      padding: "32px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Barbarenhütte Dashboard</h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          Busse & Müllabholung auf einen Blick
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20
        }}>
          <section style={{
            background: "#1e293b",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ marginTop: 0 }}>🚌 Busabfahrten</h2>
            <p style={{ opacity: 0.75 }}>Haltestelle: Gottfr.-Pressel-Weg</p>

           
            {loadingBus ? (
              <p>Lade Busdaten…</p>
            ) : departures.length === 0 ? (
              <p>Keine Busdaten gefunden.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {departures.map((bus, index) => (
                <div
                  key={`${bus.line}-${bus.departure}-${index}`}
                  style={{
                    background: "#334155",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ marginTop: 6}}>
                    <strong>{bus.line}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{bus.destination}</strong>
                    <strong
                      style={{
                        fontSize: 28,
                        fontWeight: "bold",
                      }}
                    >
                      {getMinutesLabelFromTime(bus.departure)}
                    </strong>
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.8 }}>
                    Abfahrt: {bus.departure || "unbekannt"}
                  </div>

                  {typeof bus.delay === "number" && bus.delay > 0 ? (
                    <div style={{ marginTop: 6, opacity: 0.8 }}>
                      +{bus.delay} min Verspätung
                    </div>
                  ) : null}
                </div>
              ))}
              </div>
            )}
          </section>

          <section style={{
            background: "#1e293b",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ marginTop: 0 }}>🗑️ Nächste Müllabholung</h2>

            {loadingTrash ? (
              <p>Lade Mülltermine…</p>
            ) : pickups.length === 0 ? (
              <p>Keine kommenden Termine gefunden.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {pickups.map((pickup) => (
                  <div key={`${pickup.type}-${pickup.isoDate}`} style={{
                    background: "#334155",
                    borderRadius: 12,
                    padding: 14
                  }}>
                    <strong>{pickup.type}</strong>
                    <div style={{ marginTop: 6 }}>{pickup.date}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}