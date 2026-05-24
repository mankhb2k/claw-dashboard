import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import styles from "./Select.module.css";

type SelectOption = {
  value: string;
  label: string;
};

interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      name,
      label,
      error,
      value,
      defaultValue,
      onValueChange,
      placeholder = "Select an option",
      options,
      disabled,
    },
    ref,
  ) => {
    const triggerClass = `${styles.trigger} ${error ? styles.triggerError : ""}`;

    return (
      <div className={styles.field}>
        {label ? (
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        ) : null}

        <SelectPrimitive.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          disabled={disabled}
          name={name}
        >
          <SelectPrimitive.Trigger
            id={id}
            ref={ref}
            className={triggerClass}
            aria-invalid={!!error}
            data-slot="select-trigger"
          >
            <SelectPrimitive.Value
              className={styles.value}
              placeholder={placeholder}
              data-slot="select-value"
            />
            <SelectPrimitive.Icon className={styles.icon}>
              <ChevronDown size={14} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={styles.content}
              position="popper"
              sideOffset={6}
            >
              <SelectPrimitive.Viewport className={styles.viewport}>
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className={styles.item}
                  >
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator
                      className={styles.itemIndicator}
                    >
                      <Check size={14} />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {error ? <span className={styles.error}>{error}</span> : null}
      </div>
    );
  },
);

Select.displayName = "Select";
