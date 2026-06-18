import React from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../../shared/constants/colors';

type FieldProps = {
  label: string;
} & TextInputProps;

export function AdminTextField({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#666666"
        selectionColor={Colors.gold}
        {...props}
      />
    </View>
  );
}

type PickerProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function AdminPickerField<T extends string>({
  label,
  value,
  options,
  onChange,
}: PickerProps<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={value}
          onValueChange={(v) => onChange(v as T)}
          style={styles.picker}
          dropdownIconColor={Colors.gold}
        >
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#FFFFFF" />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    color: '#FFFFFF',
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  pickerWrap: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
  },
});
