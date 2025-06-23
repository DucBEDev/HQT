const { sql, executeStoredProcedure, resetUserPool, getUserPool, defaultPool } = require('../../configs/database');
const systemConfig = require('../../configs/system');

// [GET] /backup_restore
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        const request = defaultPool.request();
        const result = await request.query(`SELECT 
                                            bs.database_name,
                                            bs.position,
                                            bs.backup_start_date,
                                            bs.backup_finish_date,
                                            bs.backup_size / 1024.0 / 1024.0 AS BackupSizeMB,
                                            CASE bs.type 
                                                WHEN 'D' THEN 'Full'
                                                WHEN 'I' THEN 'Differential'
                                                WHEN 'L' THEN 'Log'
                                                ELSE 'Other'
                                            END AS BackupType,
                                            bmf.physical_device_name,
                                            bs.user_name AS BackupUser,
                                            ISNULL(bs.description, 'No description') AS BackupDescription
                                        FROM 
                                            msdb.dbo.backupset bs
                                            INNER JOIN msdb.dbo.backupmediafamily bmf 
                                                ON bs.media_set_id = bmf.media_set_id
                                        WHERE 
                                            bmf.physical_device_name = (SELECT physical_name FROM sys.backup_devices WHERE name = 'DEVICE_QLTV')
                                        ORDER BY 
                                            bs.backup_start_date DESC;`);

        // Extract recordset and ensure BackupSizeMB is a number
        const backupList = result.recordset.map(row => ({
            database_name: row.database_name,
            position: row.position,
            backup_start_date: row.backup_start_date,
            backup_finish_date: row.backup_finish_date,
            BackupSizeMB: row.BackupSizeMB != null ? Number(row.BackupSizeMB) : 0, // Handle NULL or undefined
            BackupType: row.BackupType,
            physical_device_name: row.physical_device_name,
            BackupUser: row.BackupUser,
            BackupDescription: row.BackupDescription
        }));

        //console.log(backupList); // Debug to verify data

        res.render('admin/pages/backup_restore/index', {
            backupList: backupList,
            pageTitle: 'Quản lý bản backup', // Updated title for consistency
        });
    } catch (error) {
        console.error('Error fetching backup list:', error);
        res.status(500).render('admin/pages/backup_restore/index', {
            backupList: [],
            pageTitle: 'Quản lý bản backup',
            error: 'Lỗi khi tải danh sách bản backup'
        });
    }
};


// [POST] /backup_restore/backup
module.exports.backup = async (req, res) => {
    console.log('Backup request received');
    console.log(req.body)
    const pool = getUserPool(req.session.id);
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try
    {
        const params = [
        { name: 'Replace', type: sql.Bit, value: parseInt(req.body.replace) },
       
        ];
        console.log('Executing stored procedure with params:', params)
        // Execute the stored procedure
        const result = await executeStoredProcedure(pool, 'sp_BackupFullQLTVMoi', params);

        // Kiểm tra result.recordset
        if (result && result.recordset && result.recordset.length > 0 && result.recordset[0].Message) {
            req.flash('success', 'Backup thành công');
        } else {
            req.flash('error', 'Backup không thành công: Không nhận được phản hồi hợp lệ từ server');
        }
        res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);


    }
    catch (error)
    {
        console.error('Error during backup:', error);
        req.flash('error', 'Lỗi trong khi backup');
        res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
    }
    
};


// [POST] /backup_restore/restore
module.exports.restore = async (req, res) => {
    console.log('Restore request received');
    const pool = getUserPool(req.session.id);
    console.log(req.body)
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try
    {
        const params = [
        { name: 'BackupPosition', type: sql.Int, value: req.body.backupId },
       
        ];
        console.log('Executing stored procedure with params:', params)


        // Execute the stored procedure
        const result = await executeStoredProcedure(pool, 'sp_RestoreQLTV', params);
        console.log(pool)
        await resetUserPool(req.session.id); // Reset the user pool after restore


        // Check the result and send appropriate response
        if (result && result.recordset && result.recordset.length > 0) {
            req.flash('success', 'Restore thành công');
            res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
        } else {
            req.flash('error', 'Restore không thành công');
            res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
        }
    }
    catch (error)
    {
        console.error('Error during backup:', error);
        req.flash('error', 'Lỗi trong khi restore');
        res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
    }
    
};


