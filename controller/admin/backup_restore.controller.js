const { sql, executeStoredProcedure, resetUserPool, getUserPool, defaultPool } = require('../../configs/database');
const systemConfig = require('../../configs/system');

// [GET] /backup_restore
module.exports.index = async (req, res) => {
    const pool = getUserPool(req.session.id);
    if (!pool) {
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
        // const result = await executeStoredProcedure(pool, 'sp_BackupFullQLTV', params);

        // // Kiểm tra result.recordset
        // if (result && result.recordset && result.recordset.length > 0 && result.recordset[0].Message) {
        //     req.flash('success', result.recordset[0].Message);
        // } else {
        //     req.flash('error', 'Backup không thành công: Không nhận được phản hồi hợp lệ từ server');
        // }
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
        // const result = await executeStoredProcedure(pool, 'sp_RestoreQLTV', params);
        // console.log(pool)
        // await resetUserPool(req.session.id); // Reset the user pool after restore


        // // Check the result and send appropriate response
        // if (result && result.recordset && result.recordset.length > 0) {
        //     req.flash('success', 'Restore thành công');
        //     res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
        // } else {
        //     req.flash('error', 'Restore không thành công');
        //     res.redirect(`${systemConfig.prefixAdmin}/backup_restore`);
        // }
    }
    catch (error)
    {
        console.error('Error during backup:', error);
        req.flash('error', 'Lỗi trong khi restore');
        res.redirect(`${systemConfig.prefixAdmin}/backup_restore`);
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
        console.log(req.body)

        // const params = [
        // { name: 'BackupPosition', type: sql.Int, value: req.body.backupId },
       
        // ];
        // console.log('Executing stored procedure with params:', params)


        // // Execute the stored procedure
        // const result = await executeStoredProcedure(pool, 'sp_RestoreQLTV', params);
        // console.log(pool)
        // await resetUserPool(req.session.id); // Reset the user pool after restore


        // // Check the result and send appropriate response
        // if (result && result.recordset && result.recordset.length > 0) {
        //     req.flash('success', 'Restore thành công');
        //     res.redirect(`${systemConfig.prefixAdmin}/backup-restore`);
        // } else {
        //     req.flash('error', 'Restore không thành công');
        //     res.redirect(`${systemConfig.prefixAdmin}/backup_restore`);
        // }
    }
    catch (error)
    {
        console.error('Error during backup:', error);
        req.flash('error', 'Lỗi trong khi restore');
        res.redirect(`${systemConfig.prefixAdmin}/backup_restore`);
    }
    
};






