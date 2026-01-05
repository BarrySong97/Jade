"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface LoadMoreButtonProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  className?: string;
}

export const LoadMoreButton = ({
  onLoadMore,
  hasMore,
  isLoading = false,
  className,
}: LoadMoreButtonProps) => {
  if (!hasMore && !isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-sm text-muted-foreground">已加载全部文章</p>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-center py-8", className)}>
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className={cn(
          "px-6 py-2.5 text-sm font-medium rounded-lg",
          "border border-border bg-background",
          "text-foreground hover:bg-muted",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center gap-2"
        )}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>加载中...</span>
          </>
        ) : (
          <>
            <span>加载更多</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

