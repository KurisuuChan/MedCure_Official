// src/components/charts/SalesByHourChart.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const SalesByHourChart = ({ data }) => {
  const [Recharts, setRecharts] = useState(null);

  useEffect(() => {
    let mounted = true;
    import("recharts").then((mod) => {
      if (mounted) setRecharts(mod);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!Recharts) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        Loading chart...
      </div>
    );
  }

  const {
    ResponsiveContainer,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Bar,
  } = Recharts;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hour" />
        <YAxis tickFormatter={(value) => `PHP ${value}`} />
        <Tooltip
          cursor={{ fill: "rgba(239, 246, 255, 0.5)" }}
          formatter={(value) => [`PHP ${value.toFixed(2)}`, "Sales"]}
        />
        <Bar
          dataKey="sales"
          fill="#8B5CF6"
          barSize={20}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

SalesByHourChart.propTypes = {
  data: PropTypes.array.isRequired,
};

export default SalesByHourChart;
