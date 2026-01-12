// src/screens/AI/AIConversation.tsx
// Enhanced with animations, typing indicator, and haptic feedback

import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from './AI';
import { TypingIndicator } from './TypingIndicator';
import { makeAIStyles } from './AIStyles';
import type { Palette } from '@styles/theme';

type Styles = ReturnType<typeof makeAIStyles>;

type Props = {
  scrollRef: React.RefObject<ScrollView> | React.MutableRefObject<ScrollView | null>;
  styles: Styles;
  palette: Palette;
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onPickImage: () => void;
};

// Animated message component with fade-in effect
const AnimatedMessage: React.FC<{
  msg: ChatMessage;
  styles: Styles;
  palette: Palette;
}> = React.memo(({ msg, styles, palette }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isUser = msg.author === 'user';
  const isLoading = msg.id.startsWith('loading-');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.right : styles.left,
        { opacity: fadeAnim },
      ]}
    >
      {!isUser && (
        <Image
          source={require('../../assets/logo.png')}
          style={styles.avatar}
        />
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {isLoading ? (
          <TypingIndicator palette={palette} />
        ) : (
          <>
            <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAI]}>
              {msg.text}
            </Text>
            {msg.time && <Text style={styles.timeText}>{msg.time}</Text>}
          </>
        )}
      </View>
    </Animated.View>
  );
});

AnimatedMessage.displayName = 'AnimatedMessage';

export const AIConversation: React.FC<Props> = ({
  scrollRef,
  styles,
  palette,
  messages,
  input,
  setInput,
  onSend,
  onPickImage,
}) => {
  const disabled = !input.trim();

  const handleSend = async () => {
    if (disabled) return;

    // Haptic feedback on send
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend();
  };

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPickImage();
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <AnimatedMessage
            key={msg.id}
            msg={msg}
            styles={styles}
            palette={palette}
          />
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <Pressable
          onPress={handlePickImage}
          accessibilityLabel="Add photo"
          style={[styles.iconButton, styles.iconSecondary]}
        >
          <Ionicons name="camera" size={22} color={palette.subText} />
        </Pressable>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Hey, how can I help you today?"
          placeholderTextColor={palette.subText}
          style={styles.textInput}
          multiline
          maxLength={1000}
        />

        <Pressable
          onPress={handleSend}
          accessibilityLabel="Send message"
          accessibilityState={{ disabled }}
          style={[
            styles.iconButton,
            styles.iconPrimary,
            disabled && styles.iconPrimaryDisabled,
          ]}
          disabled={disabled}
        >
          <Ionicons name="send" size={20} color={palette.onPrimary} />
        </Pressable>
      </View>
    </>
  );
};
