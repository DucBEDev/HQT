const undoStack = [];

// Hàm thêm thao tác vào stack
function pushToUndoStack(action, data) {
    undoStack.push({
        action: action, // 'create_sach', 'delete_sach', 'edit_sach', 'create_dausach', 'delete_dausach', 'edit_dausach'
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

// Hàm xóa stack
function clearUndoStack() {
    undoStack.length = 0;
    console.log('Undo stack đã được xóa.');
}

module.exports = { pushToUndoStack, popUndoStack, clearUndoStack, undoStack };