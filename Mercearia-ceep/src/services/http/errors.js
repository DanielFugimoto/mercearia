import axios from 'axios'

export function isRequestCanceled(error) {
  return axios.isCancel(error) || error?.code === 'ERR_CANCELED'
}

export function getErrorMessage(error, fallback = 'Não foi possível concluir a operação.') {
  if (isRequestCanceled(error)) return ''
  if (!axios.isAxiosError(error)) return fallback

  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'A API demorou demais para responder.'
      : 'Não foi possível conectar com a API.'
  }

  const messages = {
    401: 'Sua sessão expirou. Entre novamente.',
    403: 'Você não tem permissão para esta operação.',
    404: 'O registro solicitado não foi encontrado.',
    409: 'A operação conflita com os dados atuais.',
  }

  return error.response.data?.message
    || messages[error.response.status]
    || (error.response.status >= 500 ? 'A API está temporariamente indisponível.' : fallback)
}
