const { randomUUID } = require('crypto');
const supabase = require('../lib/supabase');

const BUCKET = process.env.SUPABASE_PLAYER_PHOTOS_BUCKET || 'player-photos';
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/;

let bucketReady = false;

const ensureBucket = async () => {
    if (bucketReady) return;

    const { error } = await supabase.storage.getBucket(BUCKET);
    if (!error) {
        bucketReady = true;
        return;
    }

    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (createError && createError.message !== 'The resource already exists') {
        throw new Error(`Could not create photo bucket: ${createError.message}`);
    }

    bucketReady = true;
};

const uploadPlayerPhoto = async (photoDataUrl) => {
    if (!photoDataUrl || !photoDataUrl.startsWith('data:image/')) {
        return photoDataUrl || null;
    }

    const match = photoDataUrl.match(DATA_URL_PATTERN);
    if (!match) {
        throw new Error('Invalid profile photo format');
    }

    await ensureBucket();

    const [, mimeType, base64Data] = match;
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `players/${randomUUID()}.${extension}`;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, fileBuffer, {
            contentType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
            upsert: false
        });

    if (error) {
        throw new Error(`Could not upload profile photo: ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

const deletePlayerPhoto = async (photoUrl) => {
    if (!photoUrl || !photoUrl.includes(`/storage/v1/object/public/${BUCKET}/`)) {
        return;
    }

    const filePath = decodeURIComponent(photoUrl.split(`/storage/v1/object/public/${BUCKET}/`)[1]);
    if (!filePath) return;

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) {
        console.log('Photo cleanup failed:', error.message);
    }
};

module.exports = {
    BUCKET,
    uploadPlayerPhoto,
    deletePlayerPhoto
};
