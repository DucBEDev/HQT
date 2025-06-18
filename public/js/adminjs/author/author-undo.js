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
    // Update maTacGia for any subsequent create or edit actions in the undo stack
    undoStack.forEach(item => {
        if (item.action === 'create') {
            // For create actions, data is an array
            if (Array.isArray(item.data)) {
                item.data.forEach(author => {
                    if (author.maTacGia == oldMaTacGia) {
                        author.maTacGia = newMaTacGia;
                        console.log(author);
                    }
                });
            }
        } else if (item.action === 'edit') {
            // For edit actions, data is a single object
            if (!Array.isArray(item.data) && item.data.maTacGia == oldMaTacGia) {
                item.data.maTacGia = newMaTacGia;
                console.log(item.data);
            }
        }
    });
    console.log('stack sau khi cap nhat', undoStack);
}


function clearUndoStack() {
    undoStack.length = 0;
    console.log('Undo stack đã được xóa.');
}

function isEmpty() {
    return undoStack.length == 0;
}

module.exports = { pushToUndoStack, popUndoStack, clearUndoStack, updateAfterDeleteUndo, isEmpty, undoStack };