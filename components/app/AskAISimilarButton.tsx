"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatActions } from "@/lib/store/chat-store-provider";

interface AskAISimilarButtonProps {
  productName: string;
}

export function AskAISimilarButton({ productName }: AskAISimilarButtonProps) {
  const { openChatWithMessage } = useChatActions();

  const handleClick = () => {
    openChatWithMessage(`Show me products similar to "${productName}"`);
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full gap-2 bg-linear-to-r from-brand-500 to-brand-600 text-white shadow-lg hover:from-brand-600 hover:to-brand-700 hover:shadow-xl dark:from-brand-600 dark:to-brand-700 dark:hover:from-brand-700 dark:hover:to-brand-800"
    >
      <Sparkles className="h-4 w-4" />
      Find Similar
    </Button>
  );
}