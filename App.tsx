import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { supabase } from './src/utils/supabase';

interface Todo {
  id: string | number;
  name?: string;
  title?: string;
  [key: string]: any;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoName, setNewTodoName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialTodos() {
      try {
        const { data, error: fetchErr } = await supabase.from('todos').select('*');
        if (!isMounted) return;
        if (fetchErr) {
          setError(fetchErr.message);
        } else if (data) {
          setTodos(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to fetch todos');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInitialTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase.from('todos').select('*');
      if (fetchErr) {
        setError(fetchErr.message);
      } else if (data) {
        setTodos(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }

  async function addTodo() {
    if (!newTodoName.trim()) return;
    setIsSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from('todos').insert([{ name: newTodoName.trim() }]);
      if (insertErr) {
        setError(insertErr.message);
      } else {
        setNewTodoName('');
        await handleRefresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to add todo');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Todos</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New todo name..."
          placeholderTextColor="#94A3B8"
          value={newTodoName}
          onChangeText={setNewTodoName}
        />
        <TouchableOpacity
          style={[styles.addButton, isSubmitting && styles.disabledButton]}
          onPress={addTodo}
          disabled={isSubmitting}
        >
          <Text style={styles.addButtonText}>{isSubmitting ? '...' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <Text style={styles.todoText}>{item.name || item.title || JSON.stringify(item)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No todos found in Supabase table &quot;todos&quot;.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  refreshText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  todoItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  todoText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  center: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
