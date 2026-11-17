import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppInput } from './AppInput';
import { AppEmailInput } from './AppEmailInput';
import { AppPasswordInput } from './AppPasswordInput';
import { AppTextArea } from './AppTextArea';
import { AppButton } from '../buttons';
import {
  validateRequired,
  validateEmail,
  validatePasswordMinLength
} from '../../utils/validation';
import { spacing } from '../../theme';

export interface FormExampleProps {
  onSubmitSuccess?: (data: {
    name: string;
    email: string;
    description: string;
  }) => void;
  themeMode?: 'light' | 'dark';
  testID?: string;
}

/**
 * FormExample — Development and test demonstration component showcasing
 * controlled input fields, validation on blur and submit, dynamic error clearing,
 * and AppButton integration.
 */
export const FormExample: React.FC<FormExampleProps> = ({
  onSubmitSuccess,
  themeMode,
  testID = 'example-form'
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string | undefined> = {};

    const nameRes = validateRequired(name, 'Name');
    if (!nameRes.isValid) nextErrors.name = nameRes.error;

    const emailReq = validateRequired(email, 'Email address');
    if (!emailReq.isValid) {
      nextErrors.email = emailReq.error;
    } else {
      const emailFmt = validateEmail(email);
      if (!emailFmt.isValid) nextErrors.email = emailFmt.error;
    }

    const passReq = validateRequired(password, 'Password');
    if (!passReq.isValid) {
      nextErrors.password = passReq.error;
    } else {
      const passRes = validatePasswordMinLength(password, 8);
      if (!passRes.isValid) nextErrors.password = passRes.error;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) {
      const res = validateRequired(val, 'Name');
      if (res.isValid) {
        setErrors((prev) => ({ ...prev, name: undefined }));
      }
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      const res = validateEmail(val);
      if (res.isValid) {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password) {
      const res = validatePasswordMinLength(val, 8);
      if (res.isValid) {
        setErrors((prev) => ({ ...prev, password: undefined }));
      }
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (validate()) {
      onSubmitSuccess?.({ name, email, description });
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <AppInput
        label="Name"
        required
        value={name}
        onChangeText={handleNameChange}
        error={errors.name}
        themeMode={themeMode}
        testID={`${testID}-name`}
      />

      <AppEmailInput
        label="Email address"
        required
        value={email}
        onChangeText={handleEmailChange}
        error={errors.email}
        themeMode={themeMode}
        testID={`${testID}-email`}
      />

      <AppPasswordInput
        label="Password"
        required
        value={password}
        onChangeText={handlePasswordChange}
        error={errors.password}
        themeMode={themeMode}
        testID={`${testID}-password`}
      />

      <AppTextArea
        label="Notes"
        maxLength={200}
        value={description}
        onChangeText={setDescription}
        themeMode={themeMode}
        testID={`${testID}-notes`}
      />

      <AppButton
        title="Submit Form"
        onPress={handleSubmit}
        disabled={isSubmitted && Object.values(errors).some(Boolean)}
        themeMode={themeMode}
        testID={`${testID}-submit-btn`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.spaceMd,
    width: '100%'
  }
});
