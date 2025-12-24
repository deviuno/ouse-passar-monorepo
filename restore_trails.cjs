const fs = require('fs');
const path = require('path');

const backups = [
    {
        src: "C:\\Users\\Rabi\\.gemini\\antigravity\\code_tracker\\active\\ouse-passar-monorepo_0e6b113ad01da1519c74617d7784624b803c8a7f\\0c039ddd3d2e1e04d05c0b05e1195095_MissionPage.tsx",
        dest: "packages/questoes/src/pages/MissionPage.tsx"
    },
    {
        src: "C:\\Users\\Rabi\\.gemini\\antigravity\\code_tracker\\active\\ouse-passar-monorepo_0e6b113ad01da1519c74617d7784624b803c8a7f\\4f4031709191807e06d00751fd39fc52_RoundSelector.tsx",
        dest: "packages/questoes/src/components/trail/RoundSelector.tsx"
    },
    {
        src: "C:\\Users\\Rabi\\.gemini\\antigravity\\code_tracker\\active\\ouse-passar-monorepo_0e6b113ad01da1519c74617d7784624b803c8a7f\\aa609f1aabe0a9ce226206a651d3b674_TrailMap.tsx", // TrailMap backup
        dest: "packages/questoes/src/components/trail/TrailMap.tsx"
    },
    {
        src: "C:\\Users\\Rabi\\.gemini\\antigravity\\code_tracker\\active\\ouse-passar-monorepo_0e6b113ad01da1519c74617d7784624b803c8a7f\\d81020adf08e7c07fcfdcddf136d8172_SimuladosPage.tsx",
        dest: "packages/questoes/src/pages/SimuladosPage.tsx"
    }
];

function smartClean(content) {
    // 1. Remove binary garbage at start (BOM or others)
    // Find first occurence of 'import', 'const', 'interface', 'import type'
    const markers = ['import ', 'const ', 'interface ', 'type '];
    let startIndex = -1;

    // Check for standard BOM
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
    // Find absolute last '}'
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < content.length - 1) {
        // Double check if the text AFTER the last brace looks like code or garbage
        const tail = content.slice(lastBrace + 1);
        if (tail.includes('file:///') || tail.length > 500) { // arbitrary heuristic
            console.log(`  - Trimmed ${content.length - (lastBrace + 1)} bytes of footer garbage.`);
            content = content.slice(0, lastBrace + 1);
        }
    }

    return content;
}

console.log('Restoring Trail/Mission files...\n');

backups.forEach(({ src, dest }) => {
    try {
        let content = fs.readFileSync(src, 'utf8');
        const destPath = path.resolve(dest);
        const dir = path.dirname(destPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const originalSize = content.length;
        content = smartClean(content);

        fs.writeFileSync(destPath, content, 'utf8');
        console.log(`✓ Restored ${dest} (Size: ${content.length} bytes, Original: ${originalSize})`);

    } catch (err) {
        console.log(`✗ Failed to restore ${dest}: ${err.message}`);
    }
});