// [POST] /backup_restore/restore-point-in-time
module.exports.restoreToPointInTime = async (req, res) => {
    console.log('Restore request received');
    const pool = getUserPool(req.session.id);
    console.log(req.body)
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try
    {
        console.log('Received restore time:', req.body.formattedDatetimeRestore);


        const params = [
        { name: 'RestoreTime', type: sql.NVarChar, value: req.body.formattedDatetimeRestore },
       
        ];
        console.log('Executing stored procedure with params:', params)


        // // Execute the stored procedure
        const result = await executeStoredProcedure(pool, 'sp_RestoreQLTVToPointInTime', params);
        console.log(pool)
        await resetUserPool(req.session.id); // Reset the user pool after restore


        // Check the result and send appropriate response
        if (result && result.recordset && result.recordset.length > 0) {
            req.flash('success', 'Restore thành công');
            res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
        } else {
            req.flash('error', 'Restore không thành công');
            res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
        }
    }
    catch (error)
    {
        console.error('Error during backup:', error);
        req.flash('error', 'Lỗi trong khi restore');
        res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
    }
    
};






module.exports.restoreQLTV = async (req, res) => {
    console.log('Restore request received');
    const pool = getUserPool(req.session.id);
    console.log(req.body)
    if (!pool) {
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        // Get backup position from request (e.g., body or query parameter)
        const backupPosition = parseInt(req.body.backupId);
        if (isNaN(backupPosition) || backupPosition < 1) {
            return res.status(400).json({ success: false, error: 'Vị trí bản backup không hợp lệ.' });
        }       

        // Step 1: Validate backup position
        const validateQuery = `
            SELECT 1
            FROM msdb.dbo.backupset bs
            INNER JOIN msdb.dbo.backupmediafamily bmf 
                ON bs.media_set_id = bmf.media_set_id
            WHERE bs.database_name = 'QLTV'
                AND bs.type = 'D' -- Full backup only
                AND bs.position = @backupPosition
        `;
        const validateRequest = pool.request();
        validateRequest.input('backupPosition', sql.Int, backupPosition);
        const validateResult = await validateRequest.query(validateQuery);

        if (validateResult.recordset.length === 0) {
            throw new Error('Vị trí bản backup không hợp lệ hoặc không tồn tại cho cơ sở dữ liệu QLTV.');
        }

        // Step 2: Set QLTV database to SINGLE_USER mode
        const singleUserQuery = `
            USE master;
            ALTER DATABASE [QLTV] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        `;
        await pool.request().query(singleUserQuery);

        // Step 3: Restore database from DEVICE_QLTV
        const restoreQuery = `
            USE master;
            RESTORE DATABASE [QLTV] 
            FROM DEVICE_QLTV 
            WITH FILE = @backupPosition, REPLACE, RECOVERY;
        `;
        const restoreRequest = pool.request();
        restoreRequest.input('backupPosition', sql.Int, backupPosition);
        await restoreRequest.query(restoreQuery);

        // Step 4: Set QLTV database back to MULTI_USER mode
        const multiUserQuery = `
            USE master;
            ALTER DATABASE [QLTV] SET MULTI_USER;
        `;
        await pool.request().query(multiUserQuery);

        await executeStoredProcedure(pool, 'QLTV.dbo.sp_TaoLoginChoTatCaUserChuaCoLogin', []);
        await executeStoredProcedure(pool, 'sp_XoaLoginMoCoi', []);

        console.log(pool)
        const result =await resetUserPool(req.session.id); // Reset the user pool after restore
        if(result ==false)
        {
            console.error('Error resetting user pool after restore');
            req.flash('error', 'Lỗi khi khôi phục người dùng: Không thể thiết lập lại kết nối.');
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        // Check the result and send appropriate response
            req.flash('success', 'Restore thành công');
            return res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);


    } catch (err) {
        // Error handling: Revert to MULTI_USER mode if database is stuck in SINGLE_USER
        try {
            if (pool) {
                const checkModeQuery = `
                    SELECT 1 
                    FROM sys.databases 
                    WHERE name = 'QLTV' AND user_access_desc = 'SINGLE_USER';
                `;
                const checkResult = await pool.request().query(checkModeQuery);

                if (checkResult.recordset.length > 0) {
                    const revertQuery = `
                        USE master;
                        ALTER DATABASE [QLTV] SET MULTI_USER;
                    `;
                    await pool.request().query(revertQuery);
                }
            }
        } catch (revertErr) {
            console.error('Error reverting to MULTI_USER:', revertErr);
        }
        console.log(pool)
        const result =await resetUserPool(req.session.id); // Reset the user pool after restore
        if(result ==false)
        {
            console.error('Error resetting user pool after restore');
            req.flash('error', 'Lỗi khi khôi phục người dùng: Không thể thiết lập lại kết nối.');
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }      
        // Return error response
        console.error('Error restoring QLTV:', err);
        req.flash('error', 'Restore thất bại: ' + err.message);
         return res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
    } 
};



