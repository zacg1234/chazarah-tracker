import { useFamily } from '@/providers/FamilyProvider';
import { showAlert } from '@/components/Dialog';
import { createSubAccount, deleteSubAccount } from '@/utils/profileutil';
import { getSkipNote, setSkipNote } from '@/utils/prefs';
import { deleteAccount, getLoggedInUser, handleLogout, updateLoggedInUserProfile } from '@/utils/authutil';
import { clearStopwatch } from '@/modules/stopwatch-notification';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import Button from '@/components/Button';
import { colors, radii, softShadow, space } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const insets = useSafeAreaInsets();
    const [focused, setFocused] = useState<string | null>(null);
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
                showAlert('Error', 'Failed to load user data.');
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
            showAlert('Profile added', `${created.name} was added. Ask your administrator to set their weekly obligation.`);
        } catch (error: Error | any) {
            showAlert('Could not add profile', error?.message ?? 'Something went wrong.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveProfile = (id: string, name: string) => {
        showAlert('Remove profile', `Remove ${name} and all of their sessions? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await deleteSubAccount(id);
                        if (active?.id === id && user) setActive(user.id);
                        await reload();
                    } catch (error: Error | any) {
                        showAlert('Error', error?.message ?? 'Failed to remove profile.');
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
            showAlert('Success', 'Profile updated successfully.');
        } catch (error: Error | any) {
            showAlert('Error', error.message);
        }
    };

    const onLogout = async () => {
        try {
            await handleLogout();
            clearStopwatch(); // don't leave the previous account's timer on the lock screen
            router.replace('/login');
        } catch (error: Error | any) {
            showAlert('Logout failed', error.message);
        }
    };

    const onDeleteAccount = () =>
        showAlert('Delete account', 'Are you sure you want to delete your entire profile? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteAccount();
                        clearStopwatch();
                        router.replace('/login');
                    } catch (error: Error | any) {
                        showAlert('Error', error.message);
                    }
                },
            },
        ]);

    const field = (key: string, label: string, props: React.ComponentProps<typeof TextInput>) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                {...props}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused((f) => (f === key ? null : f))}
                placeholderTextColor={colors.placeholder}
                style={[styles.input, focused === key && styles.inputFocused, props.editable === false && styles.inputDisabled]}
            />
        </View>
    );

    const initials = `${firstname[0] ?? ''}${lastname[0] ?? ''}`.toUpperCase() || (email[0] ?? '?').toUpperCase();
    const others = profiles.filter((p) => !p.isSelf);

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back"
                    style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: colors.line }]}>
                    <Ionicons name="chevron-back" size={22} color={colors.ink} />
                </Pressable>
                <Text style={styles.headerTitle}>Profile</Text>
                <Pressable onPress={onLogout} style={({ pressed }) => [styles.logoutPill, pressed && { opacity: 0.6 }]}>
                    <Text style={styles.logoutText}>Log out</Text>
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}><Text style={styles.muted}>Loading...</Text></View>
            ) : (
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.identity}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                        <Text style={styles.identityName}>{`${firstname} ${lastname}`.trim() || 'Your profile'}</Text>
                        <Text style={styles.muted}>{email}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.card}>
                        <View style={styles.twoCol}>
                            <View style={{ flex: 1 }}>{field('first', 'First name', { value: firstname, onChangeText: setFirstname, placeholder: 'First name', autoCapitalize: 'words' })}</View>
                            <View style={{ flex: 1 }}>{field('last', 'Last name', { value: lastname, onChangeText: setLastname, placeholder: 'Last name', autoCapitalize: 'words' })}</View>
                        </View>
                        {field('email', 'Email', { value: email, editable: false, placeholder: 'name@example.com', keyboardType: 'email-address', autoCapitalize: 'none' })}
                        {field('pw', 'New password', { value: password, onChangeText: setPassword, secureTextEntry: true, autoCapitalize: 'none', placeholder: 'Leave blank to keep current' })}
                        <Button title="Save changes" onPress={handleSave} />
                    </View>

                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.card}>
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: space.md }}>
                                <Text style={styles.rowTitle}>Ask for a note after timer sessions</Text>
                                <Text style={styles.hint}>Turn off to save timer sessions without the note prompt.</Text>
                            </View>
                            <Switch
                                value={askForNote}
                                onValueChange={(v) => { setAskForNote(v); setSkipNote(!v); }}
                                trackColor={{ false: colors.inputBorder, true: colors.primary }}
                                thumbColor="#fff"
                                ios_backgroundColor={colors.inputBorder}
                            />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Family profiles</Text>
                    <View style={styles.card}>
                        <Text style={styles.hint}>Add a family member to enter their minutes from your account, then switch profiles from the top bar.</Text>
                        {others.map((p) => (
                            <View key={p.id} style={styles.familyRow}>
                                <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{(p.name[0] ?? '?').toUpperCase()}</Text></View>
                                <Text style={styles.familyName} numberOfLines={1}>{p.name}</Text>
                                <Pressable onPress={() => handleRemoveProfile(p.id, p.name)} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.5 }}>
                                    <Text style={styles.remove}>Remove</Text>
                                </Pressable>
                            </View>
                        ))}
                        <View style={[styles.twoCol, { marginTop: space.md }]}>
                            <View style={{ flex: 1 }}>{field('nf', 'First name', { value: newFirst, onChangeText: setNewFirst, placeholder: 'First name', autoCapitalize: 'words' })}</View>
                            <View style={{ flex: 1 }}>{field('nl', 'Last name', { value: newLast, onChangeText: setNewLast, placeholder: 'Last name', autoCapitalize: 'words' })}</View>
                        </View>
                        <Button title="Add family member" variant="secondary" loading={adding} onPress={handleAddProfile} />
                    </View>

                    <Button title="Delete account" variant="ghostDestructive" onPress={onDeleteAccount} style={{ marginTop: space.lg }} />
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm,
        backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.ink },
    logoutPill: { paddingHorizontal: 14, height: 34, borderRadius: radii.pill, backgroundColor: colors.badSoft, alignItems: 'center', justifyContent: 'center' },
    logoutText: { color: colors.bad, fontWeight: '600', fontSize: 14 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: space.lg, gap: space.sm },
    identity: { alignItems: 'center', paddingVertical: space.lg, gap: 4 },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
    avatarText: { fontSize: 28, fontWeight: '700', color: colors.primary },
    identityName: { fontSize: 20, fontWeight: '700', color: colors.ink },
    muted: { fontSize: 14, color: colors.muted },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: space.md, marginLeft: space.xs },
    card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: space.lg, ...softShadow },
    twoCol: { flexDirection: 'row', gap: space.md },
    field: { marginBottom: space.md },
    label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6, marginLeft: 2 },
    input: {
        borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#f8fafc', borderRadius: radii.md,
        paddingVertical: 14, paddingHorizontal: 14, fontSize: 16, color: colors.ink,
    },
    inputFocused: { borderColor: colors.primary, backgroundColor: '#fff' },
    inputDisabled: { backgroundColor: colors.soft, color: colors.muted },
    switchRow: { flexDirection: 'row', alignItems: 'center' },
    rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
    hint: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
    familyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.md },
    smallAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    smallAvatarText: { fontWeight: '700', color: colors.primary },
    familyName: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.ink },
    remove: { color: colors.bad, fontWeight: '600', fontSize: 14 },
});
