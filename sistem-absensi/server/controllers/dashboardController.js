// server/controllers/dashboardController.js
const pool = require('../config/db');
const { format, startOfWeek, endOfWeek } = require('date-fns');
const { id } = require('date-fns/locale');

const getDisplayPeriod = (filter, date) => {
    const d = new Date(date);
    if (filter === 'hari') return format(d, 'eeee, dd MMMM yyyy', { locale: id });
    if (filter === 'minggu') {
        const awal = format(startOfWeek(d, { weekStartsOn: 1 }), 'dd MMMM');
        const akhir = format(endOfWeek(d, { weekStartsOn: 1 }), 'dd MMMM yyyy');
        return `Minggu, ${awal} - ${akhir}`;
    }
    if (filter === 'bulan') return format(d, 'MMMM yyyy', { locale: id });
    return '';
};

exports.getSupervisorSummary = async (req, res) => {
    try {
        // Menambahkan 'lokasi' sebagai parameter query, default ke null jika tidak ada
        const { filter = 'hari', date = new Date(), lokasi = null } = req.query;
        const targetDate = new Date(date);

        // Menyiapkan klausa WHERE untuk filter tanggal
        let whereClause = '';
        let dateParams = [];
        switch (filter) {
            case 'minggu':
                whereClause = 'WHERE YEARWEEK(waktu_clock_in, 1) = YEARWEEK(?, 1)';
                dateParams = [targetDate];
                break;
            case 'bulan':
                whereClause = 'WHERE MONTH(waktu_clock_in) = MONTH(?) AND YEAR(waktu_clock_in) = YEAR(?)';
                dateParams = [targetDate, targetDate];
                break;
            default: // hari
                whereClause = 'WHERE DATE(waktu_clock_in) = DATE(?)';
                dateParams = [targetDate];
                break;
        }

        // Menyiapkan parameter lokasi untuk semua query
        const lokasiParams = [lokasi, lokasi];

        // 1. Ambil Total Pekerja Aktif, difilter berdasarkan lokasi
        const activeWorkersQuery = `
            SELECT COUNT(p.id_pekerja) as total_pekerja 
            FROM pekerja p 
            JOIN pengguna u ON p.id_pengguna = u.id_pengguna 
            WHERE u.status_pengguna = 'Aktif'
              AND (p.id_lokasi_penugasan = ? OR ? IS NULL)`;
        const [totalPekerjaResult] = await pool.query(activeWorkersQuery, lokasiParams);
        const total_pekerja = totalPekerjaResult[0].total_pekerja;

        // 2. Ambil Summary untuk Kartu Statistik, difilter berdasarkan tanggal dan lokasi
        const summaryQuery = `
            SELECT
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Hadir' THEN ck.id_pekerja END) AS hadir,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Telat' THEN ck.id_pekerja END) AS terlambat,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Izin' THEN ck.id_pekerja END) AS izin,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Lembur' THEN ck.id_pekerja END) AS lembur,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Pulang Cepat' THEN ck.id_pekerja END) AS pulang_cepat,
                COUNT(DISTINCT CASE WHEN ck.status_kehadiran = 'Absen' THEN ck.id_pekerja END) AS absen
            FROM catatan_kehadiran ck
            JOIN pekerja p ON ck.id_pekerja = p.id_pekerja
            ${whereClause}
            AND (p.id_lokasi_penugasan = ? OR ? IS NULL)`;
        const [summaryResult] = await pool.query(summaryQuery, [...dateParams, ...lokasiParams]);
        const summary = summaryResult[0];
        summary.total_pekerja = total_pekerja;

        // 3. Logika perhitungan 'Belum Hadir'
        // Mengambil jumlah pekerja yang sudah tercatat kehadirannya (status apapun) pada periode dan lokasi terpilih
        const physicallyPresentQuery = `
            SELECT COUNT(DISTINCT ck.id_pekerja) as total_present
            FROM catatan_kehadiran ck
                     JOIN pekerja p ON ck.id_pekerja = p.id_pekerja
                ${whereClause}
            AND (p.id_lokasi_penugasan = ? OR ? IS NULL)`;
        const [presentResult] = await pool.query(physicallyPresentQuery, [...dateParams, ...lokasiParams]);
        const totalHadirFisik = presentResult[0].total_present;
        summary.belum_hadir = total_pekerja - totalHadirFisik;

        // 4. Data Grafik yang lebih lengkap, difilter berdasarkan tanggal dan lokasi
        let trendData = {};
        const statusList = ['Hadir', 'Telat', 'Izin', 'Lembur', 'Pulang Cepat', 'Absen'];
        const statusColors = {
            Hadir: 'rgba(75, 192, 102, 0.7)',
            Telat: 'rgba(255, 206, 86, 0.7)',
            Izin: 'rgba(54, 162, 235, 0.7)',
            Lembur: 'rgba(153, 102, 255, 0.7)',
            'Pulang Cepat': 'rgba(255, 159, 64, 0.7)',
            Absen: 'rgba(255, 99, 132, 0.7)',
            'Belum Hadir': 'rgba(201, 203, 207, 0.7)'
        };

        if (filter === 'minggu') {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const labels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            const datasets = [];

            for (const status of statusList) {
                const query = `
                    SELECT DAYNAME(waktu_clock_in) as day, COUNT(DISTINCT ck.id_pekerja) as count
                    FROM catatan_kehadiran ck
                    JOIN pekerja p ON ck.id_pekerja = p.id_pekerja
                    WHERE ck.status_kehadiran = ? AND YEARWEEK(waktu_clock_in, 1) = YEARWEEK(?, 1)
                      AND (p.id_lokasi_penugasan = ? OR ? IS NULL)
                    GROUP BY day;
                `;
                const [rows] = await pool.query(query, [status, targetDate, ...lokasiParams]);
                const dataMap = new Map(rows.map(r => [r.day, r.count]));
                datasets.push({
                    label: status,
                    data: days.map(day => dataMap.get(day) || 0),
                    backgroundColor: statusColors[status],
                });
            }
            trendData = { type: 'bar', title: 'Tren Kehadiran Mingguan', labels, datasets };

        } else if (filter === 'bulan') {
            const query = `
                SELECT
                    DATE_FORMAT(waktu_clock_in, '%Y-%m-%d') as full_date,
                    ck.status_kehadiran,
                    COUNT(DISTINCT ck.id_pekerja) as count
                FROM catatan_kehadiran ck
                JOIN pekerja p ON ck.id_pekerja = p.id_pekerja
                WHERE MONTH(waktu_clock_in) = MONTH(?) AND YEAR(waktu_clock_in) = YEAR(?)
                  AND (p.id_lokasi_penugasan = ? OR ? IS NULL)
                GROUP BY full_date, ck.status_kehadiran
                ORDER BY full_date;
            `;
            const [rows] = await pool.query(query, [...dateParams, ...lokasiParams]);

            const dateLabels = [...new Set(rows.map(r => format(new Date(r.full_date), 'dd MMM')))].sort((a, b) => new Date(a) - new Date(b));
            const datasets = [];

            for (const status of statusList) {
                const dataMap = new Map(rows.filter(r => r.status_kehadiran === status).map(r => [format(new Date(r.full_date), 'dd MMM'), r.count]));
                datasets.push({
                    label: status,
                    data: dateLabels.map(label => dataMap.get(label) || 0),
                    borderColor: statusColors[status],
                    backgroundColor: statusColors[status],
                    fill: false,
                    tension: 0.2,
                });
            }
            trendData = { type: 'line', title: 'Tren Kehadiran Bulanan', labels: dateLabels, datasets };

        } else { // filter 'hari'
            trendData = {
                type: 'pie',
                title: 'Ringkasan Kehadiran Hari Ini',
                labels: ['Hadir', 'Telat', 'Izin', 'Lembur', 'Pulang Cepat', 'Absen', 'Belum Hadir'],
                datasets: [{
                    label: 'Jumlah',
                    data: [ summary.hadir || 0, summary.terlambat || 0, summary.izin || 0, summary.lembur || 0, summary.pulang_cepat || 0, summary.absen || 0, summary.belum_hadir ],
                    backgroundColor: [
                        statusColors.Hadir, statusColors.Telat, statusColors.Izin,
                        statusColors.Lembur, statusColors['Pulang Cepat'], statusColors.Absen, statusColors['Belum Hadir']
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }]
            };
        }

        res.json({ summary, trendData, displayPeriod: getDisplayPeriod(filter, targetDate) });

    } catch (error) {
        console.error("Error fetching supervisor summary:", error);
        res.status(500).send('Server Error');
    }
};

exports.getRecentActivities = async (req, res) => {
    try {
        // Menambahkan 'lokasi' sebagai parameter query
        const { filter = 'hari', date = new Date(), page = 1, limit = 8, lokasi = null } = req.query;
        const targetDate = new Date(date);
        const offset = (page - 1) * limit;

        // Menyiapkan klausa WHERE untuk filter tanggal
        let whereClause = '';
        let dateParams = [];
        switch (filter) {
            case 'minggu':
                whereClause = 'WHERE YEARWEEK(waktu_clock_in, 1) = YEARWEEK(?, 1)';
                dateParams = [targetDate];
                break;
            case 'bulan':
                whereClause = 'WHERE MONTH(waktu_clock_in) = MONTH(?) AND YEAR(waktu_clock_in) = YEAR(?)';
                dateParams = [targetDate, targetDate];
                break;
            default: // hari
                whereClause = 'WHERE DATE(waktu_clock_in) = DATE(?)';
                dateParams = [targetDate];
                break;
        }

        // Menyiapkan parameter lokasi
        const lokasiParams = [lokasi, lokasi];
        const allParams = [...dateParams, ...lokasiParams];

        // Menghitung total item dengan filter tanggal dan lokasi
        const countQuery = `
            SELECT COUNT(*) as total
            FROM catatan_kehadiran ck
                     JOIN pekerja p ON ck.id_pekerja = p.id_pekerja
                ${whereClause}
            AND (p.id_lokasi_penugasan = ? OR ? IS NULL)`;
        const [totalResult] = await pool.query(countQuery, allParams);
        const totalItems = totalResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Mengambil data aktivitas dengan filter tanggal, lokasi, dan paginasi
        const activityQuery = `
            SELECT
                p.nama_pengguna,
                DATE_FORMAT(ck.waktu_clock_in, '%Y-%m-%d') as tanggal,
                DATE_FORMAT(ck.waktu_clock_in, '%H:%i:%s') as jam_masuk,
                DATE_FORMAT(ck.waktu_clock_out, '%H:%i:%s') as jam_pulang,
                ck.status_kehadiran,
                TIMEDIFF(ck.waktu_clock_out, ck.waktu_clock_in) as total_jam_kerja
            FROM catatan_kehadiran ck
                     JOIN pekerja pk ON ck.id_pekerja = pk.id_pekerja
                     JOIN pengguna p ON pk.id_pengguna = p.id_pengguna
                ${whereClause}
            AND (pk.id_lokasi_penugasan = ? OR ? IS NULL)
            ORDER BY ck.waktu_clock_in DESC
                LIMIT ? OFFSET ?`;

        const [activities] = await pool.query(activityQuery, [...allParams, parseInt(limit), parseInt(offset)]);

        res.json({
            activities,
            pagination: { currentPage: parseInt(page), totalPages, totalItems }
        });

    } catch (error) {
        console.error("Error fetching recent activities:", error);
        res.status(500).send('Server Error');
    }
};