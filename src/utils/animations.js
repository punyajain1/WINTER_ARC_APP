import { Animated } from 'react-native';

// Dissolve fade-in animation - minimalistic and smooth
export const useFadeIn = (duration = 400) => {
  const opacity = new Animated.Value(0);

  const fadeIn = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return { opacity, fadeIn };
};

// Dissolve fade-out animation
export const useFadeOut = (duration = 400) => {
  const opacity = new Animated.Value(1);

  const fadeOut = (callback) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start(callback);
  };

  return { opacity, fadeOut };
};

// Smooth scale animation for cards
export const useScaleAnimation = (duration = 300) => {
  const scale = new Animated.Value(0.95);

  const scaleIn = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  return { scale, scaleIn };
};

// Slide and fade animation for list items
export const useSlideInAnimation = (duration = 400, delay = 0) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(20);

  const slideIn = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { opacity, translateY, slideIn };
};

// Stagger animation for multiple items
export const staggerAnimation = (items, itemDelay = 100) => {
  const animations = items.map((_, index) => {
    const opacity = new Animated.Value(0);
    const translateY = new Animated.Value(20);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * itemDelay);

    return { opacity, translateY };
  });

  return animations;
};

// Pulse animation for attention
export const usePulseAnimation = () => {
  const scale = new Animated.Value(1);

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, pulse };
};
