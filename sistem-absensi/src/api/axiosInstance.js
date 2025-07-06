// src/api/axiosInstance.js

import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api', // Base URL untuk semua API kita
});

// Interceptor untuk setiap PERMINTAAN (REQUEST)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk setiap RESPONS (RESPONSE)
axiosInstance.interceptors.response.use(
    (response) => {
        // Jika respons sukses (status 2xx), langsung kembalikan
        return response;
    },
    (error) => {
        // Cek jika error adalah karena token tidak valid (401)
        if (error.response && error.response.status === 401) {
            // Hapus data yang tidak valid
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Arahkan ke halaman login
            // Gunakan window.location agar halaman refresh total dan state kembali bersih
            window.location.href = '/login';

            // Beri pesan (opsional)
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
        }

        // Kembalikan error agar bisa ditangani oleh .catch() jika perlu
        return Promise.reject(error);
    }
);

export default axiosInstance;