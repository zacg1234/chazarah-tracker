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
].reverse();

const ITEM_HEIGHT = 60;
const { height, width } = Dimensions.get('window');

// ✅ Component for each wheel item
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
    const rotateX = interpolate(position, [-150, 0, 150], [45, 0, -45], 'clamp');
    const scale = interpolate(position, [-150, 0, 150], [0.8, 1, 0.8], 'clamp');
    const opacity = interpolate(position, [-150, 0, 150], [0.3, 1, 0.3], 'clamp');
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
  const lastReportedIndex = useSharedValue(0);
  const [selectedIndex, setSelectedIndex] = useState(mockSessions.length - 1);
  const [wheelHeight, setWheelHeight] = useState(0);
  const flatListRef = useRef<Animated.FlatList<typeof mockSessions[0]>>(null);
  const hasInitialScroll = useRef(false);

  const wheelPadding = useMemo(() => {
    return wheelHeight > 0 ? Math.max((wheelHeight - ITEM_HEIGHT) / 2, 0) : height * 0.25;
  }, [wheelHeight]);

  useEffect(() => {
    if (!hasInitialScroll.current && wheelHeight > 0 && mockSessions.length) {
      const initialIndex = mockSessions.length - 1;
      setSelectedIndex(initialIndex);
      hasInitialScroll.current = true;
    }
  }, [wheelHeight]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    if (!mockSessions.length) return;
    scrollY.value = event.contentOffset.y;
    const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(mockSessions.length - 1, index));
    if (clampedIndex !== lastReportedIndex.value) {
      lastReportedIndex.value = clampedIndex;
      runOnJS(setSelectedIndex)(clampedIndex);
    }
  });

  const handleWheelLayout = (event: LayoutChangeEvent) => {
    setWheelHeight(event.nativeEvent.layout.height);
  };

  const selectedSession = mockSessions[selectedIndex];

  return (
    <View style={styles.container}>
      {/* Left Side - Scroll Wheel */}
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
          snapToAlignment="center"
          decelerationRate="fast"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: wheelPadding }}
          extraData={selectedIndex}
          initialScrollIndex={selectedIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            // Fallback: jump near the index, then try again
            flatListRef.current?.scrollToOffset({
              offset: ITEM_HEIGHT * info.index,
              animated: false,
            });
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 0);
          }}
        />
        <View pointerEvents="none" style={[styles.fadeOverlay, styles.fadeTop]} />
        <View pointerEvents="none" style={[styles.fadeOverlay, styles.fadeBottom]} />
        {/* Center Arrow Indicator */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>◀</Text>
        </View>
      </View>

      {/* Right Side - Details */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  wheelContainer: {
    width: width * 0.45,
    backgroundColor: '#e9ecef',
    position: 'relative',
    overflow: 'hidden',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  itemTextActive: {
    color: '#1b1f24',
  },
  subText: {
    fontSize: 14,
    color: '#6c757d',
  },
  subTextActive: {
    color: '#343a40',
  },
  arrowContainer: {
    position: 'absolute',
    right: -8,
    top: '50%',
    transform: [{ translateY: -ITEM_HEIGHT / 2 }],
   // backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 3,
  },
  arrow: {
    fontSize: 28,
    color: '#007bff',
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.25,
    backgroundColor: '#e9ecef',
    opacity: 0.9,
    zIndex: 2,
  },
  fadeTop: {
    top: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ced4da',
  },
  fadeBottom: {
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ced4da',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  placeholder: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
});
