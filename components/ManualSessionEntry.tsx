import { UserContext, YearContext } from '@/app/(tabs)/_layout';
import Button from '@/components/Button';
import Popup from '@/components/Popup';
import { colors, radii } from '@/constants/theme';
import { showAlert } from '@/components/Dialog';
import { toLocalTimestamp } from '@/utils/dateutil';
import { createSession, updateSession } from '@/utils/sessionutil';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';

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

  const handleSubmit = async () => {
    if (!user?.id || !selectedYear?.JewishYear) {
      showAlert('Error', 'User or year not selected.');
      return;
    }
    if (!sessionLength || isNaN(Number(sessionLength)) || Number(sessionLength) <= 0) {
      showAlert('Error', 'Please enter a valid session length in minutes.');
      return;
    }
   
    const sessionStartTime = toLocalTimestamp(date);
    
    try {
      if (mode === 'edit' && initialSession?.SessionId) {
        await updateSession(initialSession.SessionId, {
          SessionStartTime: sessionStartTime,
          SessionLength: Number(sessionLength) * 60000,
          SessionNote: note,
        }, selectedYear);
      } 
      else {
        await createSession({
          UserId: user.id,
          YearId: selectedYear.JewishYear,
          SessionLength: Number(sessionLength) * 60000,
          SessionNote: note,
          SessionStartTime: sessionStartTime,
        }, selectedYear);
        showAlert('Success', `Session Submitted: ${sessionLength} min.`);
      }

      onClose();
      setSessionLength('');
      setNote('');
      if (onSubmit) onSubmit();
      router.replace('/obligation');
    } catch (error: Error | any) {
        // Keep the modal open so the user's input isn't lost
        showAlert('Error', error?.message ?? 'Failed to save session.');
    }
  };

  return (
    <Popup visible={visible} onClose={onClose}>
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
            placeholderTextColor={"#94a3b8"}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor={"#94a3b8"}
          />
          <View style={styles.buttonRow}>
            <Button compact variant="soft" title="Cancel" style={{ flex: 1 }} onPress={onClose} />
            <Button compact title={mode === 'edit' ? 'Update' : 'Submit'} style={{ flex: 1 }} onPress={handleSubmit} />
          </View>
    </Popup>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    color: colors.ink,
  },
  noteInput: {
    height: 84,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: '#f8fafc',
  },
  inputButton: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  inputButtonText: {
    fontSize: 16,
    color: colors.ink,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
});
