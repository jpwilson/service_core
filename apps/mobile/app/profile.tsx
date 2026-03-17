import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { mockEmployees, formatCurrency } from '@servicecore/shared';

export default function ProfileScreen() {
  const employee = mockEmployees[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: employee.avatarColor }]}>
          <Text style={styles.avatarText}>
            {employee.firstName[0]}{employee.lastName[0]}
          </Text>
        </View>
        <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
        <Text style={styles.role}>{employee.role}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{employee.department}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employment Details</Text>
        <InfoRow label="Email" value={employee.email} />
        <InfoRow label="Hourly Rate" value={formatCurrency(employee.hourlyRate)} />
        <InfoRow label="OT Rate" value={formatCurrency(employee.overtimeRate)} />
        <InfoRow label="Hire Date" value={employee.hireDate} />
        <InfoRow label="Status" value={employee.isActive ? 'Active' : 'Inactive'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <InfoRow label="Version" value="1.0.0" />
        <InfoRow label="Platform" value="iOS" />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: '#0a1f44' },
  role: { fontSize: 14, color: '#64748b', marginTop: 4 },
  badge: { backgroundColor: '#f89020', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0a1f44', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0a1f44' },
});
