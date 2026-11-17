import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import { AppInput, AppInputProps } from './AppInput';
import { AppText } from '../typography';
import { spacing } from '../../theme';

export interface AppTextAreaProps extends AppInputProps {
  /**
   * Minimum height of the multiline input area.
   * @default 112
   */
  minHeight?: number;

  /**
   * Whether to display the live character counter.
   * Only active when `maxLength` is specified.
   * @default true
   */
  showCharacterCount?: boolean;
}

/**
 * AppTextArea — Accessible, responsive multiline text area with dynamic
 * character counting, vertical alignment, and no text clipping.
 */
export const AppTextArea = forwardRef<TextInput, AppTextAreaProps>(
  (
    {
      label,
      minHeight = 112,
      numberOfLines = 4,
      showCharacterCount = true,
      maxLength,
      value,
      testID = 'text-area',
      inputBoxStyle,
      inputStyle,
      themeMode,
      ...restProps
    },
    ref
  ) => {
    const currentLength = typeof value === 'string' ? value.length : 0;
    const shouldDisplayCounter = showCharacterCount && maxLength !== undefined;

    const counterAccessory = shouldDisplayCounter ? (
      <View
        style={styles.counterContainer}
        testID={testID ? `${testID}-char-count-container` : 'char-count-container'}
      >
        <AppText
          variant="caption"
          color="muted"
          themeMode={themeMode}
          testID={testID ? `${testID}-char-count` : 'text-area-char-count'}
        >
          {`${currentLength} / ${maxLength}`}
        </AppText>
      </View>
    ) : null;

    return (
      <AppInput
        ref={ref}
        label={label}
        multiline={true}
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        maxLength={maxLength}
        value={value}
        testID={testID}
        themeMode={themeMode}
        inputBoxStyle={[
          styles.textAreaBox,
          { minHeight },
          inputBoxStyle
        ] as StyleProp<ViewStyle>}
        inputStyle={[
          styles.textAreaInput,
          { minHeight: minHeight - 32 },
          inputStyle
        ] as StyleProp<TextStyle>}
        rightAccessory={counterAccessory}
        {...restProps}
      />
    );
  }
);

AppTextArea.displayName = 'AppTextArea';

const styles = StyleSheet.create({
  textAreaBox: {
    paddingVertical: spacing.spaceSm,
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  textAreaInput: {
    flex: 1,
    textAlignVertical: 'top'
  },
  counterContainer: {
    alignSelf: 'flex-end',
    marginTop: spacing.spaceXs,
    paddingHorizontal: spacing.spaceXs
  }
});
