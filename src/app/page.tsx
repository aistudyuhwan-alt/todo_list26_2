"use client";

import React, { useState, useEffect } from "react";
import { Filter, StickyNote, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Note, Category, getRandomColor, getRandomRotation, formatDateTime } from "@/types/note";
import { NoteInput } from "@/components/NoteInput";
import { NoteCard } from "@/components/NoteCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  fetchNotesFromSheet,
  createNoteInSheet,
  updateNoteInSheet,
  deleteNoteFromSheet,
  reorderNotesInSheet,
} from "@/lib/googleSheet";

const STORAGE_KEY = "postit_todos_data";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<string>("전체");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // 구글 시트에서 최신 데이터 동기화
  const loadNotesFromGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const sheetData = await fetchNotesFromSheet();
      if (sheetData && sheetData.length > 0) {
        setNotes(sheetData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sheetData));
        showToast("구글 시트에서 최신 메모를 불러왔습니다.");
      } else {
        // 시트에 데이터가 없으면 로컬 스토리지 확인
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          setNotes(JSON.parse(local));
        }
      }
    } catch (e) {
      console.warn("구글 시트 연동 실패, 로컬 데이터 사용:", e);
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        setNotes(JSON.parse(local));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 마운트 시 데이터 로드
  useEffect(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        setNotes(JSON.parse(local));
      } catch (err) {
        console.error(err);
      }
    }
    loadNotesFromGoogleSheet();
  }, []);

  // 로컬 스토리지 자동 백업
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  // 메모 추가 (생성 - Create)
  const handleAddNote = async (content: string, category: Category) => {
    setIsSaving(true);
    const newNote: Note = {
      id: String(Date.now()),
      content,
      category,
      color: getRandomColor(),
      rotation: getRandomRotation(),
      createdAt: formatDateTime(),
    };

    // UI 우선 낙관적 반영
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await createNoteInSheet(newNote);
      showToast("구글 시트에 성공적으로 저장되었습니다!");
    } catch (e) {
      console.error("구글 시트 저장 실패:", e);
      showToast("로컬에 저장되었으며, 구글 시트 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 메모 수정 (Update)
  const handleUpdateNote = async (id: string, newContent: string, newCategory: Category) => {
    const updated = notes.map((note) =>
      note.id === id ? { ...note, content: newContent, category: newCategory } : note
    );
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await updateNoteInSheet(id, newContent, newCategory);
      showToast("메모 수정 내용이 구글 시트에 반영되었습니다.");
    } catch (e) {
      console.error("구글 시트 수정 실패:", e);
    }
  };

  // 메모 삭제 (Delete)
  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter((note) => note.id !== id);
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await deleteNoteFromSheet(id);
      showToast("메모가 삭제되었습니다.");
    } catch (e) {
      console.error("구글 시트 삭제 실패:", e);
    }
  };

  // HTML5 데스크톱 드래그 앤 드롭
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setNotes((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // 구글 시트에 변경된 순서 반영
    const orderData = notes.map((n, i) => ({ id: n.id, order: i }));
    reorderNotesInSheet(orderData);
  };

  // 모바일 터치 이벤트 핸들링
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    setTouchStartIndex(index);
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartIndex === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = element?.closest("[data-note-index]") as HTMLElement | null;

    if (cardEl && cardEl.dataset.noteIndex) {
      const targetIndex = parseInt(cardEl.dataset.noteIndex, 10);
      if (!isNaN(targetIndex) && targetIndex !== touchStartIndex) {
        setNotes((prev) => {
          const updated = [...prev];
          const [movedItem] = updated.splice(touchStartIndex, 1);
          updated.splice(targetIndex, 0, movedItem);
          return updated;
        });
        setTouchStartIndex(targetIndex);
        setDraggedIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStartIndex(null);
    setDraggedIndex(null);
    const orderData = notes.map((n, i) => ({ id: n.id, order: i }));
    reorderNotesInSheet(orderData);
  };

  // 필터링 적용
  const filteredNotes = notes.filter((note) => {
    if (filter === "전체") return true;
    return note.category === filter;
  });

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-zinc-950 transition-colors duration-300 flex flex-col font-sans">
      {/* 상단 알림 토스트 */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-zinc-900/90 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs sm:text-sm animate-pop-in border border-zinc-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 헤더 바 */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border-b border-amber-200/50 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-300 dark:bg-amber-400 text-zinc-900 shadow-sm">
              <StickyNote className="w-5 h-5 fill-amber-400 dark:fill-amber-300 stroke-zinc-900" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                포스트잇 투두리스트
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {notes.length}개
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 동기화 새로고침 버튼 */}
            <button
              onClick={loadNotesFromGoogleSheet}
              disabled={isSyncing}
              title="구글 시트에서 다시 불러오기"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
            </button>

            {/* 카테고리 필터 드롭다운 */}
            <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
              <Filter className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="전체" className="dark:bg-zinc-800">
                  전체 보기
                </option>
                <option value="할 일" className="dark:bg-zinc-800">
                  할 일
                </option>
                <option value="아이디어" className="dark:bg-zinc-800">
                  아이디어
                </option>
                <option value="기타" className="dark:bg-zinc-800">
                  기타
                </option>
              </select>
            </div>

            {/* 다크모드 토글 스위치 */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* 중앙 상단 입력 UI (우측 상단 저장 버튼 포함) */}
        <section className="w-full">
          <NoteInput onAddNote={handleAddNote} isSaving={isSaving} />
        </section>

        {/* 안내 문구 & 필터 상태 */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-1">
          <span>
            {filter === "전체" ? "전체 메모" : `'${filter}' 메모`}{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              {filteredNotes.length}
            </strong>
            개
          </span>
          <span className="text-[11px] sm:text-xs">
            ✨ 구글 시트와 실시간 연동되어 안전하게 보관됩니다
          </span>
        </div>

        {/* 포스트잇 카드 그리드 */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/60 dark:bg-zinc-800 flex items-center justify-center text-amber-500 mb-3">
              <StickyNote className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              {isSyncing ? "구글 시트에서 메모를 불러오는 중..." : "메모가 없습니다"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              상단 입력창에서 내용을 작성하고 [저장] 버튼을 눌러보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-2">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                index={index}
                onDelete={handleDeleteNote}
                onUpdate={handleUpdateNote}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                isDragging={draggedIndex === index}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
