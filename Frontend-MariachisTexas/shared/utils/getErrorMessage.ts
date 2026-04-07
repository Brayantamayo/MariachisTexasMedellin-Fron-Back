    // src/shared/utils/getErrorMessage.ts

    export const getErrorMessage = (error: any, fallback = 'Ocurrió un error inesperado'): string => {
    const data = error?.response?.data

    // Intentar extraer message de diferentes estructuras
    if (typeof data?.message === 'string' && data.message.trim()) return data.message
    if (typeof data?.error === 'string' && data.error.trim()) return data.error
    if (typeof data === 'string' && data.trim()) return data
    if (typeof error?.message === 'string' && error.message.trim()) return error.message
    
    // Intentar extraer el primer error de un array de errores
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const firstError = data.errors[0]
      if (typeof firstError === 'string' && firstError.trim()) return firstError
      if (typeof firstError?.message === 'string' && firstError.message.trim()) return firstError.message
    }

    // Intentar extraer detalles adicionales
    if (data?.details) {
      if (typeof data.details === 'string' && data.details.trim()) return data.details
      if (typeof data.details?.message === 'string' && data.details.message.trim()) return data.details.message
    }

    // Si el data es un objeto, intentar serializar
    if (data && typeof data === 'object') {
      try {
        const json = JSON.stringify(data)
        if (json && json.length > 0) return json.substring(0, 200)
      } catch {}
    }

    return fallback
    }