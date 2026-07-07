import { useState } from "react";

import { DatePicker } from "./DatePicker";
import { DateRangePicker } from "./DateRangePicker";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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

function DefaultStory() {
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
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

function WithMinMaxStory() {
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
}

export const WithMinMax: Story = {
  render: () => <WithMinMaxStory />,
};

function RangeStory() {
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
}

export const Range: Story = {
  render: () => <RangeStory />,
};

function SizeSmallStory() {
  const [value, setValue] = useState("2026-06-05");
  return (
    <div style={{ width: 180 }}>
      <DatePicker label="Small" size="sm" value={value} onChange={setValue} />
    </div>
  );
}

export const SizeSmall: Story = {
  render: () => <SizeSmallStory />,
};

function SizeMediumStory() {
  const [value, setValue] = useState("2026-06-05");
  return (
    <div style={{ width: 220 }}>
      <DatePicker label="Medium" size="md" value={value} onChange={setValue} />
    </div>
  );
}

export const SizeMedium: Story = {
  render: () => <SizeMediumStory />,
};
