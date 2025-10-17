import { StyleSheet } from 'react-native';

export const makeStyles = (isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: 24,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      marginBottom: 12,
      direction: isRTL ? 'rtl' : 'ltr',
    },
    button: {
      backgroundColor: '#3b82f6',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
  });

