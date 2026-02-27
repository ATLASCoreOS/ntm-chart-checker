"use client";

export default function WeekSelector({
  availableWeeks,
  selectedWeek,
  onWeekChange,
  disabled,
}) {
  function handleChange(e) {
    const val = e.target.value;
    if (val === "latest") {
      onWeekChange(null);
    } else {
      const [y, w] = val.split("-").map(Number);
      onWeekChange({ year: y, week: w });
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor="week-selector" className="label">
        Week to check
      </label>
      <select
        id="week-selector"
        value={
          selectedWeek
            ? `${selectedWeek.year}-${selectedWeek.week}`
            : "latest"
        }
        onChange={handleChange}
        disabled={disabled}
        className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
      >
        <option value="latest">Current week (Latest)</option>
        {availableWeeks.map((w) => (
          <option key={`${w.year}-${w.week}`} value={`${w.year}-${w.week}`}>
            Wk {String(w.week).padStart(2, "0")}/{w.year}
          </option>
        ))}
      </select>
    </div>
  );
}
