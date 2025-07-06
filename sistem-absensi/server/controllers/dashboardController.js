// server/controllers/dashboardController.js
const pool = require('../config/db');
const { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');
const { id } = require('date-fns/locale');

// Fungsi helper untuk format tanggal
const getDisplayPeriod = (filter, date) => {
    const d = new Date(date);
    if (filter === 'hari') {
        return format(d, 'eeee, dd MMMM yyyy', { locale: id });
    }
    if (filter === 'minggu') {
        const awal = format(startOfWeek(d, { weekStartsOn: 1 }), 'dd MMMM');
        const akhir = format(endOfWeek(d, { weekStartsOn: 1 }), 'dd MMMM yyyy');
        return `Minggu, ${awal} - ${akhir}`;
    }
    if (filter === 'bulan') {
        return format(d, 'MMMM yyyy', { locale: id });
    }
    return '';
};


// Ganti seluruh fungsi getSupervisorSummary
exports.getSupervisorSummary = async (req, res) => {
    try {
        const { filter = 'hari', date = new Date() } = req.query;
        const targetDate = new Date(date);

        let whereClause = '';
        let dateRange = '';

        switch (filter) {
            case 'minggu':
                whereClause = 'WHERE YEARWEEK(ck.waktu_clock_in, 1) = YEARWEEK(?, 1)';
                dateRange = 'AND YEARWEEK(waktu_clock_in, 1) = YEARWEEK(?, 1)';
                break;
            case 'bulan':
                whereClause = 'WHERE MONTH(ck.waktu_clock_in) = MONTH(?) AND YEAR(ck.waktu_clock_in) = YEAR(?)';
                dateRange = 'AND MONTH(waktu_clock_in) = MONTH(?) AND YEAR(waktu_clock_in) = YEAR(?)';
                break;
            case 'hari':
            default:
                whereClause = 'WHERE DATE(ck.waktu_clock_in) = DATE(?)';
                dateRange = 'AND DATE(waktu_clock_in) = DATE(?)';
                break;
        }

        const queryParams = filter === 'bulan' ? [targetDate, targetDate] : [targetDate];

        const activeWorkersQuery = `
            SELECT COUNT(p.id_pekerja) as total_pekerja
            FROM pekerja p JOIN pengguna u ON p.id_pengguna = u.id_pengguna
            WHERE u.status_pengguna = 'Aktif'`;
        const [totalPekerjaResult] = await pool.query(activeWorkersQuery);
        const total_pekerja = totalPekerjaResult[0].total_pekerja;

        const summaryQuery = `
            SELECT
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Hadir' THEN ck.id_pekerja END) AS hadir,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Telat' THEN ck.id_pekerja END) AS terlambat,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Izin' THEN ck.id_pekerja END) AS izin,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Lembur' THEN ck.id_pekerja END) AS lembur,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Pulang Cepat' THEN ck.id_pekerja END) AS pulang_cepat
            FROM catatan_kehadiran ck ${whereClause}`;
        const [summaryResult] = await pool.query(summaryQuery, queryParams);
        const summary = summaryResult[0];

        const attendedWorkersQuery = `SELECT COUNT(DISTINCT id_pekerja) as total_hadir FROM catatan_kehadiran WHERE 1=1 ${dateRange}`;
        const [attendedResult] = await pool.query(attendedWorkersQuery, queryParams);
        const totalHadirUnik = attendedResult[0].total_hadir;

        summary.total_pekerja = total_pekerja;
        summary.absen = total_pekerja - totalHadirUnik;

        let trendData = {};
        if (filter === 'minggu') {
            const weeklyTrendQuery = `
                SELECT DAYNAME(waktu_clock_in) as label, COUNT(DISTINCT id_pekerja) as value
                FROM catatan_kehadiran WHERE YEARWEEK(waktu_clock_in, 1) = YEARWEEK(?, 1)
                GROUP BY DAYOFWEEK(waktu_clock_in), label ORDER BY DAYOFWEEK(waktu_clock_in);`;
            const [rows] = await pool.query(weeklyTrendQuery, queryParams);
            trendData = { type: 'bar', title: 'Tren Kehadiran Mingguan', labels: rows.map(r => r.label), data: rows.map(r => r.value) };
        } else if (filter === 'bulan') {
            const monthlyTrendQuery = `
                SELECT DATE_FORMAT(waktu_clock_in, '%d %b') as label, COUNT(DISTINCT id_pekerja) as value
                FROM catatan_kehadiran WHERE MONTH(waktu_clock_in) = MONTH(?) AND YEAR(waktu_clock_in) = YEAR(?)
                GROUP BY DATE(waktu_clock_in), label ORDER BY DATE(waktu_clock_in);`;
            const [rows] = await pool.query(monthlyTrendQuery, queryParams);
            trendData = { type: 'line', title: 'Tren Kehadiran Bulanan', labels: rows.map(r => r.label), data: rows.map(r => r.value) };
        } else {
            trendData = {
                type: 'pie', title: 'Ringkasan Kehadiran Hari Ini',
                labels: ['Hadir', 'Telat', 'Izin', 'Lembur', 'Pulang Cepat', 'Absen'],
                data: [ summary.hadir || 0, summary.terlambat || 0, summary.izin || 0, summary.lembur || 0, summary.pulang_cepat || 0, summary.absen ],
            };
        }

        res.json({
            summary,
            trendData,
            displayPeriod: getDisplayPeriod(filter, targetDate)
        });

    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).send('Server Error');
    }
};

// Ganti seluruh fungsi getRecentActivities
exports.getRecentActivities = async (req, res) => {
    try {
        const { filter = 'hari', date = new Date(), page = 1, limit = 8 } = req.query;
        const targetDate = new Date(date);
        const offset = (page - 1) * limit;

        let whereClause = '';

        switch (filter) {
            case 'minggu':
                whereClause = 'WHERE YEARWEEK(ck.waktu_clock_in, 1) = YEARWEEK(?, 1)';
                break;
            case 'bulan':
                whereClause = 'WHERE MONTH(ck.waktu_clock_in) = MONTH(?) AND YEAR(ck.waktu_clock_in) = YEAR(?)';
                break;
            default:
                whereClause = 'WHERE DATE(ck.waktu_clock_in) = DATE(?)';
                break;
        }

        const queryParams = filter === 'bulan' ? [targetDate, targetDate] : [targetDate];

        const countQuery = `SELECT COUNT(*) as total FROM catatan_kehadiran ck ${whereClause}`;
        const [totalResult] = await pool.query(countQuery, queryParams);
        const totalItems = totalResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const activityQuery = `
            SELECT
                p.nama_pengguna,
                DATE_FORMAT(ck.waktu_clock_in, '%Y-%m-%d') as tanggal,
                DATE_FORMAT(ck.waktu_clock_in, '%H:%i:%s') as jam_masuk,
                DATE_FORMAT(ck.waktu_clock_out, '%H:%i:%s') as jam_pulang,
                ck.status_kehadiran
            FROM catatan_kehadiran ck
                     JOIN pengguna p ON ck.id_pengguna = p.id_pengguna
                ${whereClause}
            ORDER BY ck.waktu_clock_in DESC
                LIMIT ? OFFSET ?`;

        const [activities] = await pool.query(activityQuery, [...queryParams, parseInt(limit), parseInt(offset)]);

        res.json({
            activities,
            pagination: { currentPage: parseInt(page), totalPages, totalItems }
        });

    } catch (error) {
        console.error("Error fetching recent activities:", error);
        res.status(500).send('Server Error');
    }
};