/** 备份文件名：循环计时器-备份-YYYYMMDD.json */
export function backupFileName(date = new Date()) {
  const d = date
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('')
  return '循环计时器-备份-' + stamp + '.json'
}
