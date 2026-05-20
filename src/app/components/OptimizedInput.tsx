import { useState, useEffect, KeyboardEvent } from 'react';

interface OptimizedInputProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  required?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal';
  list?: string;
}

/**
 * Input optimizado que solo guarda al presionar Enter o perder el foco
 */
export function OptimizedInput({
  value,
  onSave,
  type = 'text',
  className = '',
  placeholder = '',
  min,
  max,
  step,
  required,
  inputMode,
  list
}: OptimizedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar con el valor externo cuando cambia
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    if (type === 'number') {
      const numValue = parseFloat(localValue.toString()) || 0;
      if (numValue !== value) {
        onSave(numValue);
      }
    } else {
      if (localValue !== value) {
        onSave(localValue);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(type === 'number' ? e.target.value : e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      required={required}
      inputMode={inputMode}
      list={list}
    />
  );
}
