"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2, Edit3, Check, X, GripVertical } from "lucide-react";
import { Note, Category, CATEGORIES } from "@/types/note";

interface NoteCardProps {
  note: Note;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newContent: string, newCategory: Category) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, index: number) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
  isDragging?: boolean;
}

export function NoteCard({
  note,
  index,
  onDelete,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isDragging = false,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editCategory, setEditCategory] = useState<Category>(note.category);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleSave = () => {
    if (!editContent.trim()) return;
    onUpdate(note.id, editContent.trim(), editCategory);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // 카테고리별 뱃지 스타일
  const categoryBadgeColors: Record<Category, string> = {
    "할 일": "bg-amber-800/10 text-amber-900 border-amber-900/20",
    "아이디어": "bg-purple-800/10 text-purple-900 border-purple-900/20",
    "기타": "bg-slate-800/10 text-slate-900 border-slate-900/20",
  };

  return (
    <div
      data-note-index={index}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => onTouchStart(e, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        backgroundColor: note.color,
        transform: isDragging
          ? "scale(1.05) rotate(0deg)"
          : `rotate(${note.rotation}deg)`,
      }}
      className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-sm shadow-md hover:shadow-2xl transition-all duration-200 select-none min-h-[220px] animate-pop-in ${
        isDragging ? "opacity-60 ring-2 ring-amber-400 z-30" : "hover:z-20 hover:scale-[1.03]"
      }`}
    >
      {/* 상단 반투명 테이프 느낌 그래픽 */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-[1px] border border-white/50 shadow-sm rounded-sm pointer-events-none transform -rotate-1" />

      {/* 포스트잇 상단 바: 카테고리 뱃지 & 수정/삭제 & 드래그 핸들 */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-900 p-0.5 rounded touch-none"
            title="드래그하여 순서 변경"
          >
            <GripVertical className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          {isEditing ? (
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as Category)}
              className="text-[11px] font-bold rounded bg-white/70 text-neutral-900 px-1.5 py-0.5 border border-neutral-300 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${categoryBadgeColors[note.category]}`}
            >
              {note.category}
            </span>
          )}
        </div>

        {/* 조작 버튼 영역 */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                title="저장 (Enter)"
                className="p-1 rounded bg-black/10 hover:bg-black/20 text-neutral-800 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                title="취소 (Esc)"
                className="p-1 rounded bg-black/10 hover:bg-black/20 text-neutral-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="수정하기"
                className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-black/10 text-neutral-800 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                title="삭제하기"
                className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-black/10 text-neutral-800 hover:text-red-700 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 본문 내용 */}
      <div className="flex-1 my-1">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full h-full min-h-[90px] p-2 text-sm text-neutral-900 bg-white/80 border border-neutral-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-neutral-800"
          />
        ) : (
          <p className="text-neutral-900 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap break-words select-text">
            {note.content}
          </p>
        )}
      </div>

      {/* 하단 작성 일시 표시 */}
      <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-neutral-600 font-normal">
        <span className="opacity-75">{note.createdAt}</span>
      </div>
    </div>
  );
}
