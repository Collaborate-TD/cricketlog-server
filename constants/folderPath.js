const CONTAINER_PATH = process.env.NODE_ENV === 'production' ? '' : 'data/';

export const FOLDER_PATH = {
    TMP_PATH: `${CONTAINER_PATH}temp`,
    VIDEO_PATH: `${CONTAINER_PATH}videos`,
    PROFILE_PHOTO_PATH: `${CONTAINER_PATH}profile`,
    DRILL_PATH: `${CONTAINER_PATH}drills`,
}