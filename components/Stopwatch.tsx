import FadeIn from '@/components/FadeIn';
import { SessionsContext, UserContext, YearContext } from '@/app/(tabs)/_layout';
import { showAlert } from '@/components/Dialog';
import { useAuth } from '@/providers/AuthProvider';
import { useFamily } from '@/providers/FamilyProvider';
import { addToggleListener, clearStopwatch, getNativeState, postMessage, requestNotificationPermission, syncStopwatch } from '@/modules/stopwatch-notification';
import { toLocalTimestamp } from '@/utils/dateutil';
import { msToMinutes } from '@/utils/timeutil';
import { getSkipNote, setSkipNote } from '@/utils/prefs';
import { createSessionOrQueue } from '@/utils/sessionutil';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { impact } from '@/utils/haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import Button from '@/components/Button';
import Popup from '@/components/Popup';
import { colors, radii, softShadow } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';


const STORAGE_PREFIX = 'chazarah_stopwatch';

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
    // When the session first started. startTimestamp moves on every resume, so it can't be the session's start.
    const [sessionStart, setSessionStart] = useState<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [stateLoaded, setStateLoaded] = useState(false);
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [note, setNote] = useState('');


    const selectedYear = useContext(YearContext);
    const user = useContext(UserContext);
    // Each profile has its own timer, keyed by profile id so another login on this device never sees it
    const STORAGE_KEY = `${STORAGE_PREFIX}_${user?.id ?? ''}`;
    const { refreshSessions } = useContext(SessionsContext);
    const { user: authUser } = useAuth(); // offline sessions queue under the logged-in account
    const { profiles, setActive } = useFamily();
    const { action } = useLocalSearchParams<{ action?: string }>(); // 'submit' when opened from the notification
    const elapsedRef = useRef(0);
    elapsedRef.current = elapsed;
    const [notifRefresh, setNotifRefresh] = useState(0);
    const lastPushedAt = useRef(0); // when we last told the notification about our state

    // ✅ Load persisted state
    useEffect(() => {
        const load = async () => {
            try {
                const json = await AsyncStorage.getItem(STORAGE_KEY);
                if (json) {
                    const { elapsed, isRunning, startTimestamp, sessionStart } = JSON.parse(json);
                    setElapsed(elapsed ?? 0);
                    setIsRunning(isRunning ?? false);
                    setStartTimestamp(startTimestamp ?? null);
                    setSessionStart(sessionStart ?? null);
                }
            } catch (e) {
                console.error('Error loading stopwatch state', e);
            }
            adoptNativeState();
            setStateLoaded(true);
        };
        load();
    }, []);

    // The notification's Pause/Resume works even while the app is closed, so what it recorded wins
    // over what we last saved (we push every change to it right away, so it is never behind us).
    // Returns whether the notification had changed anything (so callers don't then overwrite it)
    const adoptNativeState = (): boolean => {
        const native = getNativeState();
        if (!native || native.key !== STORAGE_KEY || native.updatedAt <= lastPushedAt.current) return false;
        setElapsed(native.elapsed);
        setIsRunning(native.isRunning);
        setStartTimestamp(native.isRunning ? native.startTimestamp : (native.startTimestamp || Date.now() - native.elapsed));
        lastPushedAt.current = native.updatedAt;
        return true;
    };

    // Keep the ongoing notification / Live Activity in step with the stopwatch
    useEffect(() => {
        if (!stateLoaded) return;
        if (isRunning || elapsedRef.current > 0) {
            lastPushedAt.current = Date.now();
            syncStopwatch({
                key: STORAGE_KEY,
                title: user && !user.isSelf ? (user.name ?? '') : '',
                isRunning,
                startTimestamp: startTimestamp ?? Date.now() - elapsedRef.current,
                elapsed: elapsedRef.current,
            });
        } else if (getNativeState()?.key === STORAGE_KEY) {
            clearStopwatch(); // reset or submitted: take the notification down (never another profile's)
        }
    }, [stateLoaded, isRunning, startTimestamp, notifRefresh]);

    // Notification button tapped while the app is open
    const adoptRef = useRef(adoptNativeState);
    adoptRef.current = adoptNativeState;
    useEffect(() => addToggleListener(() => adoptRef.current()), []);

    const persistedElapsed = isRunning ? 0 : elapsed;

    // ✅ Save state whenever it changes
    useEffect(() => {
        if (!stateLoaded) return; // don't overwrite saved state with defaults before it has loaded
        AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ elapsed, isRunning, startTimestamp, sessionStart })
        ).catch((e) => console.error('Error saving stopwatch state', e));
    // While running, elapsed is derived from startTimestamp, so the 1s tick needn't be written to storage
    }, [stateLoaded, persistedElapsed, isRunning, startTimestamp, sessionStart]);

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
            if (state !== 'active') return;
            // If the notification paused/resumed us meanwhile, that state is already correct
            if (!adoptNativeState() && isRunning && startTimestamp) {
                setElapsed(Date.now() - startTimestamp);
            }
        });
        return () => sub.remove();
    }, [isRunning, startTimestamp]);

    // ✅ Play / Pause logic
    const handlePlayPause = () => {
        impact(ImpactFeedbackStyle.Medium);
        if (isRunning) {
            if (startTimestamp) setElapsed(Date.now() - startTimestamp); // don't lose the last partial second
            setIsRunning(false);
        } else {
            // Android 13+/iOS: needed for the lock-screen timer. Re-post once answered, since a notification
            // sent while the dialog is up is dropped.
            requestNotificationPermission().then(() => setNotifRefresh((n) => n + 1));
            setStartTimestamp(Date.now() - elapsed);
            setSessionStart((s) => s ?? startTimestamp ?? Date.now());
            setIsRunning(true);
        }
    };

    // ✅ Reset with confirmation
    const handleReset = () => {
        showAlert(
            'Reset the timer?',
            'This clears the time on the clock.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset', style: 'destructive', onPress: () => {
                        setIsRunning(false);
                        setElapsed(0);
                        setStartTimestamp(null);
                        setSessionStart(null);
                    }
                }
            ]
        );
    };

    // ✅ Submit
    const handleSubmit = async () => {
        impact();
        if (!selectedYear) {
            showAlert('Error', 'No year selected.');
            return;
        }
        if (!user) {
            showAlert('Error', 'No user logged in.');
            return;
        }
        if (elapsed < 1000) {
            showAlert('Nothing to submit', 'Start the timer first, then tap Submit.');
            return;
        }
        const length = isRunning && startTimestamp ? Date.now() - startTimestamp : elapsed;
        setElapsed(length);
        setIsRunning(false);
        if (await getSkipNote()) {
            await handleFinalSubmit('', length);
            return;
        }
        setNote('');
        setNoteModalVisible(true);
    };

    // Opened from the notification's Submit button: run the normal submit flow (note prompt, validation)
    const handledAction = useRef(false);
    const [submitRequested, setSubmitRequested] = useState(false);
    useEffect(() => {
        if (action !== 'submit') { handledAction.current = false; return; }
        if (handledAction.current || !stateLoaded || !selectedYear || !user) return;
        const native = getNativeState();
        if (native && native.key !== STORAGE_KEY) {
            // The notification belongs to another profile's timer: switch to it. This screen remounts for
            // that profile and, since the action param is still set, finishes the submit there.
            const target = native.key.replace(`${STORAGE_PREFIX}_`, '');
            if (target && profiles.some((p) => p.id === target)) { handledAction.current = true; setActive(target); return; }
            handledAction.current = true;
            router.setParams({ action: '' });
            showAlert('Timer not available', 'The running timer belongs to a profile that no longer exists.');
            return;
        }
        handledAction.current = true;
        router.setParams({ action: '' });
        // The timer may have been paused/resumed from the notification while we were in the background:
        // pick that up first, then submit on the next render so handleSubmit sees the fresh state
        adoptNativeState();
        setSubmitRequested(true);
    }, [action, stateLoaded, selectedYear, user]);
    useEffect(() => {
        if (!submitRequested) return;
        setSubmitRequested(false);
        handleSubmit();
    }, [submitRequested]);

    // "Don't ask again" in the note prompt: remember the choice and save without a note
    const handleSkipForever = async () => {
        await setSkipNote(true);
        await handleFinalSubmit('');
    };

    const handleFinalSubmit = async (noteText: string, length: number = elapsed) => {
        if (!selectedYear || !user) return;
        // Save session start time as local time string (YYYY-MM-DD HH:mm:ss)
        const startedAt = sessionStart ?? startTimestamp;
        const sessionStartTime = startedAt ? toLocalTimestamp(new Date(startedAt)) : '';
        if (!sessionStartTime) {
            showAlert('Error', 'Session start time is missing. Please start and stop the stopwatch before submitting.');
            return;
        }
        try {
            const outcome = await createSessionOrQueue({
                UserId: user.id,
                YearId: selectedYear.JewishYear,
                SessionLength: length,
                SessionNote: noteText,
                SessionStartTime: sessionStartTime,
            }, selectedYear, authUser?.id ?? user.id);
            // Only clear the timer once the session was actually saved (here or in the offline queue)
            setIsRunning(false);
            setElapsed(0);
            setStartTimestamp(null);
            setSessionStart(null);
            setNoteModalVisible(false);
            if (outcome === 'queued') {
                const body = `${msToMinutes(length)} saved on this device. Connect to the internet and open the app to post the session.`;
                postMessage('Session saved locally', body);
                showAlert('Session saved locally', body);
                return;
            }
            // Refresh shared sessions context so other tabs update immediately
            await refreshSessions();
            router.replace('/obligation');
            showAlert('Session saved', `${msToMinutes(length)} logged.`);
        } catch (error: Error | any) {
            setNoteModalVisible(false);
            showAlert('Couldn’t save session', error?.message ?? 'Please try again.');
        }
    }

    return (
        <FadeIn show={stateLoaded} duration={200} style={styles.container}>
            <View style={styles.display}>
                <Text
                    style={[
                        styles.oldSchoolTime,
                        { fontFamily: 'AlarmClock' },
                    ]}
                >
                    {formatTime(elapsed)}
                </Text>
                <Text style={styles.statusText}>{isRunning ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'}</Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.buttonRetro}
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
                    style={styles.buttonRetro}
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
                    <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
            </View>
            {/* Note popup */}
            <Popup visible={noteModalVisible} onClose={() => setNoteModalVisible(false)}>
                <View style={styles.noteCard}>
                        <Text style={styles.noteTitle}>Add a note (optional)</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Type a note..."
                            value={note}
                            onChangeText={setNote}
                            multiline
                            autoFocus
                            placeholderTextColor={'#94a3b8'}
                        />
                        <View style={styles.noteButtonsRow}>
                            <Button compact variant="soft" title="Cancel" style={{ flex: 1 }} onPress={() => setNoteModalVisible(false)} />
                            <Button compact title={note.trim() === '' ? 'Skip' : 'Submit'} style={{ flex: 1 }} onPress={() => handleFinalSubmit(note)} />
                        </View>
                        <TouchableOpacity onPress={handleSkipForever} style={styles.skipForever}>
                            <Text style={styles.skipForeverText}>Don’t ask me for notes again</Text>
                        </TouchableOpacity>
                </View>
            </Popup>
        </FadeIn>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    display: {
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 28,
        paddingTop: 22,
        paddingBottom: 16,
        marginBottom: 28,
        width: '88%',
        ...softShadow,
    },
    oldSchoolTime: {
        fontSize: 84,
        color: colors.bad,
        letterSpacing: 4,
        textShadowColor: 'rgba(198,40,40,0.25)',
        textShadowRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 0,
        textAlign: 'center',
    },
    statusText: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: colors.placeholder,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    buttonRetro: {
        backgroundColor: '#1c1917',
        borderRadius: radii.md,
        paddingHorizontal: 16,
        minWidth: 64,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        boxShadow: '0 6px 14px rgba(28,25,23,0.28)',
    },
    submitButton: { paddingHorizontal: 22 },
    // Regular app font (the clock typeface is only for the time and the status)
    submitText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    iconCenter: {
        textAlign: 'center',
    },
    // Modal styles
    noteCard: { alignItems: 'center' },
    noteTitle: { fontSize: 19, fontWeight: '700', marginBottom: 14, color: colors.ink },
    noteInput: {
        borderWidth: 1.5,
        borderColor: colors.line,
        backgroundColor: '#f8fafc',
        borderRadius: radii.md,
        padding: 14,
        width: '100%',
        marginBottom: 18,
        fontSize: 16,
        color: colors.ink,
        minHeight: 96,
        textAlignVertical: 'top',
    },
    skipForever: { marginTop: 16 },
    skipForeverText: { color: '#64748b', fontSize: 13, textDecorationLine: 'underline' },
    noteButtonsRow: { flexDirection: 'row', gap: 10, width: '100%' },
});