import { getLoggedInUser, updateLoggedInUserProfile } from '@/utils/authutil';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileModal() {
    const [user, setUser] = useState<any>(null);
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const userObj = await getLoggedInUser();
            setUser(userObj);
            setFirstname(userObj?.user_metadata?.firstname || '');
            setLastname(userObj?.user_metadata?.lastname || '');
            setEmail(userObj?.user_metadata?.email || userObj?.email || '');
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSave = () => {
        updateLoggedInUserProfile({
            firstname,
            lastname,
            email,
            password
        }, setLoading);
    };

    return (
        loading ? (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        ) : (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.container}>
                        <View>
                            <Text style={styles.header}>Edit Profile</Text>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>First Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={firstname}
                                    onChangeText={setFirstname}
                                    placeholder="First name"
                                    autoCapitalize="words"
                                    placeholderTextColor={"#6c6c6cff"}
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
                                    placeholderTextColor={"#6c6c6cff"}
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
                                    placeholderTextColor={"#6c6c6cff"}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="New password"
                                    placeholderTextColor={"#6c6c6cff"}
                                />
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.backSquareButton} onPress={() => router.back()}>
                                    <Text style={styles.backButtonText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        )
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)', // slightly transparent white overlay
        padding: 24,
        position: 'relative',
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
        backgroundColor: '#007AFF',
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
    header: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 24,
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
    // Add to StyleSheet:
    inputDisabled: {
        backgroundColor: '#cfd1d2ff',
        color: '#555',
        borderColor: '#d0d4d8',
    },
});