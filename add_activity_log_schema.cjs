const fs = require('fs');
const path = 'packages/backend/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

const activityLogModel = `
model ActivityLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @db.Uuid
  action    String   @db.VarChar(100)
  details   String?
  ipAddress String?
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  user      User     @relation("UserActivityLogs", fields: [userId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
  @@schema("users")
}
`;

if (!code.includes('model ActivityLog')) {
    code = code + activityLogModel;
    
    // Add relation to User
    code = code.replace(
        'roles               UserRoleAssignment[]',
        'roles               UserRoleAssignment[]\n  activityLogs        ActivityLog[]             @relation("UserActivityLogs")'
    );
    
    fs.writeFileSync(path, code);
    console.log('ActivityLog model added to schema');
} else {
    console.log('Already added');
}
