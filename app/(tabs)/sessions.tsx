import ManualSessionEntry from '@/components/ManualSessionEntry';
import { formatDateMDY } from '@/utils/dateutil';
import { deleteSession, getSessionsByUserAndYear } from '@/utils/sessionutil';
import { msToMinutes, to12HourTime } from '@/utils/timeutil';
import { isCurrentYear } from '@/utils/yearutils';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { UserContext, YearContext } from './_layout';


const ITEM_HEIGHT = 60;
const WHEEL_HEIGHT = 400;
const { height, width } = Dimensions.get('window');

const WheelItem = ({
  item,
  index,
  scrollY,
  IsActive,
}: {
  item: any;
  index: number;
  scrollY: SharedValue<number>;
  IsActive: boolean;
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
    <Animated.View style={[styles.itemContainer, animatedStyle, IsActive && styles.itemActive]}>
      <Text style={[styles.itemText, IsActive && styles.itemTextActive]}>{formatDateMDY(item.startTime)}</Text>
      <Text style={[styles.subText, IsActive && styles.subTextActive]}>{msToMinutes(item.duration)}</Text>
    </Animated.View>
  );
};


export default function SessionsScreen() {
  const scrollY = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wheelHeight, setWheelHeight] = useState(0);
  const [manualVisible, setManualVisible] = useState(false);
  const [editSession, setEditSession] = useState<any | null>(null);


  const selectedYear = useContext(YearContext);
  const user = useContext(UserContext);

  useFocusEffect(
    React.useCallback(() => {
      let IsActive = true;
      async function fetchSessions() {
        if (user?.id && selectedYear?.JewishYear) {
          try {
            const data = await getSessionsByUserAndYear(user.id, selectedYear.JewishYear);
            if (IsActive) {
              setSessions(data || []);
              const lastIndex = (data && data.length > 0) ? data.length - 1 : 0;
              setSelectedIndex(lastIndex);
            
              setTimeout(() => {
                try {
                  if (flatListRef.current && data && data.length > 0) {
                    flatListRef.current.scrollToIndex({ index: lastIndex, animated: false });
                  }
                } catch (err) {
                  // On web, scrollToIndex can throw if layout not ready; fall back to offset
                  flatListRef.current?.scrollToOffset({
                    offset: ITEM_HEIGHT * lastIndex,
                    animated: false,
                  });
                }
              }, 0);
            
            }
          } catch (e) {
            if (IsActive) {
              setSessions([]);
              setSelectedIndex(0);
            }
          }
        } else {
          if (IsActive) {
            setSessions([]);
            setSelectedIndex(0);
          }
        }
      }
      fetchSessions();
      return () => {
        IsActive = false;
      };
    }, [user, selectedYear])
  );

  const wheelPadding = useMemo(() => {
    return wheelHeight > 0 ? Math.max((wheelHeight - ITEM_HEIGHT) / 2, 0) : height * 0.25;
  }, [wheelHeight]);

  useEffect(() => {
    if (selectedIndex !== null && sessions.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => { });
    }
  }, [selectedIndex, sessions.length]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      if (index !== selectedIndex && index >= 0 && index < sessions.length) {
        runOnJS(setSelectedIndex)(index);
      }
    },
  });

  const handleWheelLayout = (event: LayoutChangeEvent) => {
    setWheelHeight(event.nativeEvent.layout.height);
  };

  const handleEdit = () => {
    if (selectedSession) {
      setEditSession({
        SessionId: selectedSession.SessionId,
        SessionStartTime: selectedSession.SessionStartTime,
        SessionLength: selectedSession.SessionLength,
        SessionNote: selectedSession.SessionNote,
      });
      setManualVisible(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedSession) return;
    // Confirm delete
    const confirmed = await new Promise((resolve) => {
      // Use native confirm dialog
      if (typeof window !== 'undefined' && window.confirm) {
        resolve(window.confirm('Are you sure you want to delete this session?'));
      } else {
        // Fallback for React Native
        import('react-native').then(({ Alert }) => {
          Alert.alert(
            'Delete Session',
            'Are you sure you want to delete this session?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });
      }
    });
    if (!confirmed) return;
    try {
      await deleteSession(selectedSession.SessionId);
      // Refresh sessions
      if (user?.id && selectedYear?.JewishYear) {
        const data = await getSessionsByUserAndYear(user.id, selectedYear.JewishYear);
        setSessions(data || []);
        // Select last session if any
        const lastIndex = (data && data.length > 0) ? data.length - 1 : 0;
        setSelectedIndex(lastIndex);
      }
    } catch (e) {
      import('react-native').then(({ Alert }) => {
        Alert.alert('Error', 'Failed to delete session.');
      });
    }
  };


  const selectedSession = sessions[selectedIndex];

  return (
    <View style={styles.container}>
      {/* Left: Details */}
      <View style={styles.detailsContainer}>
        {selectedSession ? (
          <>
            <Text style={styles.detailTitle}>Session Details</Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Date:</Text> {formatDateMDY(selectedSession.SessionStartTime)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Start Time:</Text> {to12HourTime(selectedSession.SessionStartTime)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Duration:</Text> {msToMinutes(selectedSession.SessionLength)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Note:</Text> {selectedSession.SessionNote}
            </Text>

            {isCurrentYear(selectedYear) ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                style={[styles.button, styles.editButton]} onPress={handleEdit}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.disabledMsg}>
                This session is for a previous year and cannot be altered
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.placeholder}>Select a session to view details</Text>
        )}
      </View>

      {/* Right: Wheel */}
      <View style={styles.wheelContainer} onLayout={handleWheelLayout}>
        <Animated.FlatList
          ref={flatListRef}
          data={sessions}
          keyExtractor={(item) => item.SessionId?.toString() ?? item.id?.toString()}
          renderItem={({ item, index }) => (
            <WheelItem
              item={{
                ...item,
                startTime: item.SessionStartTime ?? '',
                duration: item.SessionLength,
                note: item.SessionNote,
              }}
              index={index}
              scrollY={scrollY}
              IsActive={index === selectedIndex}
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
          // Only set initialScrollIndex when we actually have items
          initialScrollIndex={sessions.length > 0 ? selectedIndex : undefined}
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
      <ManualSessionEntry
        visible={manualVisible}
        onClose={() => {
          setManualVisible(false);
          setEditSession(null);
        }}
        mode="edit"
        initialSession={editSession}
        onSubmit={() => {
          // Refresh sessions after edit
          if (user?.id && selectedYear?.JewishYear) {
            getSessionsByUserAndYear(user.id, selectedYear.JewishYear).then((data) => {
              setSessions(data || []);
            });
          }
        }}
      />
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
  button: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderRadius: 8,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 4,
  },  
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  placeholder: { textAlign: 'center', fontSize: 16, color: '#999' },

  disabledMsg: {
    color: '#adb5bd',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 15,
  }
});
