import { UserContext, YearContext } from '@/app/(tabs)/_layout';
import { createSession } from '@/utils/sessionutils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'chazarah_stopwatch';

function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Stopwatch() {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
    const [fontLoaded, setFontLoaded] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [note, setNote] = useState('');


    const selectedYear = useContext(YearContext);
    const user = useContext(UserContext);

    // ✅ Load font once
    useEffect(() => {
        (async () => {
            await Font.loadAsync({
                'AlarmClock': require('../assets/fonts/AlarmClock.ttf'),
            });
            setFontLoaded(true);
        })();
    }, []);

    // ✅ Load persisted state
    useEffect(() => {
        const load = async () => {
            try {
                const json = await AsyncStorage.getItem(STORAGE_KEY);
                if (json) {
                    const { elapsed, isRunning, startTimestamp } = JSON.parse(json);
                    setElapsed(elapsed ?? 0);
                    setIsRunning(isRunning ?? false);
                    setStartTimestamp(startTimestamp ?? null);
                }
            } catch (e) {
                console.error('Error loading stopwatch state', e);
            }
        };
        load();
    }, []);

    // ✅ Save state whenever it changes
    useEffect(() => {
        AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ elapsed, isRunning, startTimestamp })
        ).catch((e) => console.error('Error saving stopwatch state', e));
    }, [elapsed, isRunning, startTimestamp]);

    // ✅ Stopwatch timer effect
    useEffect(() => {
        if (isRunning) {
            // resume or start new
            intervalRef.current = setInterval(() => {
                if (startTimestamp) {
                    setElapsed(Date.now() - startTimestamp);
                }
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Cleanup interval on unmount or dependency change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, startTimestamp]);

    // ✅ Handle app resume
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active' && isRunning && startTimestamp) {
                setElapsed(Date.now() - startTimestamp);
            }
        });
        return () => sub.remove();
    }, [isRunning, startTimestamp]);

    // ✅ Play / Pause logic
    const handlePlayPause = () => {
        if (isRunning) {
            setIsRunning(false);
        } else {
            setStartTimestamp(Date.now() - elapsed);
            setIsRunning(true);
        }
    };

    // ✅ Reset
    const handleReset = () => {
        setIsRunning(false);
        setElapsed(0);
        setStartTimestamp(null);
    };

    // ✅ Submit
     const handleSubmit = async () => {
        if (!selectedYear) {
            Alert.alert('Error', 'No year selected.');
            return;
        }
        if (!user) {
            Alert.alert('Error', 'No user logged in.');
            return;
        }
        setIsRunning(false); 
        setNote('');
        setNoteModalVisible(true);
    };

    const handleFinalSubmit = async () => {
        if (!selectedYear) return;
        // Save session start time as local time string (YYYY-MM-DD HH:mm:ss)
        let sessionStartTime = '';
        if (startTimestamp) {
            const d = new Date(startTimestamp);
            // Manually format as 'YYYY-MM-DD HH:mm:ss' in local time
            const pad = (n: number) => n.toString().padStart(2, '0');
            sessionStartTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        if (!sessionStartTime) {
            Alert.alert('Error', 'Session start time is missing. Please start and stop the stopwatch before submitting.');
            return;
        }
        await createSession({
            UserId: user.id,
            YearId: selectedYear.JewishYear,
            SessionLength: elapsed,
            SessionNote: note,
            SessionStartTime: sessionStartTime,
        });
        setNoteModalVisible(false);
        handleReset();
        Alert.alert('Submit', `Elapsed time: ${formatTime(elapsed)}`);
    };

    if (!fontLoaded) {
        return <View style={styles.container}><Text>Loading...</Text></View>;
    }

    return (
        <View style={styles.container}>
            <Text
                style={[
                    styles.oldSchoolTime,
                    fontLoaded && { fontFamily: 'AlarmClock' },
                ]}
            >
                {formatTime(elapsed)}
            </Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.buttonRetro, styles.playButton]}
                    onPress={handlePlayPause}
                >
                    <MaterialCommunityIcons
                        name={isRunning ? "pause-circle-outline" : "play-circle-outline"}
                        size={32}
                        color="#ffffff"
                        style={styles.iconCenter}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.buttonRetro, styles.resetButton]}
                    onPress={handleReset}
                >
                    <MaterialCommunityIcons
                        name="restart"
                        size={32}
                        color="#ffffff"
                        style={styles.iconCenter}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.buttonRetro, styles.submitButton]}
                    onPress={handleSubmit}
                >
                    <Text
                        style={[
                            styles.buttonTextRetro,
                            fontLoaded && { fontFamily: 'AlarmClock' },
                            styles.submitText,
                        ]}
                    >
                        SUBMIT
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Note Modal */}
            <Modal
    visible={noteModalVisible}
    transparent
    animationType="fade"
    onRequestClose={() => setNoteModalVisible(false)}
>
    <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    }}>
        <View style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 24,
            width: 300,
            alignItems: 'center'
        }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                Add a note (optional)
            </Text>
            <TextInput
                style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 10,
                    width: '100%',
                    marginBottom: 18,
                    fontSize: 16,
                }}
                placeholder="Type a note..."
                value={note}
                onChangeText={setNote}
                multiline
                autoFocus
            />
            <TouchableOpacity
                style={{
                    backgroundColor: '#007bff',
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 8,
                    minWidth: 90,
                    alignItems: 'center',
                }}
                onPress={handleFinalSubmit}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {note.trim() === '' ? 'Skip' : 'Submit'}
                </Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    oldSchoolTime: {
        fontSize: 80,
        marginBottom: 20,
        color: '#D32F2F',
        letterSpacing: 4,
        textShadowColor: '#e09797ff',
        textShadowRadius: 10,
        paddingHorizontal: 32,
        paddingVertical: 0,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    // Retro button base
    buttonRetro: {
        backgroundColor: '#261e1eff',
        borderColor: '#000000ff',
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        shadowColor: '#020000ff',
        shadowRadius: 60,
        shadowOffset: { width: 10, height: 10 },
        elevation: 10,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
    },
    // Variants (subtle accent shadows)
    playButton: {
        //shadowColor: '#D32F2F',
    },
    resetButton: {
        //shadowColor: '#D32F2F',
    },
    submitButton: {
        //shadowColor: '#D32F2F',
    },
    buttonTextRetro: {
        color: '#ffffff',
        letterSpacing: 2,
        fontSize: 32,
        textAlign: 'center',
    },
    submitText: {
        lineHeight: 32, 
        textAlignVertical: 'center',
    },
    iconCenter: {
        textAlign: 'center',
    },
});