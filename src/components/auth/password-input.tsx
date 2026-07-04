import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { AuthInput, type AuthInputProps } from '@/components/auth/auth-input';
import { useTheme } from '@/hooks/use-theme';

export function PasswordInput(props: AuthInputProps) {
  const [hidden, setHidden] = useState(true);
  const theme = useTheme();

  return (
    <AuthInput
      icon="lock-closed"
      secureTextEntry={hidden}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      trailing={
        <Pressable
          onPress={() => setHidden((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>
      }
      {...props}
    />
  );
}
