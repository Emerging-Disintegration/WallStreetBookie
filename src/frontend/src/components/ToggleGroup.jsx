// Reusable toggle button group
export default function ToggleGroup({ options, value, onChange, small = false }) {
  return (
    <div className={`toggle-group${small ? ' small' : ''}`}>
      {options.map((opt) => (
        <button
          key={opt}
          className={`toggle-btn${value === opt ? ' active' : ''}`}
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
