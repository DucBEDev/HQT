const { executeStoredProcedure, executeStoredProcedureWithTransaction } = require('../configs/database');

class ExampleController {
    // Ví dụ 1: Gọi Stored Procedure đơn giản
    async getData(req, res) {
        try {
            const result = await executeStoredProcedure('sp_GetData');
            res.json(result.recordset);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Ví dụ 2: Gọi Stored Procedure với parameters
    async getDataById(req, res) {
        try {
            const params = [
                { name: 'id', type: sql.Int, value: req.params.id }
            ];
            const result = await executeStoredProcedure('sp_GetDataById', params);
            res.json(result.recordset[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Ví dụ 3: Gọi Stored Procedure với transaction
    async createData(req, res) {
        try {
            const params = [
                { name: 'name', type: sql.NVarChar, value: req.body.name },
                { name: 'description', type: sql.NVarChar, value: req.body.description }
            ];
            const result = await executeStoredProcedureWithTransaction('sp_CreateData', params);
            res.json({ message: 'Data created successfully', data: result.recordset[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Ví dụ 4: Gọi nhiều Stored Procedures trong một transaction
    async complexOperation(req, res) {
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            
            // Thực hiện các operations
            const result1 = await executeStoredProcedure('sp_Operation1', [
                { name: 'param1', type: sql.Int, value: req.body.param1 }
            ]);
            
            const result2 = await executeStoredProcedure('sp_Operation2', [
                { name: 'param2', type: sql.NVarChar, value: req.body.param2 }
            ]);

            await transaction.commit();
            res.json({
                message: 'Complex operation completed successfully',
                data: {
                    result1: result1.recordset,
                    result2: result2.recordset
                }
            });
        } catch (error) {
            await transaction.rollback();
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ExampleController(); 