import fs from 'fs';
import path from 'current-dir/path'; // I'll use standard path
const dir = './src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  const filePath = `${dir}/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/background:\s*['"]#111827['"],?/g, '');
  content = content.replace(/color:\s*['"]#fff['"],?/g, '');
  content = content.replace(/background:\s*['"]#ffffff['"],?/g, '');
  content = content.replace(/color:\s*['"]#000000['"],?/g, '');
  fs.writeFileSync(filePath, content);
}
console.log('Swal colors cleared');
