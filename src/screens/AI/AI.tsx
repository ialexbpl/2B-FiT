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
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Correct: nullable ref with optional chaining on usage
  const scrollRef = useRef<ScrollView | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      author: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    // Add temporary loading message
    const loadingId = 'loading-' + Date.now();
    setMessages(prev => [
      ...prev,
      { id: loadingId, author: 'ai', text: 'Myślę...', time: '' }
    ]);

    try {
      // Try multiple endpoints in order
      const endpoints = [
        'http://192.168.1.104:8000/chat', // LAN IP (Physical Device)
        'http://10.0.2.2:8000/chat',      // Android Emulator
        'http://localhost:8000/chat'      // iOS Simulator
      ];

      let response;
      let error;

      for (const url of endpoints) {
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText }),
          });
          if (response.ok) break; // Success!
        } catch (e) {
          error = e;
          continue; // Try next endpoint
        }
      }

      if (!response || !response.ok) {
        throw error || new Error('Failed to connect to any AI server endpoint');
      }

      const data = await response.json();

      setMessages(prev => prev.map(msg =>
        msg.id === loadingId
          ? {
            ...msg,
            text: data.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          : msg
      ));

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === loadingId
          ? {
            ...msg,
            text: 'Nie udało się połączyć z serwerem AI. Sprawdź czy okno "Python AI Server" jest otwarte na komputerze.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          : msg
      ));
    }
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
