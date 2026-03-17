import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { mockTimeEntries, mockEmployees, mockProjects, calculateHoursWorked, formatHoursMinutes } from '@servicecore/shared';
import { format, parseISO } from 'date-fns';

export default function ApprovalsScreen() {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const pendingEntries = mockTimeEntries.filter(
    e => e.status === 'pending' && !approvedIds.has(e.id)
  );

  const handleApprove = (id: string) => {
    setApprovedIds(prev => new Set([...prev, id]));
    Alert.alert('Approved', 'Timesheet entry approved');
  };

  const handleReject = (id: string) => {
    setApprovedIds(prev => new Set([...prev, id]));
    Alert.alert('Rejected', 'Timesheet entry rejected');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>
        {pendingEntries.length} Pending Approval{pendingEntries.length !== 1 ? 's' : ''}
      </Text>

      {pendingEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>All timesheets approved</Text>
        </View>
      ) : (
        pendingEntries.map(entry => {
          const emp = mockEmployees.find(e => e.id === entry.employeeId);
          const proj = mockProjects.find(p => p.id === entry.projectId);
          const hours = entry.clockOut
            ? calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks)
            : 0;

          return (
            <View key={entry.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: emp?.avatarColor || '#94a3b8' }]}>
                  <Text style={styles.avatarText}>
                    {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{emp?.firstName} {emp?.lastName}</Text>
                  <Text style={styles.detail}>
                    {format(parseISO(entry.clockIn), 'MMM d, yyyy')} • {formatHoursMinutes(hours)}
                  </Text>
                  {proj && <Text style={styles.project}>{proj.name}</Text>}
                </View>
              </View>

              {entry.flags.length > 0 && (
                <View style={styles.flagsRow}>
                  {entry.flags.map((flag, i) => (
                    <View key={i} style={styles.flagBadge}>
                      <Text style={styles.flagText}>{flag.replace('_', ' ')}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(entry.id)}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(entry.id)}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  header: { fontSize: 16, fontWeight: '700', color: '#0a1f44', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600', color: '#0a1f44' },
  detail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  project: { fontSize: 12, color: '#f89020', fontWeight: '500', marginTop: 2 },
  flagsRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  flagBadge: { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  flagText: { fontSize: 10, fontWeight: '600', color: '#92400e', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  approveBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ef4444' },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '500', marginTop: 12 },
});
