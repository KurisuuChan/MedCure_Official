import React from "react";
import PropTypes from "prop-types";

const options = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

const DateRangePicker = ({ selectedRange, onRangeChange }) => {
  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onRangeChange(option.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            selectedRange === option.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:bg-white/60"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

DateRangePicker.propTypes = {
  selectedRange: PropTypes.string.isRequired,
  onRangeChange: PropTypes.func.isRequired,
};

export default DateRangePicker;
