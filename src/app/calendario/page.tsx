"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";

interface CalendarOutfit {
  id: string;
  name: string;
  occasion: string | null;
  plannedDate: string;
  items: { item: { id: string; thumbnailUrl: string | null; imageUrl: string; category: string } }[];
}

interface Outfit {
  id: string;
  name: string;
}

export default function CalendarioPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [calendarOutfits, setCalendarOutfits] = useState<CalendarOutfit[]>([]);
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  useEffect(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    
    Promise.all([
      fetch(`/api/outfits/calendar?start=${weekStart.toISOString()}&end=${end.toISOString()}`).then(r => r.json()),
      fetch("/api/outfits").then(r => r.json()),
    ]).then(([cal, all]) => {
      setCalendarOutfits(cal);
      setAllOutfits(all);
      setLoading(false);
    });
  }, [weekStart]);

  const getOutfitForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return calendarOutfits.find(o => o.plannedDate?.startsWith(dateStr));
  };

  const assignOutfit = async (outfitId: string, date: Date) => {
    await fetch("/api/outfits/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId, date: date.toISOString() }),
    });
    setAssigning(null);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    const cal = await fetch(`/api/outfits/calendar?start=${weekStart.toISOString()}&end=${end.toISOString()}`).then(r => r.json());
    setCalendarOutfits(cal);
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <AppShell title="Calendario">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Week nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevWeek} className="btn-secondary text-sm px-3 py-1.5">← Anterior</button>
          <h2 className="font-display font-bold text-sm">
            {weekStart.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={nextWeek} className="btn-secondary text-sm px-3 py-1.5">Siguiente →</button>
        </div>

        {/* Days */}
        <div className="space-y-2">
          {days.map((date, i) => {
            const outfit = getOutfitForDay(date);
            const today = isToday(date);

            return (
              <div key={i} className={`card p-4 ${today ? "ring-2 ring-accent/30" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase w-8 ${today ? "text-accent" : "text-muted"}`}>
                      {dayNames[i]}
                    </span>
                    <span className={`text-sm font-medium ${today ? "text-accent" : ""}`}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                    {today && <span className="tag-pill text-[10px] bg-accent/10 text-accent">Hoy</span>}
                  </div>

                  <button
                    onClick={() => setAssigning(assigning === date.toISOString() ? null : date.toISOString())}
                    className="text-xs text-accent hover:underline"
                  >
                    {outfit ? "Cambiar" : "+ Asignar"}
                  </button>
                </div>

                {outfit ? (
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      {outfit.items.slice(0, 4).map(({ item }) => (
                        <div key={item.id} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm relative">
                          <Image src={item.thumbnailUrl || item.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{outfit.name}</p>
                      <p className="text-[11px] text-muted">{outfit.items.length} prendas</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Sin outfit asignado</p>
                )}

                {/* Assign dropdown */}
                {assigning === date.toISOString() && (
                  <div className="mt-3 border-t border-border pt-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {allOutfits.length === 0 ? (
                      <p className="text-xs text-muted">No tenés outfits. Crealos en la sección Outfits.</p>
                    ) : (
                      allOutfits.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => assignOutfit(o.id, date)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-tag rounded-lg transition-colors"
                        >
                          👔 {o.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
