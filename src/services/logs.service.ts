import type { AnyObject } from "../models";

export function parseLogGroupFile(logGroupFile: string): AnyObject {
  /// parse log group file
  const parsedLogFile = logGroupFile
    .split('\n')
    .filter((item: string) => item.length > 0)
    .map((item: string) => JSON.parse(item));
  // explicitly return the
  // parsed log group file
  return parsedLogFile;
}

export function parseLogGroupFiles(logGroupFiles: string[]): AnyObject {
  /// parse the log group files
  const parsedLogFiles = logGroupFiles.map((logGroupFile) => parseLogGroupFile(logGroupFile));
  // explicitly return the
  // parsed log group files
  return parsedLogFiles;
}

