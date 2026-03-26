    // src/shared/utils/getErrorMessage.ts

    export const getErrorMessage = (error: any, fallback = 'Ocurrió un error inesperado'): string => {
    const data = error?.response?.data

    if (typeof data === 'string') return data
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.error === 'string') return data.error
    if (typeof error?.message === 'string') return error.message

    return fallback
    }