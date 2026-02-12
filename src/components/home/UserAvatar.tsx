import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, View, useWindowDimensions } from 'react-native';
import { colors } from '../../constants/theme';

interface UserAvatarProps {
  imageUrl?: string;
  animationTrigger: number;
}

const localImageMap: Record<string, number> = {
  'assets/images/demopingvin.png': require('../../../assets/images/demopingvin.png'),
};

export function UserAvatar({ imageUrl, animationTrigger }: UserAvatarProps): React.JSX.Element {
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 600;
  const radius = useMemo(() => (isSmallScreen ? height * 0.1 : height * 0.1), [height, isSmallScreen]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animationTrigger === 0) {
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotationAnim, {
          toValue: 0.2,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: -0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [animationTrigger, rotationAnim, scaleAnim]);

  const localImageSource = imageUrl ? localImageMap[imageUrl] : undefined;
  const hasRemoteImage = Boolean(imageUrl && !localImageSource);

  return (
    <View className="items-center justify-center">
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotationAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-1rad', '1rad'],
              }),
            },
          ],
        }}
      >
        <View
          className="overflow-hidden bg-surface-muted"
          style={{ width: radius * 2, height: radius * 2, borderRadius: radius }}
        >
          {localImageSource ? (
            <Image className="h-full w-full" resizeMode="cover" source={localImageSource} />
          ) : null}

          {!localImageSource && hasRemoteImage ? (
            <Image className="h-full w-full" resizeMode="cover" source={{ uri: imageUrl }} />
          ) : null}

          {!localImageSource && !hasRemoteImage ? (
            <View className="h-full w-full items-center justify-center">
              <MaterialIcons color={colors.gray600} name="person" size={radius} />
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
