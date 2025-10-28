// src/screens/AI/AIConversation.tsx
// Notes:
// - Prop type for scrollRef accepts nullable/mutable ref — compatible with useRef<ScrollView|null>(null).
// - Added keyboardShouldPersistTaps for better UX with keyboard.
// - Encoding NOTE: fix Polish strings in placeholders/accessibility labels (mojibake).
// - Optional: Use a dedicated ai-avatar for AI messages (you already have ai-avatar.png).

import React from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from './AI';
import { makeAIStyles } from './AIStyles';
import type { Palette } from '@styles/theme';

type Styles = ReturnType<typeof makeAIStyles>;

type Props = {
  // Good: supports both RefObject and MutableRefObject with nullable current
  scrollRef: React.RefObject<ScrollView> | React.MutableRefObject<ScrollView | null>;
  styles: Styles;
  palette: Palette;
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onPickImage: () => void;
};

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

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled" // prevents keyboard from dismissing on taps
      >
        {messages.map(msg => {
          const isUser = msg.author === 'user';
          return (
            <View key={msg.id} style={[styles.messageRow, isUser ? styles.right : styles.left]}>
              {!isUser && (
                <Image
                  // Suggestion: use ai-avatar.png for AI messages for clarity
                  // source={require('../../assets/ai-avatar.png')}
                  source={require('../../assets/logo.png')}
                  style={styles.avatar}
                />
              )}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
                <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAI]}>
                  {msg.text}
                </Text>
                <Text style={styles.timeText}>{msg.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputBar}>
        <Pressable
          onPress={onPickImage}
          // Encoding NOTE: replace with proper UTF‑8, e.g. "Dodaj zdjęcie"
          accessibilityLabel="Dodaj zdjęcie"
          style={[styles.iconButton, styles.iconSecondary]}
        >
          <Ionicons name="camera" size={20} color={palette.subText} />
        </Pressable>

        <TextInput
          value={input}
          onChangeText={setInput}
          // Encoding NOTE: replace with proper UTF‑8
          placeholder="Hej w czym mogę ci dzisiaj pomóc"
          placeholderTextColor={palette.subText}
          style={styles.textInput}
          multiline
        />

        <Pressable
          onPress={onSend}
          // Encoding NOTE: replace with proper UTF‑8, e.g. "Wyślij wiadomość"
          accessibilityLabel="Wyślij wiadomość"
          style={[styles.iconButton, styles.iconPrimary, disabled && { opacity: 0.6 }]}
          disabled={disabled}
        >
          <Ionicons name="send" size={18} color={palette.onPrimary} />
        </Pressable>
      </View>
    </>
  );
};
