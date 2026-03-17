import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { mockEmployees, mockTimeEntries, calculateHoursWorked, formatCurrency } from '@servicecore/shared';
import { useMemo } from 'react';

export default function DashboardScreen() {
  const stats = useMemo(() => {
    const today = new Date();
    const activeCount = mockTimeEntries.filter(e => !e.clockOut).length;

    let totalHours = 0;
    let otHours = 0;
    let totalPay = 0;

    mockTimeEntries.forEach(entry => {
      if (entry.clockOut) {
        const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
        totalHours += hours;
        if (hours > 8) otHours += hours - 8;
      }
    });

    mockEmployees.forEach(emp => {
      const empEntries = mockTimeEntries.filter(e => e.employeeId === emp.id && e.clockOut);
      let empHours = 0;
      empEntries.forEach(e => {
        empHours += calculateHoursWorked(e.clockIn, e.clockOut!, e.breaks);
      });
      const regular = Math.min(empHours, 40);
      const ot = Math.max(empHours - 40, 0);
      totalPay += regular * emp.hourlyRate + ot * emp.overtimeRate;
    });

    const pendingCount = mockTimeEntries.filter(e => e.status === 'pending').length;

    return { activeCount, totalHours, otHours, totalPay, pendingCount };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Pay Period Overview</Text>

      <View style={styles.metricsGrid}>
        <MetricCard title="Active Now" value={String(stats.activeCount)} color="#22c55e" />
        <MetricCard title="Total Hours" value={`${Math.round(stats.totalHours)}h`} color="#3b82f6" />
        <MetricCard title="Overtime" value={`${Math.round(stats.otHours)}h`} color="#f59e0b" />
        <MetricCard title="Est. Payroll" value={formatCurrency(stats.totalPay)} color="#8b5cf6" />
        <MetricCard title="Pending" value={String(stats.pendingCount)} color="#ef4444" />
        <MetricCard title="Employees" value={String(mockEmployees.length)} color="#06b6d4" />
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {mockTimeEntries.slice(-5).reverse().map((entry, i) => {
        const emp = mockEmployees.find(e => e.id === entry.employeeId);
        return (
          <View key={i} style={styles.activityItem}>
            <View style={[styles.avatar, { backgroundColor: emp?.avatarColor || '#94a3b8' }]}>
              <Text style={styles.avatarText}>
                {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : '?'}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{emp?.firstName} {emp?.lastName}</Text>
              <Text style={styles.activityDetail}>
                {entry.clockOut ? 'Clocked out' : 'Clocked in'} • {entry.location}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0a1f44', marginBottom: 12, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  metricCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  metricDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#0a1f44', marginTop: 4 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: '600', color: '#0a1f44' },
  activityDetail: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
