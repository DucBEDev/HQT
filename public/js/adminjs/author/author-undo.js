// public/js/adminjs/author/author-undo.js
const undoStack = [];

// Hàm thêm thao tác vào stack
function pushToUndoStack(action, data) {
    undoStack.push({
        action: action, // 'create', 'delete', 'edit'
        data: data      // Dữ liệu liên quan đến thao tác
    });
    console.log(`Đã thêm thao tác vào stack:`, undoStack[undoStack.length - 1]);
    console.log('stack sau khi them',undoStack);
}

// Hàm lấy thao tác cuối cùng từ stack
function popUndoStack() {
    if (undoStack.length === 0) {
        return null;
    }
    console.log('stack truoc khi pop',undoStack);
    return undoStack.pop();
}


function updateAfterDeleteUndo(oldMaTacGia, newMaTacGia) {
    // Update maTacGia for any subsequent create actions in the undo stack
            undoStack.forEach(item => {
                if (item.action === 'create') {
                    item.data.forEach(author => {
                        if (author.maTacGia == oldMaTacGia) {
                            author.maTacGia = newMaTacGia; // Increment maTacGia to avoid conflict
                            console.log(author)
                        }
                    });
                }
            });
    console.log('stack sau khi cap nhat',undoStack)
}


function clearUndoStack() {
    undoStack.length = 0;
    console.log('Undo stack đã được xóa.');
}

module.exports = { pushToUndoStack, popUndoStack, clearUndoStack, updateAfterDeleteUndo, undoStack };