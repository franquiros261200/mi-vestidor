"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface WishlistItem {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  link: string | null;
  price: number | null;
  priority: number;
  purchased: boolean;
  notes: string | null;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", link: "", price: "", notes: "" });

  const fetchItems = async () => {
    const res = await fetch("/api/wishlist");
    setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const addItem = async () => {
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", category: "", link: "", price: "", notes: "" });
    setShowForm(false);
    toast.success("Agregado a la wishlist");
    fetchItems();
  };

  const togglePurchased = async (id: string, purchased: boolean) => {
    await fetch("/api/wishlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, purchased: !purchased }),
    });
    fetchItems();
    if (!purchased) toast.success("Comprado 🛍️");
  };

  const deleteItem = async (id: string) => {
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const pending = items.filter((i) => !i.purchased);
  const bought = items.filter((i) => i.purchased);
  const totalPending = pending.reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <AppShell title="Wishlist" onUploadClick={() => setShowForm(true)}>
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Total */}
        {totalPending > 0 && (
          <div className="card p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Total pendiente</p>
              <p className="text-xl font-bold font-display">${totalPending.toLocaleString("es-AR")}</p>
            </div>
            <p className="text-sm text-muted">{pending.length} item{pending.length !== 1 ? "s" : ""}</p>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="card p-4 mb-4 space-y-3">
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="¿Qué querés comprar?"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Categoría</option>
                {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
              <input
                type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Precio $"
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <input
              type="url" value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Link a la tienda (opcional)"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={addItem} className="btn-primary flex-1 text-sm">Agregar</button>
            </div>
          </div>
        )}

        {/* Pending items */}
        {pending.length > 0 && (
          <div className="space-y-2 mb-6">
            {pending.map((item) => {
              const cat = item.category ? CATEGORIES[item.category] : null;
              return (
                <div key={item.id} className="card p-3 flex items-center gap-3">
                  <button
                    onClick={() => togglePurchased(item.id, item.purchased)}
                    className="w-6 h-6 rounded-full border-2 border-border hover:border-accent shrink-0 flex items-center justify-center transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cat ? `${cat.icon} ` : ""}{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.price && <span className="text-xs text-accent font-medium">${item.price.toLocaleString("es-AR")}</span>}
                      {item.link && (
                        <a href={item.link} target="_blank" className="text-[11px] text-blue-500 hover:underline truncate">
                          Ver tienda →
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-red-500 text-sm shrink-0">✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bought items */}
        {bought.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Comprados ✅</p>
            <div className="space-y-1.5">
              {bought.map((item) => (
                <div key={item.id} className="card p-3 flex items-center gap-3 opacity-60">
                  <button
                    onClick={() => togglePurchased(item.id, item.purchased)}
                    className="w-6 h-6 rounded-full bg-green-100 text-green-600 shrink-0 flex items-center justify-center text-xs"
                  >✓</button>
                  <p className="text-sm line-through flex-1">{item.name}</p>
                  <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-red-500 text-sm shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {items.length === 0 && !loading && !showForm && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🛒</p>
            <h3 className="font-display font-bold text-lg mb-1">Wishlist vacía</h3>
            <p className="text-sm text-muted mb-4">Agregá prendas que querés comprar</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Agregar item</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
