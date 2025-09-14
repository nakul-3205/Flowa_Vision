const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",

];
 const MAX_FILE_SIZE = 8 * 1024 * 1024

export function validateFile(file:File): string | null{
    if(!ALLOWED_FILE_TYPES.includes(file.type)){
        return "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.";
    }
    if(file.size>MAX_FILE_SIZE){
        return "File size exceeds 10 MB limit.";

    }
    return null;
}