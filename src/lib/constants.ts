export const CATEGORIES: Record<string, { label: string; icon: string }> = {
  remera: { label: "Remera", icon: "👕" },
  camisa: { label: "Camisa", icon: "👔" },
  buzo: { label: "Buzo", icon: "🧥" },
  sweater: { label: "Sweater", icon: "🧶" },
  campera: { label: "Campera", icon: "🧥" },
  chaleco: { label: "Chaleco", icon: "🦺" },
  pantalon: { label: "Pantalón", icon: "👖" },
  jean: { label: "Jean", icon: "👖" },
  short: { label: "Short", icon: "🩳" },
  jogger: { label: "Jogger", icon: "👖" },
  pollera: { label: "Pollera", icon: "👗" },
  zapatillas: { label: "Zapatillas", icon: "👟" },
  zapatos: { label: "Zapatos", icon: "👞" },
  sandalias: { label: "Sandalias", icon: "🩴" },
  botas: { label: "Botas", icon: "🥾" },
  gorra: { label: "Gorra", icon: "🧢" },
  sombrero: { label: "Sombrero", icon: "👒" },
  bufanda: { label: "Bufanda", icon: "🧣" },
  cinturon: { label: "Cinturón", icon: "⌚" },
  reloj: { label: "Reloj", icon: "⌚" },
  mochila: { label: "Mochila", icon: "🎒" },
  cartera: { label: "Cartera", icon: "👜" },
  lentes: { label: "Lentes", icon: "🕶️" },
  traje_de_baño: { label: "Traje de baño", icon: "🩱" },
  ropa_interior: { label: "Ropa interior", icon: "🩲" },
  medias: { label: "Medias", icon: "🧦" },
  vestido: { label: "Vestido", icon: "👗" },
  enterito: { label: "Enterito", icon: "👗" },
  saco: { label: "Saco", icon: "🧥" },
  blazer: { label: "Blazer", icon: "🧥" },
};

export const SEASONS = [
  { value: "verano", label: "Verano", icon: "☀️" },
  { value: "invierno", label: "Invierno", icon: "❄️" },
  { value: "entretiempo", label: "Entretiempo", icon: "🍂" },
  { value: "todo_el_año", label: "Todo el año", icon: "📅" },
];

export const OCCASIONS = [
  { value: "casual", label: "Casual", icon: "😎" },
  { value: "formal", label: "Formal", icon: "💼" },
  { value: "deporte", label: "Deporte", icon: "🏃" },
  { value: "salida", label: "Salida", icon: "🌙" },
  { value: "trabajo", label: "Trabajo", icon: "🏢" },
  { value: "playa", label: "Playa", icon: "🏖️" },
];

export type CategoryKey = keyof typeof CATEGORIES;
