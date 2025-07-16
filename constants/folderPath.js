const CONTAINER_PATH = process.env.NODE_ENV === 'production' ? '' : 'data/';
const TEMP = 'data/';

export const FOLDER_PATH = {
    TMP_PATH: `${TEMP}temp`,
    VIDEO_PATH: `${CONTAINER_PATH}videos`,
    PROFILE_PHOTO_PATH: `${CONTAINER_PATH}profile`,
    DRILL_PATH: `${CONTAINER_PATH}drills`,
}