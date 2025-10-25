'use client';

import React from 'react';
import { ReactionBanner } from '../ReactionBanner';
import { ReactionButton } from '../ReactionButton';

interface PostInteractionsProps {
  postId: string;
  communitySlug: string;
  currentReaction: string | null;
  reactionCount: number;
  onReaction: (postId: string, reactionType: string | null) => void;
  topReactions?: Array<{
    reaction_type: string;
    count: number;
    emoji: string;
  }>;
  isFacebookStyle?: boolean;
  showBanner?: boolean;
  showButton?: boolean;
  className?: string;
}

export function PostInteractions({
  postId,
  communitySlug,
  currentReaction,
  reactionCount,
  onReaction,
  topReactions = [],
  isFacebookStyle = true,
  showBanner = true,
  showButton = true,
  className = ''
}: PostInteractionsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Banner de reacciones */}
      {showBanner && reactionCount > 0 && (
        <ReactionBanner
          totalReactions={reactionCount}
          topReactions={topReactions}
          className="px-4 py-2"
        />
      )}

      {/* Botón de reacciones */}
      {showButton && (
        <div className="flex items-center justify-center">
          <ReactionButton
            postId={postId}
            currentReaction={currentReaction}
            reactionCount={reactionCount}
            onReaction={onReaction}
            isFacebookStyle={isFacebookStyle}
          />
        </div>
      )}
    </div>
  );
}
