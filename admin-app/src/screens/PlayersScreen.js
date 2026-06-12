import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const AGE_CATEGORIES = ['All', 'U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <View style={styles.dropdownValueWrap}>
          <Text style={styles.dropdownValue}>{selected || 'All'}</Text>
          <Ionicons name="chevron-down" size={16} color="#b3b3b3" />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, selected === option && styles.modalOptionActive]}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
              >
                <Text style={[styles.modalOptionText, selected === option && styles.modalOptionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default function PlayersScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPos, setFilterPos] = useState('All');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgeCategory, setFilterAgeCategory] = useState('All');

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterPos && filterPos !== 'All') params.append('position', filterPos);
      if (filterStatus) params.append('status', filterStatus);
      if (filterAgeCategory !== 'All') params.append('ageCategory', filterAgeCategory);
      const queryUrl = `${API_URL}/players?${params.toString()}`;

      const res = await axios.get(queryUrl, { headers: { Authorization: `Bearer ${token}` } });
      setPlayers((res.data.data || []).filter(p => p.status !== 'declined'));
    } catch (e) {
      console.log('Error loading players:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadPlayers());
    return unsubscribe;
  }, [navigation, filterPos, filterStatus, filterAgeCategory]);

  useEffect(() => { loadPlayers(); }, [filterPos, filterStatus, filterAgeCategory]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })}>
      <View>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.details}>{(item.positions || []).join(', ')} • {item.ageCategory || 'U20'}</Text>
      </View>
      <View style={[styles.badge, item.status === 'accepted' ? styles.bgSuccess : styles.bgWarning]}>
        <Text style={styles.badgeText}>{item.status === 'accepted' ? 'Accepted' : 'Pending'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Dropdown
          label="Position"
          options={['All', 'Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST']}
          selected={filterPos}
          onSelect={setFilterPos}
        />
        <Dropdown
          label="Age"
          options={AGE_CATEGORIES}
          selected={filterAgeCategory}
          onSelect={setFilterAgeCategory}
        />
        <View style={styles.statusRow}>
          <TouchableOpacity style={[styles.filterBtn, filterStatus === '' && styles.filterActive]} onPress={() => setFilterStatus('')}>
            <Text style={styles.filterText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, filterStatus === 'pending' && styles.filterActive]} onPress={() => setFilterStatus('pending')}>
            <Text style={styles.filterText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, filterStatus === 'accepted' && styles.filterActive]} onPress={() => setFilterStatus('accepted')}>
            <Text style={styles.filterText}>Accepted</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f4ea26" />
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No players found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c', padding: 15 },
  filterContainer: { flexDirection: 'row', marginBottom: 15, justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dropdownBtn: {
    minWidth: 130,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownLabel: { color: '#8f8f8f', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  dropdownValueWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111111', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 14, marginBottom: 12, fontWeight: '800' },
  modalOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, marginBottom: 8 },
  modalOptionActive: { backgroundColor: '#f4ea26' },
  modalOptionText: { color: '#ddd', fontSize: 14 },
  modalOptionTextActive: { color: '#111', fontWeight: '800' },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  filterActive: { backgroundColor: '#f4ea26', borderColor: '#f4ea26' },
  filterText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  details: { color: '#a1a1aa' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  bgWarning: { backgroundColor: '#f39c12' },
  bgSuccess: { backgroundColor: '#4CAF50' },
});