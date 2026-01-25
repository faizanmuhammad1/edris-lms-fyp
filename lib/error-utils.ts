import { toast } from "sonner";

/**
 * Standard error response type from server actions
 */
export interface ActionError {
    success: false;
    message: string;
    code?: string;
}

/**
 * Standard success response type from server actions
 */
export interface ActionSuccess<T = unknown> {
    success: true;
    data?: T;
    message?: string;
}

export type ActionResult<T = unknown> = ActionSuccess<T> | ActionError;

/**
 * Error messages for common error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
    UNAUTHORIZED: "You must be logged in to perform this action",
    FORBIDDEN: "You don't have permission to perform this action",
    NOT_FOUND: "The requested resource was not found",
    VALIDATION_ERROR: "Please check your input and try again",
    NETWORK_ERROR: "Network error. Please check your connection",
    SERVER_ERROR: "An unexpected error occurred. Please try again",
    RATE_LIMITED: "Too many requests. Please wait and try again",
};

/**
 * Show an error toast with appropriate message
 */
export function showErrorToast(
    error: unknown,
    fallbackMessage = "Something went wrong"
) {
    let message = fallbackMessage;

    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === "string") {
        message = error;
    } else if (error && typeof error === "object") {
        if ("message" in error && typeof error.message === "string") {
            message = error.message;
        }
        if ("code" in error && typeof error.code === "string") {
            message = ERROR_MESSAGES[error.code] || message;
        }
    }

    toast.error(message, {
        duration: 5000,
    });
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string) {
    toast.success(message, {
        duration: 3000,
    });
}

/**
 * Handle action result - shows error toast if failed
 */
export function handleActionResult<T>(
    result: ActionResult<T>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
        showSuccessToast?: boolean;
    }
): result is ActionSuccess<T> {
    if (!result.success) {
        showErrorToast(result.message, options?.errorMessage);
        return false;
    }

    if (options?.showSuccessToast && options?.successMessage) {
        showSuccessToast(options.successMessage);
    }

    return true;
}

/**
 * Wrap an async function to handle errors gracefully
 */
export async function withErrorHandling<T>(
    fn: () => Promise<T>,
    options?: {
        errorMessage?: string;
        showToast?: boolean;
    }
): Promise<T | null> {
    try {
        return await fn();
    } catch (error) {
        console.error("Error:", error);
        if (options?.showToast !== false) {
            showErrorToast(error, options?.errorMessage);
        }
        return null;
    }
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
    message: string,
    code?: string
): ActionError {
    return {
        success: false,
        message,
        code,
    };
}

/**
 * Create a standard success response
 */
export function createSuccessResponse<T>(
    data?: T,
    message?: string
): ActionSuccess<T> {
    return {
        success: true,
        data,
        message,
    };
}
