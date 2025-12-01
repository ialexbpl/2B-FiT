// src/screens/AI/AI.tsx
import React, { useMemo, useRef, useState } from 'react';
import { /* Text, */ ScrollView, KeyboardAvoidingView, Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { makeAIStyles } from './AIStyles';
import { AIConversation } from './AIConversation';

export type ChatMessage = {
  id: string;
  author: 'user' | 'ai';
  text: string;
  time: string;
};

export const AI: React.FC = () => {
  const { palette, theme } = useTheme();
  const styles = useMemo(() => makeAIStyles(palette, theme), [palette, theme]);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      author: 'user',
      text: userText,
      time: timeLabel,
    };

    const baseMessages = [...messages, userMsg];
    const loadingId = 'loading-' + Date.now();
    const loadingMsg: ChatMessage = { id: loadingId, author: 'ai', text: 'Mysle...', time: '' };

    setMessages([...baseMessages, loadingMsg]);
    setInput('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    const historyPayload = baseMessages.slice(-10).map(msg => ({
      role: msg.author === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    // Build endpoints dynamically: env override, then LAN from Metro host, then platform fallbacks
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    const bundlerHost = scriptURL ? scriptURL.split('://')[1]?.split(':')[0] : undefined;
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as any)?.manifest?.hostUri ??
      (Constants as any)?.manifest?.debuggerHost;
    const hostFromConfig = hostUri?.split(':')[0];
    const host = bundlerHost || hostFromConfig;
    const envBase = process.env.EXPO_PUBLIC_AI_BASE_URL?.replace(/\/+$/, ''); // e.g. http://192.168.x.x:8000
    const lanBase = host ? `http://${host}:8000` : undefined;

    const endpoints = [
      envBase ? `${envBase}/chat` : undefined, // set EXPO_PUBLIC_AI_BASE_URL in .env for stable URL (LAN/tunnel)
      lanBase ? `${lanBase}/chat` : undefined, // derived from Metro host (LAN)
      'http://10.0.2.2:8000/chat', // Android emulator
      'http://localhost:8000/chat' // iOS simulator
    ].filter(Boolean) as string[];
    console.log('[AI] endpoints to try:', endpoints);

    try {
      let response;
      let error;

      for (const url of endpoints) {
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText, history: historyPayload }),
          });
          if (response.ok) break;
        } catch (e) {
          error = e;
          continue;
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
            text: 'Nie udalo sie polaczyc z serwerem AI. Sprawdz czy okno "Python AI Server" jest otwarte na komputerze.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          : msg
      ));
    }
  };

  const handlePickImage = () => {
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
