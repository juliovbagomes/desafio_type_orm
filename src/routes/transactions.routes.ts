import { Router } from 'express';
import multer from 'multer';

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import fileImport from '../config/importCSV';

const transactionsRouter = Router();
const upload = multer(fileImport.multerConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionRepository.find();
  const balance = await transactionRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { params } = request;

  const deleteTransaction = new DeleteTransactionService();

  if (await deleteTransaction.execute(params.id)) {
    return response.status(204).json();
  }
  return response.status(404).json();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();
    const importFilename = request.file.filename;
    const importedTransactions = await importTransactions.execute(
      importFilename,
    );
    return response.json(importedTransactions);
  },
);

export default transactionsRouter;
