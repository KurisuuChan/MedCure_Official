import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts.jsx";
import { useSales } from "@/hooks/useSales.js";
import {
  subDays,
  startOfMonth,
  startOfYear,
  endOfDay,
  startOfDay,
} from "date-fns";

const defaultFinancialsData = {
  stats: { totalInventoryValue: 0, totalProfit: 0 },
  monthlyProfitData: [],
  productProfitability: [],
};

export const useFinancialsData = (dateRange = "all") => {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { sales, saleItems, isLoading: salesLoading } = useSales();

  const financials = useMemo(() => {
    if (productsLoading || salesLoading || !products || !saleItems || !sales) {
      return defaultFinancialsData;
    }

    const now = new Date();
    let startDate;

    switch (dateRange) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        break;
      case "all":
      default:
        startDate = new Date(0);
        break;
    }
    const endDate = endOfDay(now);

    const filteredSales = sales.filter((s) => {
      const saleDate = new Date(s.created_at);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const totalInventoryValue = products.reduce(
      (acc, p) => acc + (p.cost_price || 0) * (p.quantity || 0),
      0
    );

    const itemsBySaleId = new Map();
    saleItems.forEach((item) => {
      if (!itemsBySaleId.has(item.sale_id)) {
        itemsBySaleId.set(item.sale_id, []);
      }
      itemsBySaleId.get(item.sale_id).push(item);
    });

    const monthlyProfit = Array(12).fill(0);
    let totalProfit = 0;

    filteredSales.forEach((sale) => {
      const itemsForThisSale = itemsBySaleId.get(sale.id) || [];
      const totalCostForSale = itemsForThisSale.reduce((acc, item) => {
        const cost = item.products?.cost_price || 0;
        return acc + cost * item.quantity;
      }, 0);
      const netProfitForSale = sale.total_amount - totalCostForSale;
      totalProfit += netProfitForSale;
      const month = new Date(sale.created_at).getMonth();
      monthlyProfit[month] += netProfitForSale;
    });

    const monthlyProfitData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString("default", { month: "short" }),
      profit: monthlyProfit[i] || 0,
    }));

    const salesByProduct = saleItems
      .filter((item) => filteredSales.some((s) => s.id === item.sale_id))
      .reduce((acc, item) => {
        if (!item.products) return acc;
        const name = item.products.name;
        if (!acc[name]) {
          acc[name] = {
            name: name,
            cost_price: item.products.cost_price || 0,
            totalSold: 0,
            totalRevenue: 0,
          };
        }
        acc[name].totalSold += item.quantity;
        acc[name].totalRevenue += item.price_at_sale * item.quantity;
        return acc;
      }, {});

    const productProfitability = Object.values(salesByProduct)
      .map((product) => {
        const totalCost = product.totalSold * product.cost_price;
        const profit = product.totalRevenue - totalCost;
        return {
          ...product,
          profit,
          margin:
            product.totalRevenue > 0
              ? (profit / product.totalRevenue) * 100
              : 0,
        };
      })
      .sort((a, b) => b.profit - a.profit);

    return {
      stats: { totalInventoryValue, totalProfit },
      monthlyProfitData,
      productProfitability,
    };
  }, [products, saleItems, sales, dateRange, productsLoading, salesLoading]);

  return {
    ...financials,
    loading: productsLoading || salesLoading,
    error: null,
  };
};
