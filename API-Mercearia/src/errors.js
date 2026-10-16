const {
  BaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} = require('sequelize');

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Rota não encontrada.' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ message: 'Já existe um registro com esses dados.' });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      message: 'O registro está vinculado a outros dados e não pode ser removido.',
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      message: error.errors[0]?.message || 'Dados inválidos.',
    });
  }

  if (error instanceof BaseError) {
    return res.status(500).json({
      message: 'Não foi possível concluir a operação no banco de dados.',
    });
  }

  console.error('Erro inesperado na API:', error.message);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = { AppError, notFoundHandler, errorHandler };
