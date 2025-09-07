import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the dashboard analytics function
      const { data: analyticsData, error: analyticsError } = await supabase.rpc(
        "get_dashboard_analytics"
      );

      if (analyticsError) throw analyticsError;

      setData(analyticsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
