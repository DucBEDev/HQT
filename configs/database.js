const sql = require('mssql');

const config = {
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

// Tạo pool connection
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Hàm helper để gọi Stored Procedure
const executeStoredProcedure = async (procedureName, params = []) => {
    try {
        await poolConnect; // Đảm bảo pool đã kết nối
        const request = pool.request();
        
        // Thêm các parameters vào request
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

// Hàm helper để gọi Stored Procedure với transaction
const executeStoredProcedureWithTransaction = async (procedureName, params = []) => {
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        await poolConnect;
        const request = transaction.request();
        
        params.forEach(param => {
            // console.log(`Adding param: ${param.name} = ${param.value} (type: ${param.type})`);
            request.input(param.name, param.type, param.value);
        });

        const result = await request.execute(procedureName);
        // console.log('Stored procedure executed successfully:', result);
        await transaction.commit();
        return result;
    } catch (err) {
        // console.error(`Error executing stored procedure ${procedureName} with transaction:`, err);
        // console.error('Params:', params);
        await transaction.rollback();
        throw err;
    }
};

// Test connection
pool.on('error', err => {
    console.error('SQL Server Connection Error:', err);
});

// Export các functions
module.exports = {
    sql,
    pool,
    executeStoredProcedure,
    executeStoredProcedureWithTransaction
};