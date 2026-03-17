import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { formatHoursMinutes, mockEmployees, mockProjects } from '@servicecore/shared';

export default function TimeClockScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedProject, setSelectedProject] = useState(mockProjects[0]?.id || '');
  const employee = mockEmployees[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hoursWorked = clockInTime
    ? (currentTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
    : 0;

  const handleClockToggle = () => {
    if (isClockedIn) {
      setIsClockedIn(false);
      setClockInTime(null);
    } else {
      setIsClockedIn(true);
      setClockInTime(new Date());
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Current Time */}
      <Text style={styles.shiftLabel}>CURRENT SHIFT</Text>
      <Text style={styles.time}>{format(currentTime, 'hh:mm a')}</Text>
      <Text style={styles.date}>{format(currentTime, 'EEEE, MMM d, yyyy')}</Text>

      {/* Clock Button */}
      <TouchableOpacity
        style={[styles.clockButton, isClockedIn && styles.clockButtonActive]}
        onPress={handleClockToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.clockButtonIcon}>{isClockedIn ? '⏱' : '⏰'}</Text>
        <Text style={styles.clockButtonText}>
          {isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
        </Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>STATUS</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isClockedIn ? styles.statusActive : styles.statusInactive]} />
            <Text style={styles.statValue}>{isClockedIn ? 'On Duty' : 'Off Duty'}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TODAY</Text>
          <Text style={styles.statValue}>{formatHoursMinutes(hoursWorked)}</Text>
        </View>
      </View>

      {/* Employee */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>EMPLOYEE</Text>
        <Text style={styles.infoValue}>{employee.firstName} {employee.lastName}</Text>
        <Text style={styles.infoSub}>{employee.department} • {employee.role}</Text>
      </View>

      {/* Location */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>LOCATION</Text>
        <Text style={styles.infoValue}>Denver Central Logistics Hub</Text>
        <Text style={[styles.infoSub, { color: '#22c55e' }]}>📍 Within Geofence</Text>
      </View>

      {/* Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesLabel}>SHIFT NOTES</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Enter any notes for this shift..."
          placeholderTextColor="#94a3b8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { alignItems: 'center', padding: 24 },
  shiftLabel: { color: '#f89020', fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 8 },
  time: { fontSize: 48, fontWeight: '900', color: '#0a1f44', marginTop: 4 },
  date: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 32 },
  clockButton: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#f89020', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f89020', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    elevation: 8, marginBottom: 32,
  },
  clockButtonActive: { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
  clockButtonIcon: { fontSize: 48 },
  clockButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0a1f44' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusActive: { backgroundColor: '#22c55e' },
  statusInactive: { backgroundColor: '#94a3b8' },
  infoCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12,
  },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#0a1f44' },
  infoSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  notesSection: { width: '100%', marginTop: 4 },
  notesLabel: { fontSize: 11, fontWeight: '700', color: '#0a1f44', marginBottom: 8 },
  notesInput: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 16, fontSize: 14, minHeight: 100, textAlignVertical: 'top', color: '#0a1f44',
  },
});
