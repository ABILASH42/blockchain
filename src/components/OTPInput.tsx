import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [localValue, setLocalValue] = useState<string[]>(
    value.split('').concat(Array(length).fill('')).slice(0, length)
  );

  useEffect(() => {
    const newValue = value.split('').concat(Array(length).fill('')).slice(0, length);
    setLocalValue(newValue);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/[^0-9]/g, '');
    
    if (digit.length > 1) {
      // Handle paste of multiple digits
      handlePaste(index, digit);
      return;
    }

    const newValue = [...localValue];
    newValue[index] = digit;
    setLocalValue(newValue);
    onChange(newValue.join(''));

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!localValue[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = [...localValue];
        newValue[index] = '';
        setLocalValue(newValue);
        onChange(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (startIndex: number, pastedData: string) => {
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, length);
    const newValue = [...localValue];
    
    for (let i = 0; i < digits.length && startIndex + i < length; i++) {
      newValue[startIndex + i] = digits[i];
    }
    
    setLocalValue(newValue);
    onChange(newValue.join(''));

    // Focus the next empty input or the last input
    const nextEmptyIndex = newValue.findIndex((val, idx) => idx >= startIndex && !val);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePaste(index, pastedData);
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={localValue[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePasteEvent(e, index)}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 bg-slate-950/80 text-slate-50 
            focus:outline-none focus:ring-2 transition-all
            ${
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                : localValue[index]
                ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/50'
                : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          `}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
