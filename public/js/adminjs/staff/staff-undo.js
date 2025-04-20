// public/js/adminjs/staff/staff-undo.js
const undoStack = [];

// Hàm thêm thao tác vào stack
function pushToUndoStack(action, data) {
    undoStack.push({
        action: action, // 'create', 'delete', 'edit'
        data: data      // Dữ liệu liên quan đến thao tác
    });
    console.log(`Đã thêm thao tác vào stack:`, undoStack[undoStack.length - 1]);
}

// Hàm lấy thao tác cuối cùng từ stack
function popUndoStack() {
    if (undoStack.length === 0) {
        return null;
    }
    return undoStack.pop();
}

module.exports = { pushToUndoStack, popUndoStack, undoStack };