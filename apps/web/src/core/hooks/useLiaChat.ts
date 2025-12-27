'use client';

import { useLiaCourseChat, UseLiaCourseChatReturn } from './useLiaCourseChat';
export { useLiaCourseChat } from './useLiaCourseChat';
export { useLiaGeneralChat } from './useLiaGeneralChat';
export type { UseLiaCourseChatReturn } from './useLiaCourseChat';
export type { UseLiaGeneralChatReturn } from './useLiaGeneralChat';

/**
 * @deprecated Use UseLiaCourseChatReturn or UseLiaGeneralChatReturn instead.
 */
export type UseLiaChatReturn = UseLiaCourseChatReturn;

/**
 * @deprecated Use useLiaCourseChat or useLiaGeneralChat instead.
 * This hook is maintained for backward compatibility.
 */
export const useLiaChat = useLiaCourseChat;
