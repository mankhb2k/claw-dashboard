import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import styles from "./Select.module.css";

type SelectOption = {
  value: string;
  label: string;
};

export type SelectLabelPosition = "top" | "left" | "right" | "none";

interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  /** Label position: top, left, right, or hidden. Default `top`. */
  labelPosition?: SelectLabelPosition;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      name,
      label,
      labelPosition = "top",
      error,
      value,
      defaultValue,
      onValueChange,
      placeholder = "Select an option",
      options,
      disabled,
      className,
      style,
    },
    ref,
  ) => {
    const triggerClass = [
      styles.trigger,
      error ? styles.triggerError : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");
    const showLabel = Boolean(label) && labelPosition !== "none";
    const isHorizontalLabel =
      labelPosition === "left" || labelPosition === "right";

    const labelElement = showLabel ? (
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
    ) : null;

    const selectElement = (
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
          style={style}
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
    );

    const errorElement = error ? (
      <span className={styles.error}>{error}</span>
    ) : null;

    return (
      <div className={styles.field}>
        {labelPosition === "top" && labelElement}

        {isHorizontalLabel ? (
          <>
            <div className={styles.fieldRow}>
              {labelPosition === "left" && labelElement}
              <div className={styles.selectWrap}>{selectElement}</div>
              {labelPosition === "right" && labelElement}
            </div>
            {errorElement}
          </>
        ) : (
          <div className={styles.control}>
            {selectElement}
            {errorElement}
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
