"use client";

import React, { useState } from "react";

type InteractiveTextareaProps = {
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  onChangeText?: (value: string) => void;
};

export default function InteractiveTextarea({
  label = "Message",
  placeholder = "Type something...",
  maxLength = 500,
  rows = 5,
  onChangeText,
}: InteractiveTextareaProps) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChangeText) onChangeText(newValue);
  };

  const remaining = maxLength - value.length;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="sr-only font-semibold text-sm" htmlFor="input-interactive-textarea">{label}</label>
      )}

      <textarea
        id="input-interactive-textarea"
        name="input-interactive-textarea"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="block w-full p-3 rounded-sm border border-gray-300 bg-white resize-y outline-none focus:ring-2 focus:ring-ppai-teal-500 focus:border-ppai-teal-500"
      />

      <div className="text-xs flex justify-between text-gray-500">
        <span>{value.length === 0 ? "Start typing above…" : "Typing…"}</span>
        <span>{remaining} characters left</span>
      </div>
    </div>
  );
}
