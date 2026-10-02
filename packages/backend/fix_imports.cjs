const fs = require('fs');
let code = fs.readFileSync('src/modules/auth/presentation/http/users.controller.ts', 'utf8');

code = code.replace(
  "import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';",
  "import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req, Post, UnauthorizedException } from '@nestjs/common';"
);

fs.writeFileSync('src/modules/auth/presentation/http/users.controller.ts', code);
