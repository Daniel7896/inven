import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Theme } from '../../constants/Theme';
import { FileSpreadsheet, Tag, DollarSign, Calendar, TrendingUp, HelpCircle } from 'lucide-react-native';

interface SaleItem {
  _id: string;
  type: 'phone' | 'accessory';
  category?: string;
  itemRef?: {
    brand: string;
    model: string;
    variant?: string;
    color?: string;
  };
  costPrice: number;
  sellingPrice: number;
  profit: number;
  paymentMethod: string;
  customerName?: string;
  date: string;
}

interface BestSellerPhone {
  _id: { brand: string; model: string };
  salesCount: number;
  revenue: number;
  profit: number;
}

interface TopAccessory {
  _id: string; // Category name
  salesCount: number;
  revenue: number;
  profit: number;
}

export default function Reports() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerPhone[]>([]);
  const [topAccessories, setTopAccessories] = useState<TopAccessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats summaries
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [phoneRev, setPhoneRev] = useState(0);
  const [phoneProf, setPhoneProf] = useState(0);
  const [accRev, setAccRev] = useState(0);
  const [accProf, setAccProf] = useState(0);

  // Active view: 'ledger' | 'bestsellers'
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'bestsellers'>('ledger');

  const fetchReportsData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/sales/reports');
      const { sales: salesList, bestSellers: phones, topAccessories: accs } = res.data;
      
      setSales(salesList);
      setBestSellers(phones);
      setTopAccessories(accs);

      // Perform calculations
      let tRev = 0;
      let tProf = 0;
      let pRev = 0;
      let pProf = 0;
      let aRev = 0;
      let aProf = 0;

      salesList.forEach((item: SaleItem) => {
        tRev += item.sellingPrice;
        tProf += item.profit;
        if (item.type === 'phone') {
          pRev += item.sellingPrice;
          pProf += item.profit;
        } else {
          aRev += item.sellingPrice;
          aProf += item.profit;
        }
      });

      setTotalRevenue(tRev);
      setTotalProfit(tProf);
      setPhoneRev(pRev);
      setPhoneProf(pProf);
      setAccRev(aRev);
      setAccProf(aProf);

    } catch (error) {
      console.error('Error loading reports data:', error);
      Alert.alert('Error', 'Unable to fetch report statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReportsData();
    }, [])
  );

  const handleExport = () => {
    Alert.alert(
      'Export Report',
      'Choose an export format:',
      [
        { text: 'CSV Ledger', onPress: () => simulateExport('CSV') },
        { text: 'Excel Sheet', onPress: () => simulateExport('Excel') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const simulateExport = (format: string) => {
    Alert.alert('Export Successful', `Store transactions successfully exported to ${format} format.`);
  };

  const currencySymbol = user?.settings?.currency || '₹';
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const renderSalesLedgerItem = ({ item }: { item: SaleItem }) => {
    const isPhone = item.type === 'phone';
    const dateStr = new Date(item.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.ledgerRow}>
        <View style={{ flex: 2 }}>
          <Text style={styles.ledgerTitle} numberOfLines={1}>
            {isPhone
              ? `${item.itemRef?.brand || 'Phone'} ${item.itemRef?.model || 'Item'}`
              : `${item.category}`}
          </Text>
          <Text style={styles.ledgerMeta}>
            {dateStr} • {item.paymentMethod.toUpperCase()}
          </Text>
        </View>

        <View style={styles.badgeColumn}>
          <View style={[styles.typeBadge, isPhone ? styles.phoneBadge : styles.accBadge]}>
            <Text style={[styles.typeBadgeText, isPhone ? { color: Theme.colors.primary } : { color: Theme.colors.secondary }]}>
              {isPhone ? 'Phone' : 'Accessory'}
            </Text>
          </View>
        </View>

        <View style={styles.priceColumn}>
          <Text style={styles.ledgerPrice}>{currencySymbol}{item.sellingPrice}</Text>
          <Text style={styles.ledgerProfit}>+{currencySymbol}{item.profit} prof</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Banner with export */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Shop Report & Ledger</Text>
          <Text style={styles.subtitle}>Unified sales logs and performance breakdown</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <FileSpreadsheet color={Theme.colors.white} size={20} />
        </TouchableOpacity>
      </View>

      {/* Main performance stats cards */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Performance Summary (Last 30 Days)</Text>
        <View style={styles.statsMetricsRow}>
          <View style={styles.statMetric}>
            <Text style={styles.metricVal}>{currencySymbol}{totalRevenue.toLocaleString()}</Text>
            <Text style={styles.metricLbl}>Total Revenue</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statMetric}>
            <Text style={[styles.metricVal, { color: Theme.colors.secondary }]}>
              {currencySymbol}{totalProfit.toLocaleString()}
            </Text>
            <Text style={styles.metricLbl}>Net Profit</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statMetric}>
            <Text style={[styles.metricVal, { color: Theme.colors.accent }]}>{profitMargin}%</Text>
            <Text style={styles.metricLbl}>Profit Margin</Text>
          </View>
        </View>

        <View style={styles.horizontalDivider} />

        {/* Categories Breakdown */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCol}>
            <Text style={styles.breakdownHeading}>Phone Sales</Text>
            <Text style={styles.breakdownVal}>Rev: {currencySymbol}{phoneRev.toLocaleString()}</Text>
            <Text style={styles.breakdownVal}>Prof: {currencySymbol}{phoneProf.toLocaleString()}</Text>
          </View>
          <View style={styles.verticalDividerSmall} />
          <View style={styles.breakdownCol}>
            <Text style={styles.breakdownHeading}>Accessories</Text>
            <Text style={styles.breakdownVal}>Rev: {currencySymbol}{accRev.toLocaleString()}</Text>
            <Text style={styles.breakdownVal}>Prof: {currencySymbol}{accProf.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Sub tabs navigation */}
      <View style={styles.subTabs}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'ledger' ? styles.subTabBtnActive : {}]}
          onPress={() => setActiveSubTab('ledger')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'ledger' ? styles.subTabTextActive : {}]}>
            Transaction Ledger ({sales.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'bestsellers' ? styles.subTabBtnActive : {}]}
          onPress={() => setActiveSubTab('bestsellers')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'bestsellers' ? styles.subTabTextActive : {}]}>
            Top Bestsellers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditionally render Ledger List or Bestsellers List */}
      {activeSubTab === 'ledger' ? (
        sales.length === 0 ? (
          <View style={styles.emptyBox}>
            <Calendar color={Theme.colors.textMuted} size={40} />
            <Text style={styles.emptyText}>No sales transactions found in this period</Text>
          </View>
        ) : (
          <View style={styles.ledgerCard}>
            {sales.map((item) => (
              <View key={item._id}>
                {renderSalesLedgerItem({ item })}
              </View>
            ))}
          </View>
        )
      ) : (
        <View style={styles.bestsellersContainer}>
          {/* Best Selling Phones Card */}
          <View style={styles.bestsellerCard}>
            <Text style={styles.sectionTitle}>Top Selling Phones</Text>
            {bestSellers.length === 0 ? (
              <Text style={styles.noDataText}>No phone sales logged</Text>
            ) : (
              bestSellers.map((item, idx) => (
                <View key={idx} style={styles.bestsellerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bestsellerName}>
                      {idx + 1}. {item._id.brand} {item._id.model}
                    </Text>
                    <Text style={styles.bestsellerSub}>
                      Sold {item.salesCount} units
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bestsellerRevenue}>
                      {currencySymbol}{item.revenue.toLocaleString()}
                    </Text>
                    <Text style={styles.bestsellerProfit}>
                      +{currencySymbol}{item.profit.toLocaleString()} profit
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Top Accessories Card */}
          <View style={styles.bestsellerCard}>
            <Text style={styles.sectionTitle}>Top Accessories Categories</Text>
            {topAccessories.length === 0 ? (
              <Text style={styles.noDataText}>No accessory sales logged</Text>
            ) : (
              topAccessories.map((item, idx) => (
                <View key={idx} style={styles.bestsellerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bestsellerName}>
                      {idx + 1}. {item._id}
                    </Text>
                    <Text style={styles.bestsellerSub}>
                      Sold {item.salesCount} transactions
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bestsellerRevenue}>
                      {currencySymbol}{item.revenue.toLocaleString()}
                    </Text>
                    <Text style={styles.bestsellerProfit}>
                      +{currencySymbol}{item.profit.toLocaleString()} profit
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.sm
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 4
  },
  exportBtn: {
    width: 44,
    height: 44,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statsCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: Theme.spacing.md
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md
  },
  statsMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  statMetric: {
    alignItems: 'center',
    flex: 1
  },
  metricVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  metricLbl: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 4
  },
  verticalDivider: {
    width: 1,
    height: 35,
    backgroundColor: Theme.colors.cardBorder
  },
  verticalDividerSmall: {
    width: 1,
    height: 25,
    backgroundColor: Theme.colors.cardBorder
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: Theme.spacing.md
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  breakdownCol: {
    flex: 1,
    paddingHorizontal: Theme.spacing.sm
  },
  breakdownHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4
  },
  breakdownVal: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.sm,
    padding: 4,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Theme.roundness.sm
  },
  subTabBtnActive: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  subTabText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600'
  },
  subTabTextActive: {
    color: Theme.colors.primary
  },
  emptyBox: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    fontSize: 14
  },
  ledgerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: Theme.spacing.md
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder
  },
  ledgerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  ledgerMeta: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 3
  },
  badgeColumn: {
    flex: 1,
    alignItems: 'center'
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  phoneBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)'
  },
  accBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  priceColumn: {
    alignItems: 'flex-end',
    flex: 1.2
  },
  ledgerPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  ledgerProfit: {
    fontSize: 11,
    color: Theme.colors.secondary,
    marginTop: 2
  },
  bestsellersContainer: {
    gap: Theme.spacing.md
  },
  bestsellerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder
  },
  noDataText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Theme.spacing.md
  },
  bestsellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)'
  },
  bestsellerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  bestsellerSub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2
  },
  bestsellerRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  bestsellerProfit: {
    fontSize: 11,
    color: Theme.colors.secondary,
    marginTop: 2
  }
});
