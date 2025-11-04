import { UserContext, YearContext } from '@/app/(tabs)/_layout';
import { createSession } from '@/utils/sessionutils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        
        await createSession({
            UserId: user.id,
            YearId: selectedYear.JewishYear,
            SessionLength: elapsed,
            SessionNote: '',
            SessionStartTime: new Date(startTimestamp!).toISOString(),
        });
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
                        color="#D32F2F"
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
                        color="#D32F2F"
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
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    oldSchoolTime: {
        fontSize: 64,
        marginBottom: 40,
        color: '#D32F2F',
        letterSpacing: 4,
        textShadowColor: '#222',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        backgroundColor: '#FFF8E1',
        borderWidth: 4,
        borderColor: '#222',
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 16,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    // Retro button base
    buttonRetro: {
        backgroundColor: '#FFF8E1',
        borderColor: '#222',
        borderWidth: 3,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
    },
    // Variants (subtle accent shadows)
    playButton: {
        shadowColor: '#D32F2F',
    },
    resetButton: {
        shadowColor: '#6D4C41',
    },
    submitButton: {
        shadowColor: '#2C3E50',
    },
    buttonTextRetro: {
        color: '#D32F2F',
        letterSpacing: 2,
        fontSize: 20,
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