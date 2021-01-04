import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactiosnRepository = getCustomRepository(TransactionsRepository);

    const categoryRepository = getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // If category is new, it should be saved to categories database
    if (!transactionCategory) {
      // Save to category table
      transactionCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(transactionCategory);
    }

    const transactionAmount = type === 'income' ? value : -value;

    const balance = await transactiosnRepository.getBalance();
    const validBalance = balance.total + transactionAmount >= 0;

    if (validBalance) {
      const transaction = transactiosnRepository.create({
        title,
        type,
        value,
        category_id: transactionCategory.id,
      });
      await transactiosnRepository.save(transaction);

      return transaction;
    }
    throw new AppError('Balance is not enough for this transaction');
  }
}

export default CreateTransactionService;
