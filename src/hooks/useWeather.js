import { useEffect, useState } from "react";

export default function useWeather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      const data = await res.json();
      setWeather(data.weather[0].main);
    });
  }, []);

  return weather;
}