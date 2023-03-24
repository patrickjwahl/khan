import { APIRoute, sanitizeKey } from 'next-s3-upload';

export default APIRoute.configure({
    key(req, filename) {
        return `images/${sanitizeKey(filename)}`;
    }
});