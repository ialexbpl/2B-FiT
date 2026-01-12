// src/screens/AI/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import type { Palette } from '@styles/theme';

type Props = {
    palette: Palette;
};

export const TypingIndicator: React.FC<Props> = ({ palette }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const animation = Animated.parallel([
            animateDot(dot1, 0),
            animateDot(dot2, 150),
            animateDot(dot3, 300),
        ]);

        animation.start();

        return () => animation.stop();
    }, [dot1, dot2, dot3]);

    const animatedStyle = (dot: Animated.Value) => ({
        transform: [
            {
                translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                }),
            },
        ],
        opacity: dot.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
        }),
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.dot,
                    { backgroundColor: palette.subText },
                    animatedStyle(dot1),
                ]}
            />
            <Animated.View
                style={[
                    styles.dot,
                    { backgroundColor: palette.subText },
                    animatedStyle(dot2),
                ]}
            />
            <Animated.View
                style={[
                    styles.dot,
                    { backgroundColor: palette.subText },
                    animatedStyle(dot3),
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
