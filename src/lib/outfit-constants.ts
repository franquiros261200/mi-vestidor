// Agrupación de categorías para armar outfits
export const OUTFIT_LAYERS = [
  {
    key: "top",
    label: "Parte de arriba",
    icon: "👕",
    categories: ["remera", "camisa", "buzo", "sweater", "saco", "blazer", "chaleco"],
  },
  {
    key: "outer",
    label: "Abrigo",
    icon: "🧥",
    categories: ["campera"],
  },
  {
    key: "bottom",
    label: "Parte de abajo",
    icon: "👖",
    categories: ["pantalon", "jean", "short", "jogger", "pollera"],
  },
  {
    key: "full",
    label: "Enterizo / Vestido",
    icon: "👗",
    categories: ["vestido", "enterito"],
  },
  {
    key: "shoes",
    label: "Calzado",
    icon: "👟",
    categories: ["zapatillas", "zapatos", "sandalias", "botas"],
  },
  {
    key: "underwear",
    label: "Interior",
    icon: "🩲",
    categories: ["ropa_interior", "medias", "traje_de_baño"],
  },
  {
    key: "accessories",
    label: "Accesorios",
    icon: "🎒",
    categories: ["gorra", "sombrero", "bufanda", "cinturon", "reloj", "mochila", "cartera", "lentes"],
  },
];

export const WEATHER_OPTIONS = [
  { value: "calor", label: "Calor", icon: "🔥" },
  { value: "templado", label: "Templado", icon: "🌤️" },
  { value: "frio", label: "Frío", icon: "❄️" },
  { value: "lluvia", label: "Lluvia", icon: "🌧️" },
];

export const OUTFIT_OCCASIONS = [
  { value: "casual", label: "Casual", icon: "😎" },
  { value: "laburo", label: "Laburo", icon: "💼" },
  { value: "boliche", label: "Boliche", icon: "🪩" },
  { value: "cita", label: "Cita", icon: "❤️" },
  { value: "gym", label: "Gym", icon: "💪" },
  { value: "playa", label: "Playa", icon: "🏖️" },
  { value: "formal", label: "Formal", icon: "🎩" },
  { value: "deporte", label: "Deporte", icon: "🏃" },
];
