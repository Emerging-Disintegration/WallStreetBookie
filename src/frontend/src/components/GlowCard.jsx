// Glass card wrapper
export default function GlowCard({ children, className = '' }) {
  return (
    <div className={`glow-card ${className}`}>
      {children}
    </div>
  );
}
