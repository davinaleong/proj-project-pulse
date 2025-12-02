"use client";

import React, { useState } from "react";

type InteractiveTextareaProps = {
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  value?: string;
  onChangeText?: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export default function InteractiveTextarea({
  label = "Message",
  placeholder = "Type something...",
  maxLength = 500,
  rows = 5,
  value: externalValue,
  onChangeText,
  onKeyPress,
}: InteractiveTextareaProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue !== undefined ? externalValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (externalValue === undefined) {
      setInternalValue(newValue);
    }
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
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="block w-full min-h-[2ch] p-2 rounded-sm bg-white resize-y outline-none focus:ring-2 focus:ring-ppai-teal-500 focus:border-ppai-teal-500"
      />

      <div className="text-xs flex justify-between text-gray-500">
        <span>{value.length === 0 ? "Start typing above…" : "Typing…"}</span>
        <span>{remaining} characters left</span>
      </div>
    </div>
  );
}
