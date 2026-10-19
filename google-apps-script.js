/**
 * 구글 스프레드시트 포스트잇 투두리스트 CRUD API (Google Apps Script)
 * 
 * 시트 컬럼 구조:
 * 1. timestamp : 고유 ID / 생성 타임스탬프 (숫자 또는 문자열)
 * 2. datetime  : 작성 일시 (예: 2026.10.19 (월) 14:30)
 * 3. category  : 카테고리 (할 일, 아이디어, 기타)
 * 4. content   : 메모 본문 내용
 * 5. color     : 포스트잇 색상 코드 (#FEF08A 등)
 * 6. state     : 상태 (active, completed, archived 등)
 * 7. order     : 정렬 순서 (숫자)
 */

const SHEET_NAME = "Sheet1"; // 시트 이름 (필요시 시트 탭 이름으로 변경)

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0]; // 기본 첫 번째 시트 사용
  }
  return sheet;
}

/**
 * 초기 헤더 설정 함수 (최초 1회 실행)
 */
function setupHeaders() {
  const sheet = getSheet();
  const headers = ["timestamp", "datetime", "category", "content", "color", "state", "order"];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F3F4F6");
  }
}

/**
 * GET 요청 처리: 전체 조회 (Read)
 * URL?action=read
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "read";
    
    if (action === "read") {
      const data = getAllNotes();
      return createJsonResponse({ success: true, data: data });
    }
    
    return createJsonResponse({ success: false, message: "Invalid action" });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * POST 요청 처리: 생성(Create), 수정(Update), 삭제(Delete), 순서 일괄 업데이트(Reorder)
 */
function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;

    switch (action) {
      case "create": {
        const result = createNote(payload.data);
        return createJsonResponse({ success: true, data: result });
      }
      case "update": {
        const result = updateNote(payload.timestamp, payload.data);
        return createJsonResponse({ success: true, data: result });
      }
      case "delete": {
        const result = deleteNote(payload.timestamp);
        return createJsonResponse({ success: true, data: result });
      }
      case "reorder": {
        // payload.orders: [{ timestamp: "...", order: 1 }, ...]
        const result = reorderNotes(payload.orders);
        return createJsonResponse({ success: true, data: result });
      }
      default:
        return createJsonResponse({ success: false, message: "Unsupported action: " + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * JSON 응답 생성 헬퍼 (CORS 헤더 포함)
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// CRUD 핵심 로직
// ==========================================

/**
 * [Read] 전체 메모 조회
 */
function getAllNotes() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; // 데이터가 없거나 헤더만 있는 경우

  const range = sheet.getRange(2, 1, lastRow - 1, 7);
  const values = range.getValues();

  const notes = values.map((row) => ({
    timestamp: String(row[0]),
    datetime: String(row[1]),
    category: String(row[2]),
    content: String(row[3]),
    color: String(row[4]),
    state: String(row[5] || "active"),
    order: Number(row[6]) || 0,
  }));

  // order 기준 오름차순 정렬
  return notes.sort((a, b) => a.order - b.order);
}

/**
 * [Create] 메모 추가
 */
function createNote(data) {
  const sheet = getSheet();
  const timestamp = String(data.timestamp || new Date().getTime());
  const datetime = String(data.datetime || new Date().toLocaleString());
  const category = String(data.category || "할 일");
  const content = String(data.content || "");
  const color = String(data.color || "#FEF08A");
  const state = String(data.state || "active");
  
  // order가 없으면 마지막 행 기준으로 번호 부여
  let order = data.order;
  if (order === undefined || order === null) {
    order = sheet.getLastRow(); // 헤더(1행) 제외시 기존 개수 + 1
  }

  const newRow = [timestamp, datetime, category, content, color, state, order];
  sheet.appendRow(newRow);

  return {
    timestamp,
    datetime,
    category,
    content,
    color,
    state,
    order,
  };
}

/**
 * [Update] 특정 메모 수정 (timestamp로 식별)
 */
function updateNote(targetTimestamp, updateData) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("No data found");

  const range = sheet.getRange(2, 1, lastRow - 1, 7);
  const values = range.getValues();
  let foundRowIndex = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(targetTimestamp)) {
      foundRowIndex = i + 2; // 시트 행 번호는 1부터 시작, 헤더 제외 +2
      
      if (updateData.datetime !== undefined) values[i][1] = String(updateData.datetime);
      if (updateData.category !== undefined) values[i][2] = String(updateData.category);
      if (updateData.content !== undefined) values[i][3] = String(updateData.content);
      if (updateData.color !== undefined) values[i][4] = String(updateData.color);
      if (updateData.state !== undefined) values[i][5] = String(updateData.state);
      if (updateData.order !== undefined) values[i][6] = Number(updateData.order);
      break;
    }
  }

  if (foundRowIndex === -1) {
    throw new Error("Note not found with timestamp: " + targetTimestamp);
  }

  // 수정된 행 반영
  sheet.getRange(foundRowIndex, 1, 1, 7).setValues([[
    values[foundRowIndex - 2][0],
    values[foundRowIndex - 2][1],
    values[foundRowIndex - 2][2],
    values[foundRowIndex - 2][3],
    values[foundRowIndex - 2][4],
    values[foundRowIndex - 2][5],
    values[foundRowIndex - 2][6],
  ]]);

  return {
    timestamp: String(values[foundRowIndex - 2][0]),
    datetime: values[foundRowIndex - 2][1],
    category: values[foundRowIndex - 2][2],
    content: values[foundRowIndex - 2][3],
    color: values[foundRowIndex - 2][4],
    state: values[foundRowIndex - 2][5],
    order: values[foundRowIndex - 2][6],
  };
}

/**
 * [Delete] 특정 메모 삭제 (timestamp로 식별)
 */
function deleteNote(targetTimestamp) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("No data found");

  const timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < timestamps.length; i++) {
    if (String(timestamps[i][0]) === String(targetTimestamp)) {
      sheet.deleteRow(i + 2);
      return { deleted: true, timestamp: targetTimestamp };
    }
  }

  throw new Error("Note not found with timestamp: " + targetTimestamp);
}

/**
 * [Reorder] 드래그 앤 드롭 순서 변경 반영
 */
function reorderNotes(orders) {
  // orders: Array<{ timestamp: string, order: number }>
  if (!orders || !Array.isArray(orders)) return { updated: 0 };

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { updated: 0 };

  const range = sheet.getRange(2, 1, lastRow - 1, 7);
  const values = range.getValues();

  const orderMap = {};
  orders.forEach((item) => {
    orderMap[String(item.timestamp)] = Number(item.order);
  });

  let updatedCount = 0;
  for (let i = 0; i < values.length; i++) {
    const ts = String(values[i][0]);
    if (orderMap[ts] !== undefined) {
      values[i][6] = orderMap[ts];
      updatedCount++;
    }
  }

  range.setValues(values);
  return { updated: updatedCount };
}