module.exports.restoreQLTVToPointInTime = async (req, res) => {
    console.log('Restore request received');
    const pool = getUserPool(req.session.id);
    console.log(req.body)
    if (!pool) {
        req.flash('error', 'Chưa đăng nhập hoặc phiên hết hạn.');
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        await pool.connect(); // Có thể ném lỗi nếu thông tin login sai
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    try {
        // Get restore time from request (e.g., body)
        const restoreTime = req.body.formattedDatetimeRestore;
        console.log('Received restore time:', restoreTime);

        if (!restoreTime) {
            return res.status(400).json({ success: false, error: 'Thời điểm khôi phục không hợp lệ.' });
        }

        // Step 1: Find the latest full backup before restoreTime
        const findBackupQuery = `
            SELECT TOP 1 Position
            FROM msdb.dbo.backupset
            WHERE database_name = 'QLTV'
                AND type = 'D'
                AND backup_finish_date <= @restoreTime
            ORDER BY backup_finish_date DESC;
        `;
        const findBackupRequest = pool.request();
        findBackupRequest.input('restoreTime', sql.NVarChar, restoreTime);
        const findBackupResult = await findBackupRequest.query(findBackupQuery);

        if (!findBackupResult.recordset.length) {
            throw new Error('Không tìm thấy bản sao lưu đầy đủ trước thời điểm khôi phục.');
        }
        const latestFullBackupPosition = findBackupResult.recordset[0].Position;

        // Step 2: Backup transaction log
        console.log('Backing up transaction log...');
        const backupLogQuery = `
            BACKUP LOG QLTV
            TO DEVICE_QLTV_LOG
            WITH INIT, NO_TRUNCATE;
        `;
        await pool.request().query(backupLogQuery);
        console.log('Transaction log backed up successfully.');       

        // Step 4: Set database to SINGLE_USER
        console.log('Setting database SINGLE_USER...');
        const singleUserQuery = `
            USE master;
            ALTER DATABASE QLTV SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        `;
        await pool.request().query(singleUserQuery);

        // Step 5: Restore full backup with NORECOVERY
        console.log('Restoring full backup...');
        const restoreFullQuery = `
            USE master;
            RESTORE DATABASE QLTV
            FROM DEVICE_QLTV
            WITH 
                FILE = @backupPosition,
                NORECOVERY,
                REPLACE;
        `;
        const restoreFullRequest = pool.request();
        restoreFullRequest.input('backupPosition', sql.Int, latestFullBackupPosition);
        await restoreFullRequest.query(restoreFullQuery);

        // Step 6: Restore transaction log to restoreTime with RECOVERY
        console.log('Restoring transaction log to point in time...');
        const restoreLogQuery = `
            USE master;
            RESTORE LOG QLTV
            FROM DEVICE_QLTV_LOG
            WITH 
                STOPAT = @restoreTime,
                RECOVERY;
        `;
        const restoreLogRequest = pool.request();
        restoreLogRequest.input('restoreTime', sql.NVarChar, restoreTime);
        await restoreLogRequest.query(restoreLogQuery);

        // Step 7: Set database to MULTI_USER and ONLINE
        console.log('Setting database MULTI_USER and ONLINE...');
        const multiUserQuery = `
            USE master;
            ALTER DATABASE QLTV SET MULTI_USER;
            ALTER DATABASE QLTV SET ONLINE;
        `;
        await pool.request().query(multiUserQuery);

        const params = [
        { name: 'Replace', type: sql.Bit, value: 1 },
       
        ];
        console.log('Executing stored procedure with params:', params)

        await executeStoredProcedure(pool, 'QLTV.dbo.sp_TaoLoginChoTatCaUserChuaCoLogin', []);
        await executeStoredProcedure(pool, 'sp_XoaLoginMoCoi', []);
        // Execute the stored procedure
        await executeStoredProcedure(pool, 'QLTV.dbo.sp_BackupFullQLTVMoi', params);

        console.log('Pool after restore:', pool);
        const result =await resetUserPool(req.session.id); // Reset the user pool after restore
        if(result ==false)
        {
            console.error('Error resetting user pool after restore');
            req.flash('error', 'Lỗi khi khôi phục người dùng: Không thể thiết lập lại kết nối.');
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        // Success response
        req.flash('success', 'Khôi phục đến thời điểm thành công!');
        return res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);

    } catch (err) {
        // Error handling: Restore stable state
        try {
            if (pool) {
                // Check if database is in RESTORING state
                const checkRestoringQuery = `
                    SELECT 1 
                    FROM sys.databases 
                    WHERE name = 'QLTV' AND state_desc = 'RESTORING';
                `;
                const checkRestoringResult = await pool.request().query(checkRestoringQuery);
                if (checkRestoringResult.recordset.length > 0) {
                    console.log('Completing RESTORING state...');
                    const recoverQuery = `
                        USE master;
                        RESTORE DATABASE QLTV WITH RECOVERY;
                    `;
                    await pool.request().query(recoverQuery);
                }

                // Check if database is OFFLINE
                const checkOfflineQuery = `
                    SELECT 1 
                    FROM sys.databases 
                    WHERE name = 'QLTV' AND state_desc = 'OFFLINE';
                `;
                const checkOfflineResult = await pool.request().query(checkOfflineQuery);
                if (checkOfflineResult.recordset.length > 0) {
                    console.log('Setting database ONLINE...');
                    const onlineQuery = `
                        USE master;
                        ALTER DATABASE QLTV SET ONLINE;
                    `;
                    await pool.request().query(onlineQuery);
                }

                // Check if database is in SINGLE_USER mode
                const checkSingleUserQuery = `
                    SELECT 1 
                    FROM sys.databases 
                    WHERE name = 'QLTV' AND user_access_desc = 'SINGLE_USER';
                `;
                const checkSingleUserResult = await pool.request().query(checkSingleUserQuery);
                if (checkSingleUserResult.recordset.length > 0) {
                    console.log('Setting database MULTI_USER...');
                    const multiUserQuery = `
                        USE master;
                        ALTER DATABASE QLTV SET MULTI_USER;
                    `;
                    await pool.request().query(multiUserQuery);
                }
            }
        } catch (revertErr) {
            console.error('Error reverting database state:', revertErr);
        }

        console.log('Pool after error:', pool);
        const result =await resetUserPool(req.session.id); // Reset the user pool after restore
        if(result ==false)
        {
            console.error('Error resetting user pool after restore');
            req.flash('error', 'Lỗi khi khôi phục người dùng: Không thể thiết lập lại kết nối.');
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        // Error response
        console.error('Error restoring QLTV to point in time:', err);
        req.flash('error', 'Khôi phục đến thời điểm thất bại: ' + err.message);
        return res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
    }
};










