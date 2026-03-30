import Lightning from "./Lightning";
import NightStars from "./NightStars";
import Wind from "./Wind";

export default function WeatherEffects({ weather, time }) {
  return (
    <>
      {weather === "Rain" && <Rain />}
      {weather === "Snow" && <Snow />}
      {weather === "Clear" && <Sun />}
      {weather === "Clouds" && <Clouds />}
      {weather === "Thunderstorm" && <Lightning />}
      {time === "night" && <NightStars />}
      <Wind />
    </>
  );
}

function Rain() {
  return (
    <div className="weather-layer">
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} className="rain-drop" style={{ left: Math.random()*100 + "%" }} />
      ))}
    </div>
  );
}

function Snow() {
  return (
    <div className="weather-layer">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="snow-flake" style={{ left: Math.random()*100 + "%" }} />
      ))}
    </div>
  );
}

function Sun() {
  return <div className="sun" />;
}

function Clouds() {
  return (
    <div className="weather-layer">
      <div className="cloud" />
      <div className="cloud slow" />
    </div>
  );
}