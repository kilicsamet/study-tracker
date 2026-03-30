export default function NightStars() {
  return (
    <div className="stars">
      {Array.from({ length: 80 }).map((_, i) => (
        <div key={i} className="star" style={{
          left: Math.random()*100 + "%",
          top: Math.random()*100 + "%"
        }} />
      ))}
    </div>
  );
}