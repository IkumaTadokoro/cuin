export function getFileName(filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf("/");
  return lastSlashIndex === -1 ? filePath : filePath.slice(lastSlashIndex + 1);
}
