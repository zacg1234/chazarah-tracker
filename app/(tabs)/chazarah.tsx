import Stopwatch from '@/components/Stopwatch';
import { isCurrentYear } from '@/utils/yearutils';
import { useContext } from 'react';
import { Text, View } from 'react-native';
import { YearContext } from './_layout';


export default function ChazarahScreen() {
    const selectedYear = useContext(YearContext);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrentYear(selectedYear) ? (
                <Stopwatch />
            ) : (
                <Text style={{ fontSize: 22, color: '#D32F2F', textAlign: 'center' }}>
                    Stopwatch is only available for the current year.
                </Text>
            )}
        </View>
    );
}