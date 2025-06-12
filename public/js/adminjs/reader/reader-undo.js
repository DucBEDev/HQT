// public/js/adminjs/reader/reader-undo.js
const undoStack = [];

// Hàm thêm thao tác vào stack
function pushToUndoStack(action, data) {
    undoStack.push({
        action: action, // 'create', 'delete', 'edit', 'changeStatus'
        data: data      // Dữ liệu liên quan đến thao tác
    });
    console.log(`Đã thêm thao tác vào stack:`, undoStack[undoStack.length - 1]);
    console.log(undoStack);
}

// Hàm lấy thao tác cuối cùng từ stack
function popUndoStack() {
    if (undoStack.length === 0) {
        return null;
    }
    console.log(undoStack);

    return undoStack.pop();
}


function updateAfterDeleteUndo(oldMaDG, newMaDG) {
    // Update maDG for any subsequent create actions in the undo stack
            undoStack.forEach(item => {
                if (item.action === 'create') {
                    item.data.forEach(reader => {
                        if (reader.maDG == oldMaDG) {
                            reader.maDG = newMaDG; // Increment maDG to avoid conflict
                        }
                    });
                }
            });
    console.log(undoStack)
}

function clearUndoStack() {
    undoStack.length = 0;
    console.log('Undo stack đã được xóa.');
}

module.exports = { pushToUndoStack, popUndoStack, clearUndoStack, updateAfterDeleteUndo, undoStack };