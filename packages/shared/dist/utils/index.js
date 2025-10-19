// Utilidades de validación
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const isValidPassword = (password) => {
    // Mínimo 8 caracteres, al menos una letra mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
// Utilidades de string
export const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};
export const generateSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};
export const maskEmail = (email) => {
    const [username, domain] = email.split('@');
    if (!username || !domain)
        return email;
    const maskedUsername = username.length > 2
        ? username.substring(0, 2) + '*'.repeat(username.length - 2)
        : username;
    return `${maskedUsername}@${domain}`;
};
export const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
};
// Utilidades de fecha
export const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
export const formatDateTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
export const formatRelativeTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'hace un momento';
    if (diffInSeconds < 3600)
        return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400)
        return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800)
        return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return formatDate(d);
};
// Utilidades de tiempo
export const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
export const formatMinutes = (minutes) => {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
};
// Utilidades de progreso
export const calculateProgress = (completed, total) => {
    if (total === 0)
        return 0;
    return Math.round((completed / total) * 100);
};
export const isProgressComplete = (progress, threshold = 90) => {
    return progress >= threshold;
};
// Utilidades de paginación
export const calculatePagination = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        offset: (page - 1) * limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};
// Utilidades de array
export const removeDuplicates = (array) => {
    return [...new Set(array)];
};
export const groupBy = (array, getKey) => {
    return array.reduce((groups, item) => {
        const key = getKey(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
};
export const sortBy = (array, getSortKey, order = 'asc') => {
    return [...array].sort((a, b) => {
        const aKey = getSortKey(a);
        const bKey = getSortKey(b);
        if (order === 'asc') {
            return aKey > bKey ? 1 : -1;
        }
        else {
            return aKey < bKey ? 1 : -1;
        }
    });
};
// Utilidades de objeto
export const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};
export const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};
// Utilidades de validación de archivos
export const isValidFileSize = (fileSize, maxSize) => {
    return fileSize <= maxSize;
};
export const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toLowerCase() || '';
};
export const isValidFileType = (mimeType, allowedTypes) => {
    return allowedTypes.includes(mimeType);
};
// Utilidades de URL
export const buildQueryString = (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    return searchParams.toString();
};
// Utilidades de generación de ID
export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
// Utilidades de cifrado básico
export const generateFingerprint = (userAgent, screenResolution) => {
    const data = `${userAgent}-${screenResolution}`;
    // En una implementación real, usarías un hash más seguro
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};
//# sourceMappingURL=index.js.map