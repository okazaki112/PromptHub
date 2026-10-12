/**
 * ZIP payload contract for the desktop selective export (`data:exportZip`).
 * The renderer owns the selection; the main process only copies what is named.
 */
export interface ExportZipScope {
  prompts: boolean;
  versions: boolean;
  /** Pack only the image files named in `imageFileNames`. */
  images: boolean;
  imageFileNames?: string[];
  /** Pack the desktop background image as a separate, opt-in asset. */
  backgroundImage?: boolean;
  backgroundImageFileName?: string;
  videos?: boolean;
  skills: boolean;
  rules?: boolean;
  config: boolean;
  aiConfigJson?: string;
  settingsJson?: string;
  exportJson?: string;
}

export interface ExportZipResult {
  canceled: boolean;
  filePath?: string;
  error?: string;
}
