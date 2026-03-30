export default function Wind() {
  return (
    <div className="wind">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="wind-line" style={{ top: i*10 + "%" }} />
      ))}
    </div>
  );
}