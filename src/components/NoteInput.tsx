"use client";

import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Category, CATEGORIES } from "@/types/note";

interface NoteInputProps {
  onAddNote: (content: string, category: Category) => void;
  isSaving?: boolean;
}

export function NoteInput({ onAddNote, isSaving = false }: NoteInputProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("할 일");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSaving) return;
    onAddNote(content.trim(), category);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-4xl mx-auto bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-2xl p-5 sm:p-7 shadow-xl border border-zinc-200 dark:border-zinc-700/60 transition-colors"
    >
      <div className="flex flex-col gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새로운 포스트잇 메모를 작성하세요... (Shift+Enter로 줄바꿈, Enter로 추가)"
          rows={5}
          className="w-full min-h-[140px] sm:min-h-[170px] resize-y rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/60 p-4 text-base sm:text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 leading-relaxed transition-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              분류:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="text-sm sm:text-base font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 cursor-pointer transition-colors shadow-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 추가하기 버튼 */}
          <button
            type="submit"
            disabled={!content.trim() || isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm sm:text-base font-semibold text-zinc-900 bg-amber-300 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-md transition-all ml-auto"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.5]" />
            )}
            추가하기
          </button>
        </div>
      </div>
    </form>
  );
}
