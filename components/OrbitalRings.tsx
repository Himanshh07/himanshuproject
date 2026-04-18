export default function OrbitalRings() {
  return (
    <div className="relative w-[500px] h-[500px]">
      {/* Ring 1 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "1px solid rgba(99,102,241,0.15)",
          boxShadow: "0 0 30px rgba(99,102,241,0.05) inset",
        }}
      />
      {/* Ring 2 */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "60px",
          border: "1px solid rgba(139,92,246,0.12)",
        }}
      />
      {/* Ring 3 */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "130px",
          border: "1px solid rgba(59,130,246,0.1)",
        }}
      />

      {/* Orbiting dots */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <span
            className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-indigo-400 animate-orbit"
            style={{
              boxShadow: "0 0 8px rgba(99,102,241,0.8), 0 0 16px rgba(99,102,241,0.4)",
              transform: "rotate(0deg) translateX(180px)",
              transformOrigin: "0 0",
              marginLeft: "-5px",
              marginTop: "-5px",
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-violet-400 animate-orbit2"
            style={{
              boxShadow: "0 0 8px rgba(139,92,246,0.8), 0 0 16px rgba(139,92,246,0.4)",
              transform: "rotate(120deg) translateX(220px) rotate(-120deg)",
              transformOrigin: "0 0",
              marginLeft: "-4px",
              marginTop: "-4px",
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-orbit3"
            style={{
              boxShadow: "0 0 6px rgba(59,130,246,0.8), 0 0 12px rgba(59,130,246,0.4)",
              transform: "rotate(240deg) translateX(160px) rotate(-240deg)",
              transformOrigin: "0 0",
              marginLeft: "-3px",
              marginTop: "-3px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
