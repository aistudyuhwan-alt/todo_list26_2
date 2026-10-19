import { Note, Category } from "@/types/note";

const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Google Apps Script Web App에서 전체 메모 조회 (Read)
 */
export async function fetchNotesFromSheet(): Promise<Note[]> {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("NEXT_PUBLIC_GOOGLE_SCRIPT_URL is not defined in .env.local");
    return [];
  }

  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=read`, {
      method: "GET",
      mode: "cors",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();
    if (result && result.success && Array.isArray(result.data)) {
      return result.data.map((item: any, index: number) => ({
        id: String(item.timestamp || `sheet-${index}`),
        content: String(item.content || ""),
        category: (item.category as Category) || "할 일",
        color: item.color || "#FEF08A",
        rotation: (Math.random() * 4 - 2), // 화면에 자연스러운 각도 부여
        createdAt: String(item.datetime || ""),
        state: item.state || "active",
        order: item.order !== undefined ? Number(item.order) : index,
      }));
    }
    return [];
  } catch (error) {
    console.error("fetchNotesFromSheet failed:", error);
    throw error;
  }
}

/**
 * 새 메모 구글 시트에 저장 (Create)
 */
export async function createNoteInSheet(note: Note): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) return;

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Google Apps Script CORS 리다이렉트 대응
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "create",
        data: {
          timestamp: note.id,
          datetime: note.createdAt,
          category: note.category,
          content: note.content,
          color: note.color,
          state: "active",
          order: 0,
        },
      }),
    });
  } catch (error) {
    console.error("createNoteInSheet failed:", error);
    throw error;
  }
}

/**
 * 기존 메모 수정 (Update)
 */
export async function updateNoteInSheet(
  id: string,
  newContent: string,
  newCategory: Category
): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) return;

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "update",
        timestamp: id,
        data: {
          content: newContent,
          category: newCategory,
        },
      }),
    });
  } catch (error) {
    console.error("updateNoteInSheet failed:", error);
    throw error;
  }
}

/**
 * 메모 삭제 (Delete)
 */
export async function deleteNoteFromSheet(id: string): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) return;

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "delete",
        timestamp: id,
      }),
    });
  } catch (error) {
    console.error("deleteNoteFromSheet failed:", error);
    throw error;
  }
}

/**
 * 순서 변경 일괄 반영 (Reorder)
 */
export async function reorderNotesInSheet(
  notes: { id: string; order: number }[]
): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) return;

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "reorder",
        orders: notes.map((n) => ({
          timestamp: n.id,
          order: n.order,
        })),
      }),
    });
  } catch (error) {
    console.error("reorderNotesInSheet failed:", error);
  }
}
