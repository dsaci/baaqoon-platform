const fs = require('fs');

let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

// Fix missing bracket before @Post('requests')
if (content.includes('    };\n  @Post(\'requests\')')) {
  content = content.replace('    };\n  @Post(\'requests\')', '    };\n  }\n\n  @Post(\'requests\')');
} else if (content.includes('    };\r\n  @Post(\'requests\')')) {
  content = content.replace('    };\r\n  @Post(\'requests\')', '    };\r\n  }\r\n\r\n  @Post(\'requests\')');
}

// Fix extra bracket before @Patch('requests/:id/status')
if (content.includes('    }\n  }\n\n  @Patch(\'requests/:id/status\')')) {
  content = content.replace('    }\n  }\n\n  @Patch(\'requests/:id/status\')', '    }\n\n  @Patch(\'requests/:id/status\')');
} else if (content.includes('    }\r\n  }\r\n\r\n  @Patch(\'requests/:id/status\')')) {
  content = content.replace('    }\r\n  }\r\n\r\n  @Patch(\'requests/:id/status\')', '    }\r\n\r\n  @Patch(\'requests/:id/status\')');
}

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Fixed brackets');
