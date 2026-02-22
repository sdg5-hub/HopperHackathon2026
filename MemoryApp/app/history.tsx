import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import { format, subDays, isWithinInterval, startOfDay } from 'date-fns';
import { DoseStatus } from '@/types';

interface MedicationHistory {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: DoseStatus;
  date: Date;
  note?: string;
}

export default function HistoryScreen() {
  const [medicationFilter, setMedicationFilter] = useState('');
  const [dosageFilter, setDosageFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [showSkipped, setShowSkipped] = useState(true);
  const [dateRange] = useState(7); // Last 7 days

  // Mock data - replace with actual data source
  const [allMedications] = useState<MedicationHistory[]>([
    {
      id: '1',
      name: 'Aspirin',
      dosage: '500mg',
      time: '08:00',
      status: DoseStatus.TAKEN,
      date: new Date(),
    },
    {
      id: '2',
      name: 'Lisinopril',
      dosage: '10mg',
      time: '09:00',
      status: DoseStatus.DUE,
      date: new Date(),
    },
    {
      id: '3',
      name: 'Metformin',
      dosage: '1000mg',
      time: '12:00',
      status: DoseStatus.SKIPPED,
      date: new Date(),
      note: 'Forgot',
    },
    {
      id: '4',
      name: 'Aspirin',
      dosage: '500mg',
      time: '08:00',
      status: DoseStatus.TAKEN,
      date: subDays(new Date(), 1),
    },
      {
      id: '5',
      name: 'Lisinopril',
      dosage: '10mg',
      time: '09:00',
      status: DoseStatus.MISSED,
      date: subDays(new Date(), 2),
    },
    {
      id: '6',
      name: 'Metformin',
      dosage: '1000mg',
      time: '12:00',
      status: DoseStatus.TAKEN,
      date: subDays(new Date(), 3),
    },
    {
      id: '7',
      name: 'Aspirin',
      dosage: '500mg',
      time: '08:00',
      status: DoseStatus.SKIPPED,
      date: subDays(new Date(), 4),
    }
  ]);

  const filteredMedications = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), dateRange);
    const startOfSevenDaysAgo = startOfDay(sevenDaysAgo);

    return allMedications
      .filter((med) => {
        // Date filter - last 7 days
        if (!isWithinInterval(med.date, {
          start: startOfSevenDaysAgo,
          end: new Date(),
        })) {
          return false;
        }

        // Skip filter
        if (med.status === DoseStatus.SKIPPED && !showSkipped) {
          return false;
        }

        // Medication name filter
        if (
          medicationFilter &&
          !med.name.toLowerCase().includes(medicationFilter.toLowerCase())
        ) {
          return false;
        }

        // Dosage filter
        if (
          dosageFilter &&
          !med.dosage.toLowerCase().includes(dosageFilter.toLowerCase())
        ) {
          return false;
        }

        // Time filter
        if (timeFilter && !med.time.includes(timeFilter)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
  }, [
    allMedications,
    medicationFilter,
    dosageFilter,
    timeFilter,
    showSkipped,
    dateRange,
  ]);

  const groupedByDate = useMemo(() => {
    const grouped: { [key: string]: MedicationHistory[] } = {};

    filteredMedications.forEach((med) => {
      const dateKey = format(med.date, 'MMM dd, yyyy');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(med);
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        title: date,
        data,
      }))
      .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime());
  }, [filteredMedications]);

  const getStatusColor = (status: DoseStatus) => {
    switch (status) {
      case DoseStatus.DUE:
        return '#ff0008';
      case DoseStatus.TAKEN:
        return '#00e608';
      case DoseStatus.MISSED:
        return '#ff9900';
      case DoseStatus.SKIPPED:
        return '#9E9E9E';
      default:
        return '#999';
    }
  };

  const renderMedicationRow = ({ item }: { item: MedicationHistory }) => (
    <View style={styles.row}>
      <Text style={styles.medication}>{item.name}</Text>
      <Text style={styles.dosage}>{item.dosage}</Text>
      <Text style={styles.time}>{item.time}</Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>{DoseStatus[item.status]}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medication History</Text>
      <Text style={styles.subtitle}>Last {dateRange} days</Text>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by medication name"
          value={medicationFilter}
          onChangeText={setMedicationFilter}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by dosage"
          value={dosageFilter}
          onChangeText={setDosageFilter}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by time (HH:MM)"
          value={timeFilter}
          onChangeText={setTimeFilter}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.toggleButton, !showSkipped && styles.toggleButtonActive]}
          onPress={() => setShowSkipped(!showSkipped)}
        >
          <Text style={styles.toggleButtonText}>
            {showSkipped ? 'Hide Skipped' : 'Show Skipped'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medication List */}
      <SectionList
        sections={groupedByDate}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderMedicationRow}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  medication: {
    flex: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dosage: {
    flex: 1.5,
    fontSize: 12,
    color: '#666',
  },
  time: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
});
