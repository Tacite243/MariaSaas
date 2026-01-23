export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

// Helper pour créer des réponses
export const Api = {
    success: <T>(data: T): ApiResponse<T> => ({ success: true, data }),
    error: (message: string, code = 'INTERNAL_ERROR', details?: any): ApiResponse => ({
        success: false,
        error: { code, message, details }
    })
};