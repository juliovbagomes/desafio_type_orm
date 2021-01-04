import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import fileImport from '../config/importCSV';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
// import AppError from '../errors/AppError';

interface NewTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const tmpFilePath = path.join(fileImport.multerConfig.tmpFolder, filePath);
    const readCSVStream = fs.createReadStream(tmpFilePath);
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const categories: string[] = [];
    const transactions: NewTransaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;
      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const allCategories = (await categoryRepository.find()).map(category => ({
      title: category.title,
      id: category.id,
    }));

    const transDict = transactions.map(transaction => ({
      title: transaction.title,
      type: transaction.type,
      value: transaction.value,

      category_id: allCategories.find(category => {
        return category.title === transaction.category;
      })?.id,
    }));

    // const addTransactions = 0;

    const commitTransactions = transactionRepository.create(transDict);

    await transactionRepository.save(commitTransactions);

    await fs.promises.unlink(tmpFilePath);

    return commitTransactions;
  }
}

export default ImportTransactionsService;
