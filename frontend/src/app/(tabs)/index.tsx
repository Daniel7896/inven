import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Theme } from '../../constants/Theme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { DollarSign, Package, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  today: { revenue: number; profit: number };
  week: { revenue: number; profit: number };
  month: { revenue: number; profit: number };
  stock: {
    totalStock: number;
    uniqueAvailableModels: number;
    lowStockAlerts: Array<{
      _id: string;
      brand: string;
      model: string;
      quantity: number;
      variant?: string;
    }>;
  };
  phonesSoldTodayCount: number;
}

interface ChartDataPoint {
  _id: string; // date string e.g. "2026-07-01" or "2026-06"
  revenue: number;
  profit: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyChartData, setDailyChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setErrorMsg(null);
    try {
      // 1. Fetch main dashboard statistics
      const statsRes = await api.get('/api/sales/dashboard');
      setStats(statsRes.data);

      // 2. Fetch reports data for graphs
      const reportsRes = await api.get('/api/sales/reports');
      const { dailyChart, monthlyChart } = reportsRes.data;

      // Format Daily Line Chart Data (take last 7 entries)
      if (dailyChart && dailyChart.length > 0) {
        const last7 = dailyChart.slice(-7);
        setDailyChartData({
          labels: last7.map((item: ChartDataPoint) => {
            const dateParts = item._id.split('-');
            return `${dateParts[1]}/${dateParts[2]}`; // MM/DD format
          }),
          data: last7.map((item: ChartDataPoint) => item.revenue)
        });
      } else {
        setDailyChartData(null);
      }

      // Format Monthly Bar Chart Data (take last 6 entries)
      if (monthlyChart && monthlyChart.length > 0) {
        const last6 = monthlyChart.slice(-6);
        setMonthlyChartData({
          labels: last6.map((item: ChartDataPoint) => {
            const dateParts = item._id.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIdx = parseInt(dateParts[1], 10) - 1;
            return months[monthIdx] || dateParts[1];
          }),
          data: last6.map((item: ChartDataPoint) => item.revenue)
        });
      } else {
        setMonthlyChartData(null);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      setErrorMsg(error.response?.data?.message || 'Unable to connect to server');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const currencySymbol = user?.settings?.currency || '₹';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  // Fallback placeholder data if charts are empty (e.g. no sales yet)
  const defaultDaily = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [120, 250, 190, 320, 410, 280, 560] }]
  };

  const defaultMonthly = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [3400, 4200, 3900, 5800, 6200, 7100] }]
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
      }
    >
      {/* Header Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.storeName}>{user?.storeName || 'My Mobile Shop'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* KPI Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.kpiCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <DollarSign color={Theme.colors.secondary} size={22} />
          </View>
          <Text style={styles.kpiLabel}>Today's Revenue</Text>
          <Text style={styles.kpiValue}>
            {currencySymbol}
            {stats?.today?.revenue.toLocaleString() || '0'}
          </Text>
          <Text style={styles.kpiSub}>Profit: {currencySymbol}{stats?.today?.profit.toLocaleString() || '0'}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <TrendingUp color={Theme.colors.primary} size={22} />
          </View>
          <Text style={styles.kpiLabel}>Phones Sold Today</Text>
          <Text style={styles.kpiValue}>{stats?.phonesSoldTodayCount || '0'}</Text>
          <Text style={styles.kpiSub}>Units sold</Text>
        </View>
      </View>

      {/* Stock Levels Indicator Card */}
      <TouchableOpacity style={styles.stockCard} onPress={() => router.push('/(tabs)/inventory')}>
        <View style={styles.stockHeader}>
          <View style={styles.row}>
            <Package color={Theme.colors.textMuted} size={20} style={{ marginRight: 8 }} />
            <Text style={styles.stockTitle}>Inventory Summary</Text>
          </View>
          <ChevronRight color={Theme.colors.textMuted} size={20} />
        </View>

        <View style={styles.stockStatsRow}>
          <View style={styles.stockStatCol}>
            <Text style={styles.stockStatVal}>{stats?.stock?.totalStock || '0'}</Text>
            <Text style={styles.stockStatLbl}>Total Items</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stockStatCol}>
            <Text style={styles.stockStatVal}>{stats?.stock?.uniqueAvailableModels || '0'}</Text>
            <Text style={styles.stockStatLbl}>Available Models</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stockStatCol}>
            <Text style={[styles.stockStatVal, stats?.stock?.lowStockAlerts?.length ? { color: Theme.colors.accent } : {}]}>
              {stats?.stock?.lowStockAlerts?.length || '0'}
            </Text>
            <Text style={styles.stockStatLbl}>Low Stock Alerts</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Daily Revenue Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Revenue ({currencySymbol})</Text>
        <LineChart
          data={
            dailyChartData
              ? { labels: dailyChartData.labels, datasets: [{ data: dailyChartData.data }] }
              : defaultDaily
          }
          width={screenWidth - Theme.spacing.lg * 2 - Theme.spacing.md * 2}
          height={180}
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix=""
          bezier
          style={styles.chartStyle}
        />
        {!dailyChartData && <Text style={styles.placeholderText}>Showing sample preview (no sales logged yet)</Text>}
      </View>

      {/* Monthly Revenue Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Revenue ({currencySymbol})</Text>
        <BarChart
          data={
            monthlyChartData
              ? { labels: monthlyChartData.labels, datasets: [{ data: monthlyChartData.data }] }
              : defaultMonthly
          }
          width={screenWidth - Theme.spacing.lg * 2 - Theme.spacing.md * 2}
          height={180}
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix=""
          style={styles.chartStyle}
        />
        {!monthlyChartData && <Text style={styles.placeholderText}>Showing sample preview (no historical data)</Text>}
      </View>

      {/* Low Stock Alerts Section */}
      {stats && stats.stock.lowStockAlerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <View style={[styles.row, { marginBottom: Theme.spacing.sm }]}>
            <AlertTriangle color={Theme.colors.accent} size={20} style={{ marginRight: 6 }} />
            <Text style={styles.alertsHeader}>Low Stock Warnings</Text>
          </View>

          {stats.stock.lowStockAlerts.map((phone) => (
            <TouchableOpacity
              key={phone._id}
              style={styles.alertItem}
              onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { search: phone.model } })}
            >
              <View>
                <Text style={styles.alertName}>
                  {phone.brand} {phone.model} {phone.variant ? `(${phone.variant})` : ''}
                </Text>
                <Text style={styles.alertDetails}>Quantity Left: {phone.quantity}</Text>
              </View>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>Restock</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: Theme.colors.card,
  backgroundGradientFrom: Theme.colors.card,
  backgroundGradientTo: Theme.colors.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: Theme.colors.primary
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  dateText: {
    fontSize: 14,
    color: Theme.colors.textMuted
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md
  },
  errorText: {
    color: Theme.colors.danger,
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md
  },
  kpiCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    width: '48%',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.roundness.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm
  },
  kpiLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 4
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4
  },
  kpiSub: {
    fontSize: 11,
    color: Theme.colors.textMuted
  },
  stockCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: Theme.spacing.md
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md
  },
  stockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stockStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  stockStatCol: {
    alignItems: 'center',
    flex: 1
  },
  stockStatVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  stockStatLbl: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 4
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Theme.colors.cardBorder
  },
  chartCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: Theme.spacing.md,
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: Theme.spacing.md
  },
  chartStyle: {
    borderRadius: Theme.roundness.sm,
    paddingRight: 10
  },
  placeholderText: {
    fontSize: 11,
    color: Theme.colors.accent,
    marginTop: 8
  },
  alertsContainer: {
    marginTop: Theme.spacing.sm
  },
  alertsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  alertItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm
  },
  alertName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  alertDetails: {
    fontSize: 12,
    color: Theme.colors.accent,
    marginTop: 2
  },
  alertBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.accent,
    borderRadius: Theme.roundness.sm,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  alertBadgeText: {
    color: Theme.colors.accent,
    fontSize: 11,
    fontWeight: 'bold'
  }
});
