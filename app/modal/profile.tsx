import { useFamily } from '@/providers/FamilyProvider';
import { createSubAccount, deleteSubAccount } from '@/utils/profileutil';
import { getSkipNote, setSkipNote } from '@/utils/prefs';
import { deleteAccount, getLoggedInUser, handleLogout, updateLoggedInUserProfile } from '@/utils/authutil';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileModal() {
    const [user, setUser] = useState<any>(null);
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [askForNote, setAskForNote] = useState(true);
    const { profiles, active, setActive, reload } = useFamily();
    const [newFirst, setNewFirst] = useState('');
    const [newLast, setNewLast] = useState('');
    const [adding, setAdding] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setAskForNote(!(await getSkipNote()));
                const userObj = await getLoggedInUser();
                setUser(userObj);
                setFirstname(userObj?.user_metadata?.firstname || '');
                setLastname(userObj?.user_metadata?.lastname || '');
                setEmail(userObj?.user_metadata?.email || userObj?.email || '');
            } catch (error) {
                Alert.alert('Error', 'Failed to load user data.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddProfile = async () => {
        if (!user) return;
        try {
            setAdding(true);
            const created = await createSubAccount(user, newFirst, newLast);
            await reload();
            setActive(created.id);
            setNewFirst('');
            setNewLast('');
            Alert.alert('Profile added', `${created.name} was added. Ask your administrator to set their weekly obligation.`);
        } catch (error: Error | any) {
            Alert.alert('Could not add profile', error?.message ?? 'Something went wrong.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveProfile = (id: string, name: string) => {
        Alert.alert('Remove profile', `Remove ${name} and all of their sessions? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await deleteSubAccount(id);
                        if (active?.id === id && user) setActive(user.id);
                        await reload();
                    } catch (error: Error | any) {
                        Alert.alert('Error', error?.message ?? 'Failed to remove profile.');
                    }
                },
            },
        ]);
    };

    const handleSave = async () => {
        try {
            await updateLoggedInUserProfile({
                firstname,
                lastname,
                password
            }, setLoading);
            setPassword('');
            reload().catch(() => { });
            Alert.alert('Success', 'Profile updated successfully.');
        } catch (error: Error | any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        loading ? (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        ) : (
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: '#FFFFFF' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.topHeader}>
                    <Text style={styles.topHeaderTitle}>Edit Profile</Text>
                    <TouchableOpacity style={styles.topHeaderAction} onPress={async () => {
                        try {
                            await handleLogout()
                            router.replace('/login');
                        } catch (error: Error | any) {
                            Alert.alert('Logout failed', error.message);
                        }
                    }}>
                        <Text style={styles.topHeaderActionText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.container}>
                        <View>
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>First Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={firstname}
                                    onChangeText={setFirstname}
                                    placeholder="First name"
                                    autoCapitalize="words"
                                    placeholderTextColor={"#94a3b8"}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Last Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={lastname}
                                    onChangeText={setLastname}
                                    placeholder="Last name"
                                    autoCapitalize="words"
                                    placeholderTextColor={"#94a3b8"}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Email (read-only)</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={email}
                                    editable={false}
                                    onChangeText={setEmail}
                                    placeholder="name@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor={"#94a3b8"}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    placeholder="New password"
                                    placeholderTextColor={"#94a3b8"}
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={styles.label}>Ask for a note after timer sessions</Text>
                                    <Text style={styles.switchHint}>Turn off to save timer sessions without the note prompt.</Text>
                                </View>
                                <Switch
                                    value={askForNote}
                                    onValueChange={(v) => { setAskForNote(v); setSkipNote(!v); }}
                                />
                            </View>

                            <View style={styles.familySection}>
                                <Text style={styles.label}>Family profiles</Text>
                                <Text style={styles.switchHint}>
                                    Add a family member to enter their minutes from your account, then switch between profiles from the bar at the top.
                                </Text>
                                {profiles.filter((p) => !p.isSelf).map((p) => (
                                    <View key={p.id} style={styles.familyRow}>
                                        <Text style={styles.familyName}>{p.name}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveProfile(p.id, p.name)}>
                                            <Text style={styles.familyRemove}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <View style={styles.familyAddRow}>
                                    <TextInput style={[styles.input, { flex: 1, width: undefined, marginBottom: 8, minWidth: 0 }]} value={newFirst} onChangeText={setNewFirst}
                                        placeholder="First name" autoCapitalize="words" placeholderTextColor="#94a3b8" />
                                    <TextInput style={[styles.input, { flex: 1, width: undefined, marginBottom: 8, minWidth: 0 }]} value={newLast} onChangeText={setNewLast}
                                        placeholder="Last name" autoCapitalize="words" placeholderTextColor="#94a3b8" />
                                </View>
                                <TouchableOpacity style={styles.addProfileButton} onPress={handleAddProfile} disabled={adding}>
                                    <Text style={styles.addProfileText}>{adding ? 'Adding...' : 'Add family member'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.backSquareButton} onPress={() => router.back()}>
                                    <Text style={styles.backButtonText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.deleteAccountButton}
                                onPress={() =>
                                    Alert.alert(
                                        'Delete Account',
                                        'Are you sure you want to delete your entire profile? This action cannot be undone.',
                                        [
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await deleteAccount();
                                                        router.replace('/login');
                                                    } catch (error: Error | any) {
                                                        Alert.alert('Error', error.message);
                                                    }
                                                },
                                            },
                                            { text: 'Cancel', style: 'cancel' }
                                        ]
                                    )
                                }
                            >
                                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        )
    );
}

const styles = StyleSheet.create({
    familySection: { marginBottom: 20 },
    familyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    familyName: { fontSize: 16, color: '#0f172a' },
    familyRemove: { color: '#c62828', fontWeight: '600' },
    familyAddRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    addProfileButton: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 4 },
    addProfileText: { color: '#2563eb', fontWeight: '700' },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    switchHint: { fontSize: 12, color: '#64748b', marginTop: 2 },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 1)', // slightly transparent white overlay
        padding: 24,
        position: 'relative',
    },
    topHeader: {
        height: 123,
        backgroundColor: '#FFFFFF',
        borderBottomColor: '#aeaeaeff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
        // Shadow (iOS)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        // Shadow (Android)
        elevation: 4,
        // Ensure it draws above the scroll content
        zIndex: 8,
    },
    topHeaderTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    topHeaderAction: {
        width: 60,
    },
    topHeaderActionText: {
        color: '#ef4444', // red accent for logout
        fontSize: 16,
        fontWeight: '600',
    },
    fieldContainer: {
        width: '100%',
        marginBottom: 12,
    },
    label: {
        fontSize: 13,
        color: '#374151',
        marginBottom: 6,
        fontWeight: '600',
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
    },
    backSquareButton: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4
    },
    backButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    input: {
        width: 330,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#f7f8fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 18,
        fontSize: 17,
        color: '#222',
    },
    deleteAccountButton: {
        marginTop: 50,
        width: '100%',
        paddingVertical: 5,
        paddingHorizontal: 13,
        borderRadius: 10,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteAccountButtonText: {
        color: '#eb0000ff',
        fontWeight: '500',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    inputDisabled: {
        backgroundColor: '#cfd1d2ff',
        color: '#555',
        borderColor: '#d0d4d8',
    },
});