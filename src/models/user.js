// models/user.js
export class User {
  constructor(id, name) {
    if (!id) throw new Error("Identificador inválido");
    this.id = id;
    this.name = name || "";
    // Cada título ativo tem a sua data de empréstimo.
    this.loans = new Map();
  }

  borrow(title, date) {
    this.loans.set(title, new Date(date.getTime()));
  }

  hasBorrowed(title) {
    return this.loans.has(title);
  }

  return(title) {
    this.loans.delete(title);
  }

  loanCount() {
    return this.loans.size;
  }

  listLoans() {
    return Array.from(this.loans.keys());
  }

  listLoanDetails() {
    return Array.from(this.loans, ([title, date]) => ({
      title,
      borrowedAt: new Date(date.getTime())
    }));
  }
}
