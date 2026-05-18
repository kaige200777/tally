import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const APP_DIR_NAME = '记账本';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const createAppDirectory = async (): Promise<void> => {
  try {
    await Filesystem.mkdir({
      path: APP_DIR_NAME,
      directory: Directory.Documents,
      recursive: false
    });
  } catch (error) {
    if (!(error as Error).message.includes('already exists')) {
      console.error('创建目录失败:', error);
    }
  }
};

export const saveFileToAppDir = async (
  filename: string,
  content: string | Uint8Array,
  isBinary: boolean = false
): Promise<string> => {
  if (!isNativePlatform()) {
    const blob = isBinary && content instanceof Uint8Array
      ? new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      : new Blob([content as string], { type: 'text/plain;charset=utf-8' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return filename;
  }
  
  await createAppDirectory();
  
  let data: string;
  let encoding: Encoding | undefined;
  
  if (isBinary && content instanceof Uint8Array) {
    data = uint8ArrayToBase64(content);
    encoding = undefined;
  } else {
    data = content as string;
    encoding = Encoding.UTF8;
  }
  
  const result = await Filesystem.writeFile({
    path: `${APP_DIR_NAME}/${filename}`,
    directory: Directory.Documents,
    data: data,
    encoding: encoding,
    recursive: true
  });
  
  return result.uri || '';
};

export const readFileFromAppDir = async (filename: string): Promise<string> => {
  const result = await Filesystem.readFile({
    path: `${APP_DIR_NAME}/${filename}`,
    directory: Directory.Documents,
    encoding: Encoding.UTF8
  });
  
  return result.data as string;
};

export const listFilesInAppDir = async (): Promise<string[]> => {
  try {
    const result = await Filesystem.readdir({
      path: APP_DIR_NAME,
      directory: Directory.Documents
    });
    return result.files.map(f => f.name);
  } catch (error) {
    console.error('读取目录失败:', error);
    return [];
  }
};