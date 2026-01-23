import { IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';
import { Api } from '../../shared/api';

type Handler<TInput, TOutput> = (input: TInput, event: IpcMainInvokeEvent) => Promise<TOutput>;

export const procedure = {
    // Crée une "route" protégée par un schéma Zod
    input: <T extends z.ZodType>(schema: T) => ({
        query: <TReturn>(handler: Handler<z.infer<T>, TReturn>) => handle(schema, handler),
        mutation: <TReturn>(handler: Handler<z.infer<T>, TReturn>) => handle(schema, handler),
    })
};

// Logique interne du middleware
const handle = (schema: z.ZodType, handler: Function) => {
    return async (event: IpcMainInvokeEvent, rawInput: any) => {
        try {
            // 1. Validation (Middleware Zod)
            const input = schema.parse(rawInput);

            // 2. Exécution du Controller
            const result = await handler(input, event);

            // 3. Réponse standardisée
            return Api.success(result);

        } catch (err: any) {
            console.error('[IPC ERROR]', err);

            // On force le typage pour rassurer TypeScript
            if (err instanceof z.ZodError) {
                return Api.error('Validation Error', 'VALIDATION_FAILED', err.issues);
            }
            
            // Gestion générique
            const message = err instanceof Error ? err.message : 'Unknown error';
            return Api.error(message, 'SERVER_ERROR');
        }
    };
};