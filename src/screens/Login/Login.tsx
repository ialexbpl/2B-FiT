import React, { useMemo, useState } from 'react';
import { I18nManager, Text, TextInput, View, Pressable } from 'react-native';
import { makeStyles } from './styles';
import type { LoginProps } from './login.types';
import { t } from '@utils/i18n';

export const Login: React.FC<LoginProps> = () => {
  const styles = useMemo(() => makeStyles(I18nManager.isRTL), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('login.title')}</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      <TextInput
        placeholder={t('login.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder={t('login.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={() => { /* no-op */ }}>
        <Text style={styles.buttonText}>{t('login.submit')}</Text>
      </Pressable>
    </View>
  );
};

export default Login;

