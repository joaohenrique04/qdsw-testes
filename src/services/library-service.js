// services/library-service.js
import { Book } from "../models/book.js";
import { User } from "../models/user.js";

export class LibraryService {
  constructor(repository) {
    this.repo = repository;
  }

  // --- Operações com livros ---
  registerBook(title, author, quantity = 1) {
    // Valida antes da busca: títulos ausentes não podem chegar ao toLowerCase.
    const book = new Book(title, author, quantity);
    if (this.repo.findBook(title)) {
      throw new Error("Livro já existe na biblioteca");
    }
    this.repo.addBook(book);
    return book;
  }

  listBooks() {
    return this.repo.listBooks();
  }

  searchBooks(term = "") {
    if (typeof term !== "string" || !term.trim()) return [];
    const query = term.trim().toLowerCase();
    return this.repo.listBooks().filter(book =>
      book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
    );
  }

  removeBook(title) {
    const book = this.repo.findBook(title);
    if (!book) throw new Error("Livro não encontrado");
    if (book.quantity !== book.originalQuantity) {
      throw new Error("Não é possível remover: há exemplares emprestados");
    }
    this.repo.removeBook(title);
    return true;
  }

  // --- Operações com usuários ---
  registerUser(id, name) {
    if (this.repo.findUser(id)) {
      throw new Error("Usuário já cadastrado");
    }
    const user = new User(id, name);
    this.repo.addUser(user);
    return user;
  }

  listUsers() {
    return this.repo.listUsers();
  }

  // --- Operações de empréstimo ---
  borrowBook(userId, title, date = new Date()) {
    const user = this.repo.findUser(userId);
    if (!user) throw new Error("Usuário não encontrado");

    const book = this.repo.findBook(title);
    if (!book) throw new Error("Livro não encontrado");
    if (book.quantity <= 0) throw new Error("Nenhum exemplar disponível");

    // regras do usuário
    if (user.loanCount() >= 3) throw new Error("Usuário atingiu o limite de empréstimos (3)");
    if (user.hasBorrowed(book.title)) throw new Error("Usuário já tem esse livro emprestado");

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error("Data de empréstimo inválida");
    }

    // tudo ok -> registra empréstimo
    book.quantity -= 1;
    user.borrow(book.title, date);
    return true;
  }

  returnBook(userId, title, date = new Date()) {
    const user = this.repo.findUser(userId);
    if (!user) throw new Error("Usuário não encontrado");

    const book = this.repo.findBook(title);
    if (!book) throw new Error("Livro não encontrado");

    if (!user.hasBorrowed(book.title)) throw new Error("Usuário não emprestou este livro");

    if (book.quantity + 1 > book.originalQuantity) throw new Error("Quantidade máxima atingida");

    const borrowedAt = user.loans.get(book.title);
    if (!(date instanceof Date) || Number.isNaN(date.getTime()) || date < borrowedAt) {
      throw new Error("Data de devolução inválida");
    }

    const result = {
      title: book.title,
      borrowedAt: new Date(borrowedAt.getTime()),
      returnedAt: new Date(date.getTime()),
      // Dias completos são intervalos de 24 horas, independentemente do fuso.
      days: Math.floor((date.getTime() - borrowedAt.getTime()) / 86_400_000)
    };

    // devolução
    book.quantity += 1;
    user.return(book.title);
    return result;
  }

  listLoans(userId) {
    const user = this.repo.findUser(userId);
    if (!user) throw new Error("Usuário não encontrado");
    return user.listLoans();
  }

  listLoanDetails(userId) {
    const user = this.repo.findUser(userId);
    if (!user) throw new Error("Usuário não encontrado");
    return user.listLoanDetails();
  }
}
