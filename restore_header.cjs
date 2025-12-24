const fs = require('fs');
const path = require('path');

const backups = [
    {
        src: "C:\\Users\\Rabi\\.gemini\\antigravity\\code_tracker\\active\\ouse-passar-monorepo_0e6b113ad01da1519c74617d7784624b803c8a7f\\139b5822018ee4a948c569cdb5ec6401_Header.tsx",
        dest: "packages/questoes/src/components/layout/Header.tsx"
    }
];

function smartClean(content) {
    // 1. Remove binary garbage at start (BOM or others)
    const markers = ['import ', 'const ', 'interface ', 'type '];
    let startIndex = -1;

    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    for (const m of markers) {
        const idx = content.indexOf(m);
        if (idx !== -1 && (startIndex === -1 || idx < startIndex)) {
            startIndex = idx;
        }
    }

    if (startIndex > 0) {
        console.log(`  - Trimmed ${startIndex} bytes of header garbage.`);
        content = content.slice(startIndex);
    }

    // 2. Remove footer garbage (file paths etc)
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < content.length - 1) {
        const tail = content.slice(lastBrace + 1);
        if (tail.includes('file:///') || tail.length > 500) {
            console.log(`  - Trimmed ${content.length - (lastBrace + 1)} bytes of footer garbage.`);
            content = content.slice(0, lastBrace + 1);
        }
    }

    return content;
}

console.log('Restoring Header.tsx...\n');

backups.forEach(({ src, dest }) => {
    try {
        let content = fs.readFileSync(src, 'utf8');
        const destPath = path.resolve(dest);
        const originalSize = content.length;
        content = smartClean(content);

        fs.writeFileSync(destPath, content, 'utf8');
        console.log(`✓ Restored ${dest} (Size: ${content.length} bytes, Original: ${originalSize})`);

    } catch (err) {
        console.log(`✗ Failed to restore ${dest}: ${err.message}`);
    }
});
