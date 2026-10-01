import 'react-native-url-polyfill/auto';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getItems,
  addItem as addItemRemote,
  toggleItem as toggleItemRemote,
  updateItem as updateItemRemote,
  removeItem as removeItemRemote,
} from './src/services/shoppingService';

// Convert an Appwrite row into the shape the UI uses
const mapRow = (row) => ({
  id: row.$id,
  text: row.item,
  completed: row.completed,
});

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To buy' },
  { key: 'bought', label: 'Bought' },
];

export default function App() {
  const [newItem, setNewItem] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getItems();
        setItems(response.rows.map(mapRow));
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addItem = async () => {
    const text = newItem.trim();
    if (!text) return;
    try {
      const row = await addItemRemote(text);
      setItems([mapRow(row), ...items]);
      setNewItem('');
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleItem = async (id) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    try {
      // the service flips the value itself, so pass the current one
      const updated = await toggleItemRemote(id, current.completed);
      setItems(items.map((i) => (i.id === id ? mapRow(updated) : i)));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    const text = editText.trim();
    if (!text) return;
    const current = items.find((i) => i.id === editingId);
    if (current && current.text === text) {
      cancelEdit();
      return;
    }
    try {
      const updated = await updateItemRemote(editingId, text);
      setItems(items.map((i) => (i.id === editingId ? mapRow(updated) : i)));
      cancelEdit();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const removeItem = async (id) => {
    try {
      await removeItemRemote(id);
      setItems(items.filter((i) => i.id !== id));
      if (editingId === id) cancelEdit();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Stats and filtering (UI only)
  const total = items.length;
  const boughtCount = items.filter((i) => i.completed).length;
  const progress = total === 0 ? 0 : (boughtCount / total) * 100;

  const visibleItems = items.filter((i) => {
    if (filter === 'todo') return !i.completed;
    if (filter === 'bought') return i.completed;
    return true;
  });

  const renderItem = ({ item }) => {
    if (item.id === editingId) {
      return (
        <View style={[styles.row, styles.rowEditing]}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            onSubmitEditing={saveEdit}
            returnKeyType="done"
            autoFocus
          />
          <Pressable onPress={saveEdit} hitSlop={8} style={styles.iconBtn}>
            <MaterialCommunityIcons name="check" size={24} color={COLORS.primary} />
          </Pressable>
          <Pressable onPress={cancelEdit} hitSlop={8} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.muted} />
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.row, item.completed && styles.rowDone]}>
        <Pressable onPress={() => toggleItem(item.id)} hitSlop={8}>
          <MaterialCommunityIcons
            name={item.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
            size={28}
            color={item.completed ? COLORS.primary : COLORS.border}
          />
        </Pressable>
        <Pressable style={styles.rowTextWrap} onPress={() => toggleItem(item.id)}>
          <Text
            style={[styles.rowText, item.completed && styles.rowTextDone]}
            numberOfLines={1}
          >
            {item.text}
          </Text>
        </Pressable>
        <Pressable onPress={() => startEdit(item)} hitSlop={8} style={styles.iconBtn}>
          <MaterialCommunityIcons name="pencil-outline" size={22} color={COLORS.muted} />
        </Pressable>
        <Pressable onPress={() => removeItem(item.id)} hitSlop={8} style={styles.iconBtn}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORS.danger} />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <MaterialCommunityIcons name="cart-outline" size={30} color="#fff" />
              <Text style={styles.headerTitle}>Shopping List</Text>
            </View>
            <Text style={styles.headerSub}>
              {total === 0
                ? 'Nothing on your list yet'
                : `${boughtCount} of ${total} items bought`}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Filter chips */}
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, filter === f.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* List */}
          {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={visibleItems}
              extraData={[editingId, editText]}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="basket-outline" size={56} color={COLORS.border} />
                  <Text style={styles.empty}>
                    {total === 0
                      ? 'Your basket is empty.\nAdd your first item below.'
                      : 'No items in this view.'}
                  </Text>
                </View>
              }
            />
          )}

          {/* Add bar pinned to the bottom */}
          <View style={styles.addBar}>
            <TextInput
              style={styles.addInput}
              placeholder="Add an item..."
              placeholderTextColor={COLORS.muted}
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <Pressable onPress={addItem} style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={26} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const COLORS = {
  primary: '#1f7a5c',
  primaryDark: '#16604a',
  bg: '#fbf6ec',
  card: '#ffffff',
  text: '#25302b',
  muted: '#8b948f',
  border: '#cfd6d1',
  danger: '#d9534f',
  accent: '#f4b942',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  body: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  headerSub: { color: '#d6efe5', fontSize: 14, marginTop: 8 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryDark,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.accent },

  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#efe7d6',
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextActive: { color: '#fff' },

  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 24 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rowDone: { borderLeftColor: COLORS.primary, backgroundColor: '#f1f7f4' },
  rowEditing: { borderLeftColor: COLORS.primary },
  rowTextWrap: { flex: 1, marginLeft: 12 },
  rowText: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  rowTextDone: { textDecorationLine: 'line-through', color: COLORS.muted },
  iconBtn: { marginLeft: 12 },
  editInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary,
  },

  emptyWrap: { alignItems: 'center', marginTop: 48 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 12, lineHeight: 22 },

  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: COLORS.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5dcc8',
  },
  addInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#e5dcc8',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});