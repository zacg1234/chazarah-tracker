import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    type SharedValue,
} from 'react-native-reanimated';


const mockSessions = [
  { id: 1, startTime: '2025-11-01 08:00', duration: 20, note: 'Parsha Noach' },
  { id: 2, startTime: '2025-11-02 09:30', duration: 25, note: 'Tehillim 30–40' },
  { id: 3, startTime: '2025-11-03 19:00', duration: 15, note: 'Mishnah Berurah 1' },
  { id: 4, startTime: '2025-11-04 20:15', duration: 30, note: 'Gemara Berachos 3b' },
  { id: 5, startTime: '2025-11-05 07:45', duration: 18, note: 'Chumash Review' },
];

const ITEM_HEIGHT = 60;
const WHEEL_HEIGHT = 400;
const { height, width } = Dimensions.get('window');

const WheelItem = ({
  item,
  index,
  scrollY,
  isActive,
}: {
  item: any;
  index: number;
  scrollY: SharedValue<number>;
  isActive: boolean;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const position = index * ITEM_HEIGHT - scrollY.value;
   const rotateX = interpolate(
    position,
    [-120, -60, 0, 60, 120],
    [70, 45, 0, -45, -70],
    'clamp'
  );
  const scale = interpolate(
    position,
    [-120, -60, 0, 60, 120],
    [0.6, 0.8, 1, 0.8, 0.6],
    'clamp'
  );
  const opacity = interpolate(
    position,
    [-120, -60, 0, 60, 120],
    [0.15, 0.3, 1, 0.3, 0.15],
    'clamp'
  );
    return {
      transform: [{ perspective: 400 }, { rotateX: `${rotateX}deg` }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle, isActive && styles.itemActive]}>
      <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{`${item.duration} min`}</Text>
      <Text style={[styles.subText, isActive && styles.subTextActive]}>{item.startTime.split(' ')[0]}</Text>
    </Animated.View>
  );
};


export default function SessionsScreen() {
  const scrollY = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<typeof mockSessions[0]>>(null);
  const [selectedIndex, setSelectedIndex] = useState(mockSessions.length - 1);
  const [wheelHeight, setWheelHeight] = useState(0);

  const wheelPadding = useMemo(() => {
    return wheelHeight > 0 ? Math.max((wheelHeight - ITEM_HEIGHT) / 2, 0) : height * 0.25;
  }, [wheelHeight]);

useEffect(() => {
  if (selectedIndex !== null) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  }
}, [selectedIndex]);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
    const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
    if (index !== selectedIndex && index >= 0 && index < mockSessions.length) {
      runOnJS(setSelectedIndex)(index);
    }
  },
});

  const handleWheelLayout = (event: LayoutChangeEvent) => {
    setWheelHeight(event.nativeEvent.layout.height);
  };

  const selectedSession = mockSessions[selectedIndex];

  return (
    <View style={styles.container}>
         {/* Left side: Session details */}
      <View style={styles.detailsContainer}>
        {selectedSession ? (
          <>
            <Text style={styles.detailTitle}>Session Details</Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Date:</Text> {selectedSession.startTime.split(' ')[0]}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Start Time:</Text> {selectedSession.startTime.split(' ')[1]}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Duration:</Text> {selectedSession.duration} minutes
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Note:</Text> {selectedSession.note}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.editButton]}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.deleteButton]}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>Select a session to view details</Text>
        )}
      </View>

      {/* Right side: Wheel */}
      <View style={styles.wheelContainer} onLayout={handleWheelLayout}>
        <Animated.FlatList
          ref={flatListRef}
          data={mockSessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <WheelItem
              item={item}
              index={index}
              scrollY={scrollY}
              isActive={index === selectedIndex}
            />
          )}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={scrollHandler}
          scrollEventThrottle={10}
          contentContainerStyle={{ paddingVertical: wheelPadding }}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          initialScrollIndex={selectedIndex}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: ITEM_HEIGHT * info.index,
              animated: false,
            });
          }}
        />

        {/* Fade gradients top/bottom */}
        <View pointerEvents="none" style={[styles.fadeOverlay, styles.fadeTop]}>
          <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>
        <View pointerEvents="none" style={[styles.fadeOverlay, styles.fadeBottom]}>
          <LinearGradient
            colors={['#e9ecef', '#f8f9fa']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* Center arrow indicator */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>◀</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8f9fa' },
  wheelContainer: {
    width: width * 0.45,
    height: WHEEL_HEIGHT,
    backgroundColor: '#e9ecef',
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center'
  },
  itemContainer: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
  },
  itemText: { fontSize: 18, fontWeight: 'bold', color: '#343a40' },
  itemTextActive: { color: '#1b1f24' },
  subText: { fontSize: 14, color: '#6c757d' },
  subTextActive: { color: '#343a40' },
  arrowContainer: {
    position: 'absolute',
    right: -8,
    top: '50%',
    transform: [{ translateY: -ITEM_HEIGHT / 2 }],
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 3,
  },
  arrow: { fontSize: 28, color: '#007bff' },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.25,
    //backgroundColor: '#e9ecef',
    //opacity: 0.9,
    zIndex: 2,
  },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
  detailsContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  detailTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  detailText: { fontSize: 16, marginBottom: 6 },
  label: { fontWeight: '600' },
  buttonRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  button: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  placeholder: { textAlign: 'center', fontSize: 16, color: '#999' },
});
