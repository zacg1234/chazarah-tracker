import ManualSessionEntry from '@/components/ManualSessionEntry';
import Stopwatch from '@/components/Stopwatch';
import { isCurrentYear } from '@/utils/yearutils';
import { useContext, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { YearContext } from './_layout';

export default function ChazarahScreen() {
    const selectedYear = useContext(YearContext);
    const [manualVisible, setManualVisible] = useState(false);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrentYear(selectedYear) ? (
                <>
                    <Stopwatch />
                    <TouchableOpacity
                        style={{
                            marginBottom: 50,
                            backgroundColor: '#007bff',
                            paddingVertical: 8,
                            paddingHorizontal: 18,
                            borderRadius: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                        onPress={() => setManualVisible(true)}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                            Manual Session Entry
                        </Text>
                    </TouchableOpacity>
                    <ManualSessionEntry
                        visible={manualVisible}
                        onClose={() => setManualVisible(false)}
                        mode="add"
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