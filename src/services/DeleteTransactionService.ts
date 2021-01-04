// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<boolean> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    await transactionRepository.delete(id);
    return true;
  }
}

export default DeleteTransactionService;
