// src/screens/AI/AI.tsx
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, NativeModules, View, Text, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { makeAIStyles } from './AIStyles';
import { AIConversation } from './AIConversation';

export type ChatMessage = {
  id: string;
  author: 'user' | 'ai';
  text: string;
  time: string;
};

// Check if we're in a standalone build (APK) vs development
const isStandaloneBuild = !__DEV__;

export const AI: React.FC = () => {
  const { palette, theme } = useTheme();
  const styles = useMemo(() => makeAIStyles(palette, theme), [palette, theme]);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const scrollRef = useRef<ScrollView | null>(null);

  // Get AI server URL from environment or use fallback
  const getAIEndpoints = (): string[] => {
    const envBase = process.env.EXPO_PUBLIC_AI_BASE_URL?.replace(/\/+$/, '');
    
    // In standalone builds, only use the environment variable
    if (isStandaloneBuild) {
      if (envBase) {
        return [`${envBase}/chat`];
      }
      return []; // No server available in standalone without env var
    }

    // In development, try multiple endpoints
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    const bundlerHost = scriptURL ? scriptURL.split('://')[1]?.split(':')[0] : undefined;
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as any)?.manifest?.hostUri ??
      (Constants as any)?.manifest?.debuggerHost;
    const hostFromConfig = hostUri?.split(':')[0];
    const host = bundlerHost || hostFromConfig;
    const lanBase = host ? `http://${host}:8000` : undefined;

    return [
      envBase ? `${envBase}/chat` : undefined,
      lanBase ? `${lanBase}/chat` : undefined,
      'http://10.0.2.2:8000/chat', // Android emulator
      'http://localhost:8000/chat' // iOS simulator
    ].filter(Boolean) as string[];
  };

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
    const loadingMsg: ChatMessage = { id: loadingId, author: 'ai', text: 'Thinking...', time: '' };

    setMessages([...baseMessages, loadingMsg]);
    setInput('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    const historyPayload = baseMessages.slice(-10).map(msg => ({
      role: msg.author === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    const endpoints = getAIEndpoints();
    
    if (endpoints.length === 0) {
      setServerStatus('disconnected');
      setMessages(prev => prev.map(msg =>
        msg.id === loadingId
          ? {
            ...msg,
            text: 'AI Coach is not available in this build. Please set EXPO_PUBLIC_AI_BASE_URL to connect to an AI server.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          : msg
      ));
      return;
    }

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
          if (response.ok) {
            setServerStatus('connected');
            break;
          }
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
      setServerStatus('disconnected');
      setMessages(prev => prev.map(msg =>
        msg.id === loadingId
          ? {
            ...msg,
            text: isStandaloneBuild 
              ? 'Could not connect to AI server. Make sure EXPO_PUBLIC_AI_BASE_URL is set correctly and the server is running.'
              : 'Could not connect to AI server. Make sure the Python AI server is running (run start_ai.bat on your computer).',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          : msg
      ));
    }
  };

  const handlePickImage = () => {
    console.log('Open camera/gallery');
  };

  // Show info banner for standalone builds without AI server
  const showServerInfo = isStandaloneBuild && !process.env.EXPO_PUBLIC_AI_BASE_URL;

  return (
    <SafeAreaView style={styles.container}>
      {showServerInfo && (
        <View style={{
          backgroundColor: theme.colors.warning + '20',
          padding: 12,
          marginHorizontal: 16,
          marginTop: 8,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10
        }}>
          <Ionicons name="information-circle" size={24} color={theme.colors.warning} />
          <Text style={{ color: palette.text, flex: 1, fontSize: 13 }}>
            AI Coach requires a server connection. Contact the developer for setup instructions.
          </Text>
        </View>
      )}
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
