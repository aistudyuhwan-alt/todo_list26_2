export type Category = "할 일" | "아이디어" | "기타";

export interface Note {
  id: string;
  content: string;
  category: Category;
  color: string;
  rotation: number;
  createdAt: string;
}

export const CATEGORIES: Category[] = ["할 일", "아이디어", "기타"];

export const POSTIT_COLORS = [
  "#FEF08A", // 노란색
  "#FBCFE8", // 분홍색
  "#BBF7D0", // 초록색
  "#BAE6FD", // 파랑색
];

export function getRandomColor(): string {
  const index = Math.floor(Math.random() * POSTIT_COLORS.length);
  return POSTIT_COLORS[index];
}

export function getRandomRotation(): number {
  // -2.0도 ~ 2.0도 사이 소수점 1자리
  const deg = (Math.random() * 4 - 2).toFixed(1);
  return parseFloat(deg);
}

export function formatDateTime(date: Date = new Date()): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dayName = days[date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}.${mm}.${dd} (${dayName}) ${hh}:${min}`;
}
