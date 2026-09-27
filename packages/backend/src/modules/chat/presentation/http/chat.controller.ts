import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private prisma: PrismaService) {}

  @Get('conversations')
  async getConversations(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    
    // Find all conversations where the user is a participant
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        cohort: {
          select: { name: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, primaryRole: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return conversations.map(c => {
      // Find other participant name for display if it's private, else use cohort name
      const otherParticipant = c.participants.find(p => p.userId !== userId)?.user;
      return {
        id: c.id,
        name: c.cohort?.name || (otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'محادثة'),
        role: c.type === 'cohort_group' ? 'group' : otherParticipant?.primaryRole,
        lastMessage: c.messages[0]?.content || '',
        lastMessageTime: c.messages[0]?.createdAt || c.updatedAt
      };
    });
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, primaryRole: true }
        }
      }
    });
  }

  @Post('conversations/:id/messages')
  async sendMessage(@Req() req: any, @Param('id') conversationId: string, @Body() body: { text: string }) {
    const userId = req.user.id || req.user.userId;
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: body.text,
        status: 'safe' // Mocking safe for UI display instantly
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, primaryRole: true }
        }
      }
    });
  }
}
