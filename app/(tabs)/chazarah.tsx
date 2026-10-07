import ManualSessionEntry from '@/components/ManualSessionEntry';
import Stopwatch from '@/components/Stopwatch';
import { isCurrentYear } from '@/utils/yearutils';
import { useContext, useState } from 'react';
import { Pressable, View } from 'react-native';
import { colors, radii } from '@/constants/theme';
import { Text } from '@/components/Text';
import { SessionsContext, UserContext, YearContext } from './_layout';

export default function ChazarahScreen() {
    const selectedYear = useContext(YearContext);
    const profile = useContext(UserContext);
    const { refreshSessions } = useContext(SessionsContext);
    const [manualVisible, setManualVisible] = useState(false);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrentYear(selectedYear) ? (
                <>
                    {profile && <Stopwatch key={profile.id} />}
                    <Pressable
                        style={({ pressed }) => ({
                            marginBottom: 40,
                            backgroundColor: colors.primary,
                            paddingVertical: 14,
                            paddingHorizontal: 28,
                            borderRadius: radii.pill,
                            boxShadow: '0 6px 16px rgba(37,99,235,0.28)',
                            opacity: pressed ? 0.85 : 1,
                            transform: [{ scale: pressed ? 0.97 : 1 }],
                        })}
                        onPress={() => setManualVisible(true)}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 0.2 }}>
                            Manual Session Entry
                        </Text>
                    </Pressable>
                    <ManualSessionEntry
                        visible={manualVisible}
                        onClose={() => setManualVisible(false)}
                        mode="add"
                        onSubmit={refreshSessions}
                    />
                </>
            ) : (
                <Text style={{ fontSize: 22, color: '#D32F2F', textAlign: 'center' }}>
                    Stopwatch is only available for the current year.
                </Text>
            )}
        </View>
    );
}