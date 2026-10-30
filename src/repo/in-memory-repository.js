// repo/in-memory-repository.js
// Repositório simples em memória que guarda livros e usuários
export class InMemoryRepository {
  constructor() {
    this.books = []; // array de Book
    this.users = []; // array de User
  }

  // Books
  addBook(book) {
    this.books.push(book);
  }

  findBook(title) {
    return this.books.find(b => b.title.toLowerCase() === title.toLowerCase());
  }

  removeBook(title) {
    const before = this.books.length;
    this.books = this.books.filter(b => b.title.toLowerCase() !== title.toLowerCase());
    return this.books.length !== before;
  }

  listBooks() {
    return this.books.slice();
  }

  // Users
  addUser(user) {
    this.users.push(user);
  }

  findUser(id) {
    return this.users.find(u => u.id === id);
  }

  listUsers() {
    return this.users.slice();
  }
}
