import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") || "Mar del Plata";

  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      { next: { revalidate: 1800 } } // cache 30 min
    );

    if (!res.ok) throw new Error("Weather API error");

    const data = await res.json();
    const current = data.current_condition[0];
    const today = data.weather[0];

    return NextResponse.json({
      temp: parseInt(current.temp_C),
      feelsLike: parseInt(current.FeelsLikeC),
      description: current.lang_es?.[0]?.value || current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      windKmph: parseInt(current.windspeedKmph),
      icon: getWeatherEmoji(parseInt(current.weatherCode)),
      maxTemp: parseInt(today.maxtempC),
      minTemp: parseInt(today.mintempC),
      chanceOfRain: parseInt(today.hourly?.[4]?.chanceofrain || "0"),
      suggestion: getSuggestion(parseInt(current.temp_C), parseInt(today.hourly?.[4]?.chanceofrain || "0")),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener el clima" }, { status: 500 });
  }
}

function getWeatherEmoji(code: number): string {
  if (code === 113) return "☀️";
  if (code === 116) return "⛅";
  if (code === 119 || code === 122) return "☁️";
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return "🌧️";
  if ([200, 386, 389, 392, 395].includes(code)) return "⛈️";
  if ([227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(code)) return "🌨️";
  if ([143, 248, 260].includes(code)) return "🌫️";
  return "🌤️";
}

function getSuggestion(temp: number, rainChance: number): string {
  let weather: string;
  if (temp >= 28) weather = "calor";
  else if (temp >= 18) weather = "templado";
  else if (temp >= 10) weather = "frio";
  else weather = "frio";

  return JSON.stringify({ weather, needsRainGear: rainChance > 40 });
}
