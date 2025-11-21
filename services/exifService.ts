import exifr from 'exifr';

/**
 * Extract photo capture time from EXIF data
 * @param file - Image file to extract EXIF from
 * @returns ISO timestamp of when photo was taken, or current time if no EXIF data
 */
export const extractPhotoTimestamp = async (file: File): Promise<string> => {
  try {
    console.log('Extracting EXIF data from file:', file.name);

    // Parse EXIF data
    const exifData = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'DateTime', 'CreateDate']
    });

    console.log('EXIF data:', exifData);

    // Try different EXIF date fields in order of preference
    const photoDate = exifData?.DateTimeOriginal ||
                     exifData?.DateTime ||
                     exifData?.CreateDate;

    if (photoDate) {
      // Convert to ISO string
      const timestamp = new Date(photoDate).toISOString();
      console.log('Photo taken at:', timestamp);
      return timestamp;
    } else {
      console.log('No EXIF date found, using current time');
      return new Date().toISOString();
    }
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    // Fallback to current time if EXIF extraction fails
    return new Date().toISOString();
  }
};
