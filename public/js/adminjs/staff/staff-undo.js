// public/js/adminjs/staff/staff-undo.js
const undoStack = [];

// Hàm thêm thao tác vào stack
function pushToUndoStack(action, data) {
    undoStack.push({
        action: action, // 'create', 'delete', 'edit'
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

function updateAfterDeleteUndo(oldMaNV, newMaNV) {
    // Update maNV for any subsequent create or edit actions in the undo stack
    undoStack.forEach(item => {
        if (item.action === 'create') {
            // For create actions, data is an array
            if (Array.isArray(item.data)) {
                item.data.forEach(staff => {
                    if (staff.maNV == oldMaNV) {
                        staff.maNV = newMaNV;
                        console.log(staff);
                    }
                });
            }
        } else if (item.action === 'edit') {
            // For edit actions, data is a single object
            if (!Array.isArray(item.data) && item.data.maNV == oldMaNV) {
                item.data.maNV = newMaNV;
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