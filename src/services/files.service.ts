// node_modules
import * as tauriDialog from 'tauri/api/dialog';
import * as tauriFs from 'tauri/api/fs';
import * as tauri from 'tauri/api/tauri'

export async function getFileNames(): Promise<string[]> {
  // ask user for log files directory
  const fileNames = await tauriDialog.open({ multiple: true });
  // return the log directoy
  // name explicitly
  return fileNames as string[];
}

export async function readTextFile(filePath: string): Promise<string> {
  // read the audit file
  const readTextFile = await tauriFs.readTextFile(filePath);
  // explicity return read file
  return readTextFile;
}

export async function readTextFiles(filePaths: string[]): Promise<string[]> {
  // read all files
  const readTextFiles = await Promise.all(
    filePaths.map((filePath: string) => readTextFile(filePath))
  );
  // explicitly return read files
  return readTextFiles;
}

export async function decodeGzFile(filePath: string) {
  // decode/unzip gz file
  const decodedGzFile: string = await tauri.promisified({
    cmd: 'decodeGzFile',
    argument: filePath
  });
  // explicitly return the
  // decoded/unzipped gz file
  return decodedGzFile;
}

export async function decodeGzFiles(filePaths: string[]) {
  // decode/unzip all gz files
  const decodedGzFiles = await Promise.all(
    filePaths.map((filePath) => tauri.promisified({
      cmd: 'decodeGzFile',
      argument: filePath
    }))
  );
  // explicitly return the
  // decoded/unzipped gz file
  return decodedGzFiles;
}