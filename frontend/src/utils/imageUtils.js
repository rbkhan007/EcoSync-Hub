export const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) {
        if (url.includes('via.placeholder.com')) {
            return 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=200';
        }
        return url;
    }
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');
    return `${IMAGE_BASE_URL}${url}`;
};
