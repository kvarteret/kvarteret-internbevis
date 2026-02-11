import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { colors } from "../../constants/theme";

interface UserAvatarProps {
  imageUrl?: string;
  animationTrigger: number;
}

const localImageMap: Record<string, number> = {
  "assets/images/demopingvin.png": require("../../../assets/images/demopingvin.png"),
};

export function UserAvatar({
  imageUrl,
  animationTrigger,
}: UserAvatarProps): React.JSX.Element {
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 600;
  const radius = useMemo(
    () => (isSmallScreen ? height * 0.1 : height * 0.1),
    [height, isSmallScreen],
  );

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
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotationAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: ["-1rad", "1rad"],
              }),
            },
          ],
        }}
      >
        <View
          style={[
            styles.avatar,
            { width: radius * 2, height: radius * 2, borderRadius: radius },
          ]}
        >
          {localImageSource ? (
            <Image
              source={localImageSource}
              style={styles.image}
              resizeMode="cover"
            />
          ) : hasRemoteImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallback}>
              <MaterialIcons
                name="person"
                size={radius}
                color={colors.gray600}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    overflow: "hidden",
    backgroundColor: colors.gray200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
