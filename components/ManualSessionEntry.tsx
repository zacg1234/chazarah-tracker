import { UserContext, YearContext } from '@/app/(tabs)/_layout';
import { createSession, updateSession } from '@/utils/sessionutil';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ManualSessionEntryProps = {
  visible: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit';
  initialSession?: {
    SessionId?: number;
    SessionStartTime: string;
    SessionLength: number;
    SessionNote?: string;
  };
  onSubmit?: () => void; // callback after submit
};

export default function ManualSessionEntry({
  visible,
  onClose,
  mode = 'add',
  initialSession,
  onSubmit,
}: ManualSessionEntryProps) {
  const user = useContext(UserContext);
  const selectedYear = useContext(YearContext);

  // Initialize state from initialSession if editing, otherwise defaults
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sessionLength, setSessionLength] = useState('');
  const [note, setNote] = useState('');

  // Reset or populate fields when modal opens/closes or initialSession changes
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialSession) {
        // Parse local timestamp string to Date
        const [datePart, timePart] = (initialSession.SessionStartTime || '').split(/[ T]/);
        let d = new Date();
        if (datePart && timePart) {
          const [year, month, day] = datePart.split('-').map(Number);
          const [hour, minute, second] = timePart.split(':').map(Number);
          d = new Date(year, month - 1, day, hour, minute, second || 0);
        }
        setDate(d);
        setSessionLength(Math.round(initialSession.SessionLength / 60000).toString());
        setNote(initialSession.SessionNote || '');
      } else {
        setDate(new Date());
        setSessionLength('');
        setNote('');
      }
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, [visible, mode, initialSession]);

const handleDateChange = (_event: any, selected?: Date) => {
  setShowDatePicker(false);
  if (selected) {
    setDate(prev => {
      // Only update if the date part actually changed
      if (
        prev.getFullYear() !== selected.getFullYear() ||
        prev.getMonth() !== selected.getMonth() ||
        prev.getDate() !== selected.getDate()
      ) {
        const newDate = new Date(prev);
        newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        return newDate;
      }
      return prev;
    });
  }
};

const handleTimeChange = (_event: any, selected?: Date) => {
  setShowTimePicker(false);
  if (selected) {
    setDate(prev => {
      // Only update if the time part actually changed
      if (
        prev.getHours() !== selected.getHours() ||
        prev.getMinutes() !== selected.getMinutes()
      ) {
        const newDate = new Date(prev);
        newDate.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        return newDate;
      }
      return prev;
    });
  }
};

  const { getCurrentLocalTimeString } = require('@/utils/dateutil');
  const handleSubmit = async () => {
    if (!user?.id || !selectedYear?.JewishYear) {
      Alert.alert('Error', 'User or year not selected.');
      return;
    }
    if (!sessionLength || isNaN(Number(sessionLength))) {
      Alert.alert('Error', 'Please enter a valid session length in minutes.');
      return;
    }
    // Format date as local time string for DB
    const pad = (n: number) => n.toString().padStart(2, '0');
    const sessionStartTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    if (mode === 'edit' && initialSession?.SessionId) {
      await updateSession(initialSession.SessionId, {
        SessionStartTime: sessionStartTime,
        SessionLength: Number(sessionLength) * 60000,
        SessionNote: note,
      }, selectedYear);
    } else {
      await createSession({
        UserId: user.id,
        YearId: selectedYear.JewishYear,
        SessionLength: Number(sessionLength) * 60000,
        SessionNote: note,
        SessionStartTime: sessionStartTime,
      }, selectedYear);
    }
    onClose();
    setSessionLength('');
    setNote('');
    if (onSubmit) onSubmit();
    Alert.alert('Success', `Session Submitted: ${sessionLength} min.`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {mode === 'edit' ? 'Edit Session' : 'Manual Session Entry'}
          </Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputButton}>
            <Text style={styles.inputButtonText}>
              Date: {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputButton}>
            <Text style={styles.inputButtonText}>
              Time: {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Session Length (minutes)"
            keyboardType="numeric"
            value={sessionLength}
            onChangeText={setSessionLength}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{mode === 'edit' ? 'Update' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    width: 320,
    alignItems: 'stretch',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  inputButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    backgroundColor: '#f8f9fa',
  },
  inputButtonText: {
    fontSize: 16,
    color: '#343a40',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#e34d4dff',
    marginRight: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    marginLeft: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});