import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DatePicker } from "./DatePicker";
import { DateRangePicker } from "./DateRangePicker";

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("2026-06-05");
    return (
      <div style={{ width: 240 }}>
        <DatePicker
          label="Date"
          value={value}
          onChange={setValue}
          placeholder="Select date"
        />
      </div>
    );
  },
};

export const WithMinMax: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div style={{ width: 240 }}>
        <DatePicker
          label="Within June 2026"
          value={value}
          onChange={setValue}
          min="2026-06-01"
          max="2026-06-30"
        />
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [from, setFrom] = useState("2026-05-30");
    const [to, setTo] = useState("2026-06-05");
    return (
      <DateRangePicker
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />
    );
  },
};

export const SizeSmall: Story = {
  render: () => {
    const [value, setValue] = useState("2026-06-05");
    return (
      <div style={{ width: 180 }}>
        <DatePicker label="Small" size="sm" value={value} onChange={setValue} />
      </div>
    );
  },
};

export const SizeMedium: Story = {
  render: () => {
    const [value, setValue] = useState("2026-06-05");
    return (
      <div style={{ width: 220 }}>
        <DatePicker
          label="Medium"
          size="md"
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};
