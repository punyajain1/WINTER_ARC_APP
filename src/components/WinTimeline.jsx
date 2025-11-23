import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { X, Calendar, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/utils/theme';
import { getTimelineData, deleteEvidence } from '@/utils/winTracker';
import { useFadeIn, useSlideInAnimation } from '@/utils/animations';

const { width } = Dimensions.get('window');

export const WinTimeline = ({ goalId, onClose, onRefresh }) => {
  const { colors } = useTheme();
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { opacity, fadeIn } = useFadeIn(300);

  useEffect(() => {
    loadTimeline();
  }, [goalId]);

  const loadTimeline = async () => {
    setLoading(true);
    const data = await getTimelineData(goalId);
    setTimelineData(data);
    setLoading(false);
    fadeIn();
  };

  const handleDelete = (evidenceId) => {
    Alert.alert(
      'Delete Evidence',
      'Are you sure you want to delete this win?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvidence(evidenceId);
            loadTimeline();
            if (onRefresh) onRefresh();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 24, paddingTop: 60 }}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>
            Loading timeline...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: colors.background, opacity }}>
      {/* Header */}
      <View style={{ padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Inter_700Bold' }}>
            Win Timeline
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>
          Visual proof of your progress
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {timelineData.length === 0 ? (
          <View style={{ padding: 24, paddingTop: 60, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
              No wins recorded yet.{'\n'}Start uploading evidence of your progress!
            </Text>
          </View>
        ) : (
          <View style={{ padding: 24 }}>
            {timelineData.map((day, dayIndex) => (
              <TimelineDay
                key={day.date}
                day={day}
                colors={colors}
                onDelete={handleDelete}
                index={dayIndex}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const TimelineDay = ({ day, colors, onDelete, index }) => {
  const { opacity, translateY, slideIn } = useSlideInAnimation(400, index * 100);

  useEffect(() => {
    slideIn();
  }, []);

  return (
    <Animated.View
      style={{
        marginBottom: 32,
        opacity,
        transform: [{ translateY }],
      }}
    >
      {/* Date Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Calendar size={16} color={colors.textSecondary} />
        <Text style={{
          marginLeft: 8,
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          fontFamily: 'Inter_600SemiBold',
        }}>
          {day.date}
        </Text>
        <View style={{
          marginLeft: 8,
          backgroundColor: colors.surface,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 4,
        }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter_500Medium' }}>
            {day.count} {day.count === 1 ? 'win' : 'wins'}
          </Text>
        </View>
      </View>

      {/* Evidence Items */}
      <View style={{ gap: 16 }}>
        {day.items.map((item) => (
          <EvidenceCard
            key={item.id}
            item={item}
            colors={colors}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const EvidenceCard = ({ item, colors, onDelete }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={{
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    }}>
      {/* Image */}
      {!imageError ? (
        <Image
          source={{ uri: item.imageUri }}
          style={{
            width: '100%',
            height: width * 0.6,
            backgroundColor: colors.surface,
          }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={{
          width: '100%',
          height: width * 0.6,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>
            Image not available
          </Text>
        </View>
      )}

      {/* Note and Actions */}
      <View style={{ padding: 16 }}>
        {item.note ? (
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <MessageSquare size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={{
              marginLeft: 8,
              flex: 1,
              color: colors.textPrimary,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 20,
            }}>
              {item.note}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: 12,
            color: colors.textTertiary,
            fontFamily: 'Inter_400Regular',
          }}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <TouchableOpacity onPress={onDelete}>
            <Text style={{
              fontSize: 14,
              color: colors.danger,
              fontFamily: 'Inter_500Medium',
            }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
