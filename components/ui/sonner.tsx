"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      expand={false}
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white text-gray-900 border border-gray-200 shadow-sm rounded-lg",
          description: "text-gray-600 text-sm",
          actionButton: "bg-[#0794d4] text-white",
          cancelButton: "bg-white text-gray-600",
          closeButton: "!border-0",
          success:
            "!bg-green-50 !border-green-200 !text-green-900 [&>button]:!bg-green-100 [&>button]:!text-green-600 [&>button]:hover:!bg-green-200",
          error:
            "!bg-red-50 !border-red-200 !text-red-900 [&>button]:!bg-red-100 [&>button]:!text-red-600 [&>button]:hover:!bg-red-200",
          warning:
            "!bg-yellow-50 !border-yellow-200 !text-yellow-900 [&>button]:!bg-yellow-100 [&>button]:!text-yellow-600 [&>button]:hover:!bg-yellow-200",
          info: "!bg-blue-50 !border-blue-200 !text-[#0794d4] [&>button]:!bg-blue-100 [&>button]:!text-blue-600 [&>button]:hover:!bg-blue-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
