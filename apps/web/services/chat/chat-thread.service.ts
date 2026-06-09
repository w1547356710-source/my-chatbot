import { chatThreadRepo } from "./chat-thread.repo";

export async function createChatThread(input: { userId: string; title?: string }) {
  return chatThreadRepo.createThread({
    userId: input.userId,
    title: input.title,
  });
}

export async function listChatThreads(input: { userId: string; includeArchived?: boolean }) {
  return chatThreadRepo.listThreadsByUserId(input.userId, {
    includeArchived: input.includeArchived,
  });
}

export async function getChatThread(input: { userId: string; threadId: string }) {
  return chatThreadRepo.findThreadByThreadId(input.userId, input.threadId);
}

export async function renameChatThread(input: { userId: string; threadId: string; title: string }) {
  return chatThreadRepo.updateThreadTitle(input.userId, input.threadId, input.title);
}

export async function setChatThreadArchived(input: {
  userId: string;
  threadId: string;
  isArchived: boolean;
}) {
  return chatThreadRepo.updateThreadArchiveState(input.userId, input.threadId, input.isArchived);
}

export async function touchChatThread(input: { userId: string; threadId: string }) {
  return chatThreadRepo.touchThread(input.userId, input.threadId);
}

export async function deleteChatThread(input: { userId: string; threadId: string }) {
  return chatThreadRepo.deleteThread(input.userId, input.threadId);
}
