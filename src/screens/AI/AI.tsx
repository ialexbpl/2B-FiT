// src/screens/AI/AI.tsx
// Notes:
// - Consider removing unused imports (e.g., Text) to keep the bundle tidy.
// - Keep useMemo usage consistent: either import { useMemo } and call useMemo(...)
//   or call React.useMemo(...) and drop it from the named import.
// - Seed messages contain mojibake (encoding issue). Replace with proper UTF‑8 strings.
// - The nullable ref type and optional chaining are correct for ScrollView refs.

import React, { useMemo, useRef, useState } from 'react';
import { /* Text, */ ScrollView, KeyboardAvoidingView, Platform } from 'react-native'; // Text not used here
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { makeAIStyles } from './AIStyles';
import { AIConversation } from './AIConversation';

// Exported to share the type with AIConversation
export type ChatMessage = {
  id: string;
  author: 'user' | 'ai';
  text: string;
  time: string;
};

export const AI: React.FC = () => {
  const { palette, theme } = useTheme();

  // Consistency tip: either use `useMemo` (imported) or `React.useMemo` — not both.
  const styles = useMemo(() => makeAIStyles(palette, theme), [palette, theme]);

  const [input, setInput] = useState('');

  // Encoding NOTE: fix mojibake below; e.g. 'Cześć! Jak mogę Ci dziś pomóc? 🙂'
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm1', author: 'ai', text: 'Cześć! Jak mogę Ci dziś pomóc? 🙂', time: '6:50 pm' },
    { id: 'm2', author: 'user', text: 'Pokaż mi podsumowanie treningów z tygodnia.', time: '6:53 pm' },
    { id: 'm3', author: 'ai', text: 'Jasne! Chcesz zobaczyć to w formie wykresu?', time: '6:55 pm' },
  ]);

  // Correct: nullable ref with optional chaining on usage
  const scrollRef = useRef<ScrollView | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      author: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    // Works fine; an alternative is a useEffect that scrolls when messages.length changes
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handlePickImage = () => {
    // Future: hook up Expo ImagePicker/Camera
    console.log('Open camera/gallery');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 50, android: 0 })}
      >
        <AIConversation
          scrollRef={scrollRef}
          styles={styles}
          palette={palette}
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onPickImage={handlePickImage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AI;
