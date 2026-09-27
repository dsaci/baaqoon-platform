const fs = require('fs');
let content = fs.readFileSync('src/modules/chat/presentation/http/chat.controller.ts', 'utf8');

// Remove include: { cohort: true }
content = content.replace(/cohort:\s*true,?\s*/g, '');

// Fetch cohort names manually
const search = `    return conversations.map(c => ({
      id: c.id,
      type: c.type,
      cohortName: c.cohort?.name,
      participants: c.participants.map(p => ({
        id: p.user.id,
        name: \`\${p.user.firstName} \${p.user.lastName}\`,
        avatarUrl: p.user.avatarUrl
      })),
      lastMessage: c.messages[0],
      unreadCount: 0 // Mock for now
    }));`;

const replacement = `    // Fetch cohort names manually
    const cohortIds = conversations.map(c => c.cohortId).filter(id => id);
    let cohorts: any[] = [];
    if (cohortIds.length > 0) {
      cohorts = await this.prisma.cohort.findMany({
        where: { id: { in: cohortIds as string[] } },
        select: { id: true, name: true }
      });
    }

    return conversations.map(c => {
      const cohortName = cohorts.find(ch => ch.id === c.cohortId)?.name;
      return {
        id: c.id,
        type: c.type,
        cohortName,
        participants: (c as any).participants?.map((p: any) => ({
          id: p.user.id,
          name: \`\${p.user.firstName} \${p.user.lastName}\`,
          avatarUrl: p.user.avatarUrl
        })) || [],
        lastMessage: (c as any).messages?.[0],
        unreadCount: 0 // Mock for now
      };
    });`;

if (content.includes('return conversations.map(c => ({')) {
  content = content.replace(search, replacement);
  fs.writeFileSync('src/modules/chat/presentation/http/chat.controller.ts', content);
  console.log('Fixed chat controller');
} else {
  // It might be formatted differently, just replace everything inside getConversations
  const methodRegex = /async getConversations[\s\S]*?\n  \}/;
  const newMethod = `async getConversations(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const cohortIds = conversations.map(c => c.cohortId).filter(id => id);
    let cohorts: any[] = [];
    if (cohortIds.length > 0) {
      cohorts = await this.prisma.cohort.findMany({
        where: { id: { in: cohortIds as string[] } },
        select: { id: true, name: true }
      });
    }

    return conversations.map(c => {
      const cohortName = cohorts.find(ch => ch.id === c.cohortId)?.name;
      return {
        id: c.id,
        type: c.type,
        cohortName,
        participants: (c as any).participants?.map((p: any) => ({
          id: p.user.id,
          name: \`\${p.user.firstName} \${p.user.lastName}\`,
          avatarUrl: p.user.avatarUrl
        })) || [],
        lastMessage: (c as any).messages?.[0],
        unreadCount: 0
      };
    });
  }`;
  content = content.replace(methodRegex, newMethod);
  fs.writeFileSync('src/modules/chat/presentation/http/chat.controller.ts', content);
  console.log('Fixed chat controller with regex');
}
