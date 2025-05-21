const session = require('express-session');
const sql = require('mssql');
require('dotenv').config();

const userPools = new Map(); // Use Map for better key-value management

// Config mặc định
const defaultConfig = {
    user: process.env.DB_USER_NAME,
    password: process.env.DB_PASS,
    server: process.env.HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Tạo pool mặc định
const defaultPool = new sql.ConnectionPool(defaultConfig);
const defaultPoolConnect = defaultPool.connect();

// Hàm tạo kết nối động với thông tin đăng nhập người dùng
const createUserConnection = async (username, password, sessionId) => {
    const userConfig = {
        ...defaultConfig,
        user: username,
        password: password,
        pool: {
            max: 5,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };
    console.log(sessionId)

    const userPool = new sql.ConnectionPool(userConfig);
    try {
        await userPool.connect();
        userPools.set(sessionId, userPool); // Store in Map
        return userPool;
    } catch (err) {
        console.error('Error creating user connection:', err);
        throw err;
    }
};

// Hàm lấy pool từ sessionId
const getUserPool = (sessionId) => {
    //console.log(userPools)
    return userPools.get(sessionId);
};

// Hàm đóng pool và xóa khỏi userPools
const closeUserPool = async (sessionId) => {
    const pool = userPools.get(sessionId);
    if (pool) {
        await pool.close();
        userPools.delete(sessionId);
    }
};

// New function to reset the pool after restore
const resetUserPool = async (sessionId) => {
    const pool = userPools.get(sessionId);
     const userPool = new sql.ConnectionPool(pool.config);
    try {
        await userPool.connect();
        userPools.set(sessionId, userPool);
    } catch (err) {
        console.error('Error recreating user pool:', err);
        throw err;
    }
};

const recreateUserPool = async (config) => {
    if (!config || !config.user || !config.password) {
        throw new Error('Invalid configuration for recreating user pool');
    }
    const userPool = new sql.ConnectionPool(config);
    try {
        await userPool.connect();
        return userPool;
    } catch (err) {
        console.error('Error recreating user pool:', err);
        throw err;
    }
};

// Hàm thực thi Stored Procedure với pool cụ thể
const executeStoredProcedure = async (pool, procedureName, params = []) => {
    try {
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error(`Error executing stored procedure ${procedureName}:`, err);
        throw err;
    }
};


// Hàm thực thi Stored Procedure với pool cụ thể
const executeStoredProcedureAndReturnCode = async (pool, procedureName, params = []) => {
    try {
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        const result = await request.execute(procedureName);
        let id;
        if (procedureName === 'sp_ThemTacGia') {
            id = result.recordset.length > 0 ? result.recordset[0].MATACGIA : null;
        } else if (procedureName === 'sp_ThemNhanVien') {
            id = result.recordset.length > 0 ? result.recordset[0].MANV : null;
        } else if (procedureName === 'sp_ThemDocGia') {
            id = result.recordset.length > 0 ? result.recordset[0].MADG : null;
        }
        return id;
    } catch (err) {
        console.error(`Error executing stored procedure ${procedureName}:`, err);
        throw err;
    }
};


// Hàm thực thi Stored Procedure với transaction
const executeStoredProcedureWithTransaction = async (pool, procedureName, params = []) => {
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = transaction.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        const result = await request.execute(procedureName);
        await transaction.commit();
        return result;
    } catch (err) {
        await transaction.rollback();
        console.error(`Error executing stored procedure ${procedureName}:`, err);
        throw err;
    }
};

// Hàm thực thi Stored Procedure với transaction và trả về mã
const executeStoredProcedureWithTransactionAndReturnCode = async (pool, procedureName, params = []) => {
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = transaction.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        const result = await request.execute(procedureName);
        let id;
        if (procedureName === 'sp_ThemTacGia') {
            id = result.recordset.length > 0 ? result.recordset[0].MATACGIA : null;
        } else if (procedureName === 'sp_ThemNhanVien') {
            id = result.recordset.length > 0 ? result.recordset[0].MANV : null;
        } else if (procedureName === 'sp_ThemDocGia') {
            id = result.recordset.length > 0 ? result.recordset[0].MADG : null;
        }
        await transaction.commit();
        return id;
    } catch (err) {
        await transaction.rollback();
        console.error(`Error executing stored procedure ${procedureName}:`, err);
        throw err;
    }
};


// Test connection cho pool mặc định
defaultPool.on('error', err => {
    console.error('Default SQL Server Connection Error:', err);
});

module.exports = {
    sql,
    defaultPool,
    defaultPoolConnect,
    getUserPool,
    createUserConnection,
    executeStoredProcedure,
    executeStoredProcedureAndReturnCode,
    executeStoredProcedureWithTransaction,
    executeStoredProcedureWithTransactionAndReturnCode, 
    recreateUserPool, 
    resetUserPool
};