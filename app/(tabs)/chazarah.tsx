import ManualSessionEntry from '@/components/ManualSessionEntry';
import FadeIn from '@/components/FadeIn';
import Stopwatch from '@/components/Stopwatch';
import TimerSkeleton from '@/components/TimerSkeleton';
import { isCurrentYear } from '@/utils/yearutils';
import { useContext, useState } from 'react';
import { View } from 'react-native';
import Button from '@/components/Button';
import { colors } from '@/constants/theme';
import { Text } from '@/components/Text';
import { ReadyContext, SessionsContext, UserContext, YearContext } from './_layout';

export default function ChazarahScreen() {
    const selectedYear = useContext(YearContext);
    const profile = useContext(UserContext);
    const ready = useContext(ReadyContext);
    const { refreshSessions } = useContext(SessionsContext);
    const [manualVisible, setManualVisible] = useState(false);

    // Don't judge "is this the current year?" until the years have actually loaded
    if (!ready) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <TimerSkeleton />
            </View>
        );
    }

    return (
        <FadeIn style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrentYear(selectedYear) ? (
                <>
                    {profile && <Stopwatch key={profile.id} />}
                    <Button title="Manual Session Entry" variant="tonal" onPress={() => setManualVisible(true)} style={{ marginBottom: 40, paddingHorizontal: 32 }} />
                    <ManualSessionEntry
                        visible={manualVisible}
                        onClose={() => setManualVisible(false)}
                        mode="add"
                        onSubmit={refreshSessions}
                    />
                </>
            ) : (
                <Text style={{ fontSize: 22, color: colors.bad, textAlign: 'center' }}>
                    Stopwatch is only available for the current year.
                </Text>
            )}
        </FadeIn>
    );
}
