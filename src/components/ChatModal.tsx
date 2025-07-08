"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { ChatInterface } from "./ChatInterface";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isEnlarged) {
    // Full screen modal (original design)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] mx-4 flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">AI Restaurant Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Your personal dining companion powered by AI
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Minimize Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEnlarged(false)}
                className="h-8 w-8 rounded-full"
                title="Minimize"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </Button>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 p-6 overflow-hidden">
            <ChatInterface className="h-full" />
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t bg-muted/50">
            <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Personalized Recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Voice Enabled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Real-Time Information</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Right side panel (30% width, no blur)
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Right Side Panel */}
      <div className="absolute right-0 top-0 h-full w-[30%] bg-white shadow-2xl border-l pointer-events-auto flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div>
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Ask me anything about restaurants
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Enlarge Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEnlarged(true)}
              className="h-6 w-6 rounded-full"
              title="Enlarge"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 p-4 overflow-hidden">
          <ChatInterface className="h-full" />
        </div>

        {/* Panel Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Personalized</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Voice</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Real-Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
