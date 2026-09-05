"use client";

import React, { useState } from "react";
import { Category } from "@/lib/types";
import { X } from "lucide-react";

interface CategoryEditDialogProps {
  appLabel: string;
  currentCategory: Category;
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: string, newCategory: Category) => void;
}

const CATEGORY_OPTIONS: Array<{ value: Category; label: string; description: string }> = [
  { value: "work", label: "Work", description: "Counts toward Focus time" },
  { value: "sink", label: "Sink", description: "Counts toward Sink time" },
  { value: "games", label: "Games", description: "Separate recreational category" },
  { value: "other-known", label: "Other", description: "Neutral tracked time" },
  { value: "unclassified", label: "Unclassified", description: "Needs classification review" },
];

export function CategoryEditDialog({
  appLabel,
  currentCategory,
  isOpen,
  onClose,
  onSave,
}: CategoryEditDialogProps) {
  const [selected, setSelected] = useState<Category>(currentCategory);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-category-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-fast"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[10px] border border-[#303B49] bg-[#141A22] p-5 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#303B49]">
          <h3 id="edit-category-title" className="text-sm font-semibold text-[#EDF1F5] truncate">
            Classify {appLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-[4px] text-[#94A1B2] hover:text-[#EDF1F5] hover:bg-[#1D2530]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-2.5 rounded-[6px] border cursor-pointer transition-colors ${
                selected === opt.value
                  ? "bg-[#1D2530] border-[#E4B45F] text-[#EDF1F5]"
                  : "bg-[#0D1117] border-[#303B49] text-[#B0BBC9] hover:border-[#94A1B2]"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="mt-0.5 text-[#E4B45F] focus:ring-0"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#EDF1F5]">{opt.label}</span>
                <span className="text-[11px] text-[#94A1B2]">{opt.description}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#303B49]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] border border-[#303B49] text-xs text-[#B0BBC9] hover:bg-[#1D2530]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(appLabel, selected);
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#EDF1F5] text-xs font-semibold text-[#0D1117] hover:bg-white"
          >
            Save Classification
          </button>
        </div>
      </div>
    </div>
  );
}
