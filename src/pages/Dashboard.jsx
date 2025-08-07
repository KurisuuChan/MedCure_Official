import React, { useState, useEffect } from "react";
import {
  Archive, // Changed from Wallet
  Pill,
  TrendingUp,
  PackageX,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/supabase/client";

const Dashboard = () => {
  const [summaryCards, setSummaryCards] = useState([
    {
      title: "Inventory Status",
      value: "0",
      icon: <Archive className="text-indigo-500" />, // Changed from Wallet
      iconBg: "bg-indigo-100",
    },
    {
      title: "Medicine Available",
      value: "0",
      icon: <Pill className="text-sky-500" />,
      iconBg: "bg-sky-100",
    },
    {
      title: "Total Profit",
      value: "₱0",
      icon: <TrendingUp className="text-amber-500" />,
      iconBg: "bg-amber-100",
    },
    {
      title: "Out of Stock",
      value: "0",
      icon: <PackageX className="text-rose-500" />,
      iconBg: "bg-rose-100",
    },
  ]);

  const [monthlyProgressData, setMonthlyProgressData] = useState([]);
  const [posData, setPosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEarning, setTotalEarning] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("quantity, status, price");

        if (productsError) throw productsError;

        const inventoryStatus = products.length;
        const medicineAvailable = products.filter(
          (p) => p.status === "Available"
        ).length;
        const outOfStock = products.filter((p) => p.quantity === 0).length;
        const totalProfit = products.reduce(
          (acc, p) => acc + (p.price || 0) * (p.quantity || 0),
          0
        );

        const { data: sales, error: salesError } = await supabase
          .from("sales")
          .select("created_at, total_amount");

        if (salesError) throw salesError;

        const currentTotalEarning = sales.reduce(
          (acc, s) => acc + s.total_amount,
          0
        );
        setTotalEarning(currentTotalEarning);

        const monthlySales = sales.reduce((acc, sale) => {
          const month = new Date(sale.created_at).getMonth();
          acc[month] = (acc[month] || 0) + sale.total_amount;
          return acc;
        }, {});

        const currentMonth = new Date().getMonth();
        const generatedMonthlyProgress = Array.from({ length: 12 }, (_, i) => {
          const monthName = new Date(0, i).toLocaleString("default", {
            month: "short",
          });
          return {
            month: monthName,
            value: monthlySales[i] || 0,
            isCurrent: i === currentMonth,
          };
        });
        setMonthlyProgressData(generatedMonthlyProgress);

        const { data: recentSales, error: recentSalesError } = await supabase
          .from("sale_items")
          .select(
            `
            quantity,
            price_at_sale,
            sales (created_at),
            products (name, medicineId)
          `
          )
          .limit(5);

        if (recentSalesError) throw recentSalesError;

        const formattedPosData = recentSales.map((item) => ({
          medicineName: item.products.name,
          batchNo: item.products.medicineId,
          quantity: item.quantity,
          status: "Delivered",
          price: `₱${item.price_at_sale.toFixed(2)}`,
        }));
        setPosData(formattedPosData);

        setSummaryCards([
          {
            title: "Inventory Status",
            value: inventoryStatus.toString(),
            icon: <Archive className="text-indigo-500" />, // Changed from Wallet
            iconBg: "bg-indigo-100",
          },
          {
            title: "Medicine Available",
            value: medicineAvailable.toString(),
            icon: <Pill className="text-sky-500" />,
            iconBg: "bg-sky-100",
          },
          {
            title: "Total Profit",
            value: `₱${totalProfit.toFixed(2)}`,
            icon: <TrendingUp className="text-amber-500" />,
            iconBg: "bg-amber-100",
          },
          {
            title: "Out of Stock",
            value: outOfStock.toString(),
            icon: <PackageX className="text-rose-500" />,
            iconBg: "bg-rose-100",
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusChip = (status) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            {status}
          </span>
        );
      case "Pending":
        return (
          <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
            {status}
          </span>
        );
      case "Canceled":
        return (
          <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${card.iconBg}`}>{card.icon}</div>
            </div>
            <div className="mt-2">
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Progress Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Monthly Progress
            </h2>
            <button className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-md text-sm hover:bg-gray-200">
              Monthly <ChevronDown size={16} className="ml-1" />
            </button>
          </div>
          <div className="h-72 flex items-end justify-between space-x-2 text-center">
            {monthlyProgressData.map((item) => (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center h-full justify-end group"
              >
                <div
                  className={`w-3/4 rounded-t-md transition-colors duration-300 ${
                    item.isCurrent
                      ? "bg-gradient-to-t from-indigo-500 to-indigo-400"
                      : "bg-gray-200"
                  } group-hover:bg-gradient-to-t group-hover:from-sky-500 group-hover:to-sky-400`}
                  style={{
                    height: `${
                      (item.value /
                        (Math.max(...monthlyProgressData.map((d) => d.value)) ||
                          1)) *
                      100
                    }%`,
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Report Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Today's Report
          </h2>
          <div className="relative flex items-center justify-center h-48 w-48 mx-auto my-4">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.8"
              />
              <path
                className="text-indigo-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.8"
                strokeDasharray="55, 100"
                strokeLinecap="round"
              />
              <path
                className="text-green-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.8"
                strokeDasharray="25, 100"
                strokeDashoffset="-55"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-gray-500 text-sm">Total Earning</p>
              <p className="text-2xl font-bold text-gray-800">
                ₱{totalEarning.toFixed(2)}
              </p>
              <div className="flex items-center justify-center text-green-500 text-xs mt-1">
                <ArrowUpRight size={12} />
                <span>15.5%</span>
              </div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 mt-6">
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-indigo-500 mr-3"></span>
              <span>Total Purchase</span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-3"></span>
              <span>Cash Received</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Point of Sales Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Point Of Sales
          </h2>
          <button className="text-sm text-indigo-600 hover:underline font-medium">
            See All &gt;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                  Medicine name
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                  Batch No
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">
                  Quantity
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-500">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posData.map((item, index) => (
                <tr
                  key={`${item.medicineName}-${item.batchNo}-${index}`}
                  className="hover:bg-gray-50"
                >
                  <td className="py-4 px-4 text-sm text-gray-800 font-medium">
                    {item.medicineName}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {item.batchNo}
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusChip(item.status)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-800 font-semibold">
                    {item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
