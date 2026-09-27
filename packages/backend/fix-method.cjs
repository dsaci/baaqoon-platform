const fs = require('fs');

let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

content = content.replace(/orderBy: \{ createdAt: 'desc' \}\s*\}\);\s*\}\s*@Patch\('requests\/:id\/status'\)/, `orderBy: { createdAt: 'desc' }
      });
    }
  }

  @Patch('requests/:id/status')`);

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Fixed missing method bracket with regex');
