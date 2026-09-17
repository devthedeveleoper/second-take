const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modified = 0;

walkDir(srcDir, function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        content = content.replace(/\.listDocuments/g, '.listRows');
        content = content.replace(/\.createDocument/g, '.createRow');
        content = content.replace(/\.updateDocument/g, '.updateRow');
        content = content.replace(/\.deleteDocument/g, '.deleteRow');
        content = content.replace(/\.getDocument/g, '.getRow');
        
        content = content.replace(/\.documents/g, '.rows');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            modified++;
            console.log('Modified:', filePath);
        }
    }
});

console.log(`Replaced all methods in ${modified} files.`);
