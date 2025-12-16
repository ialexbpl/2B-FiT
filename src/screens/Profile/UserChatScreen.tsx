import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView 
} from 'react-native';

interface Props {
  route: any;
  navigation: any;
}

// Przykładowe dane (Mock), żebyś widział jak wygląda czat
const MOCK_HISTORY = [
  { id: '1', text: 'Hej! Widziałem, że też lubisz motoryzację.', isMe: false, time: '10:00' },
  { id: '2', text: 'Cześć! Tak, dokładnie. Jeżdżę głównie w weekendy.', isMe: true, time: '10:05' },
  { id: '3', text: 'Super, musimy się kiedyś ustawić na jakiś zlot.', isMe: false, time: '10:15' },
];

const UserChatScreen = ({ route, navigation }: Props) => {
  const { chatId, targetUserId, userName, isNewChat } = route.params || {};
  const [messageText, setMessageText] = useState('');
  
  // Jeśli to nowy czat, lista jest pusta. Jeśli stary - ładujemy mocki (później tu wepnie backend)
  const [messages, setMessages] = useState(isNewChat ? [] : MOCK_HISTORY);

  useEffect(() => {
    if (userName) {
      navigation.setOptions({ 
        title: userName,
        headerStyle: { backgroundColor: '#fff', shadowColor: 'transparent', elevation: 0 },
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      });
    }
  }, [navigation, userName]);

  const handleSend = () => {
    if (messageText.trim().length === 0) return;

    // Symulacja wysłania wiadomości (dodajemy do listy lokalnie)
    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');
  };

  // Komponent pojedynczego dymku wiadomości
  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.isMe;
    return (
      <View style={[
        styles.messageRow, 
        isMe ? styles.rowRight : styles.rowLeft
      ]}>
        {!isMe && <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{userName?.charAt(0)}</Text></View>}
        
        <View style={[
          styles.bubble, 
          isMe ? styles.bubbleMe : styles.bubbleThem
        ]}>
          <Text style={[styles.msgText, isMe ? styles.textMe : styles.textThem]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeThem]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90} // Dostosuj jeśli masz wysoki header
      >
        
        {/* LISTA WIADOMOŚCI */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            // Co wyświetlić, gdy czat jest pusty (New Chat)
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={{fontSize: 40}}>👋</Text>
              </View>
              <Text style={styles.emptyTitle}>Zacznij rozmowę</Text>
              <Text style={styles.emptySub}>
                To początek Twojej historii z {userName}. Napisz coś miłego!
              </Text>
            </View>
          }
        />

        {/* PASEK INPUTA */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Napisz wiadomość..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
             {/* Używam znaku zamiast ikony, żeby nie trzeba było instalować bibliotek */}
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7', // Jasne, nowoczesne tło
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    flexGrow: 1,
  },
  
  // --- Style Wiadomości (Dymki) ---
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
    elevation: 1, // Delikatny cień Android
    shadowColor: "#000", // Cień iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  bubbleMe: {
    backgroundColor: '#007AFF', // Nowoczesny niebieski (iMessage style)
    borderBottomRightRadius: 4, // "Ogonek" dymka
  },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4, // "Ogonek" dymka
  },
  msgText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textMe: {
    color: '#fff',
  },
  textThem: {
    color: '#000',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  timeThem: { color: '#999' },

  // --- Awatar przy wiadomości odbiorcy ---
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },

  // --- Pusty stan (New Chat) ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySub: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
    maxWidth: '70%',
  },

  // --- Input Bar na dole ---
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100, // Żeby nie rósł w nieskończoność
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 2, // Optyczna korekta środka
  }
});

export default UserChatScreen;