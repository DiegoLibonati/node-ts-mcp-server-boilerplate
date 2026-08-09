import type { Code } from "@/types/constants";

export interface ExceptionInfo {
  code: Code;
  message: string;
  isOperational: boolean;
}
