import { useEffect, useState } from 'react'

export default function useWeather() {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'd782fbd485b680afa89e78f9ed9d9369'

    async function fetchByCoords(lat, lon) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        )
        if (!res.ok) { console.error('Weather API HTTP hatası:', res.status); return }
        const data = await res.json()
        if (data?.weather?.[0]?.main) {
          setWeather(data.weather[0].main)
        } else {
          console.error('Weather API beklenmedik yanıt:', data)
        }
      } catch (err) {
        console.error('Hava durumu fetch hatası:', err)
      }
    }

    if (!navigator.geolocation) {
      // Geolocation yoksa İstanbul ile fallback
      fetchByCoords(41.015, 28.979)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        // İzin reddedildi veya timeout → İstanbul fallback
        console.warn('Konum alınamadı, İstanbul kullanılıyor:', err.message)
        fetchByCoords(41.015, 28.979)
      },
      { timeout: 8000, maximumAge: 300_000 }
    )
  }, [])

  return weather
}