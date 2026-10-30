import { jest } from "@jest/globals";
import { InMemoryRepository } from "../src/repo/in-memory-repository.js";
import { LibraryService } from "../src/services/library-service.js";

describe("Parte 2 - NF01 e NF02", () => {
  let service;

  beforeEach(() => {
    service = new LibraryService(new InMemoryRepository());
  });

  describe("NF01 / HU10 - busca por título ou autor", () => {
    beforeEach(() => {
      service.registerBook("Dom Casmurro", "Machado de Assis", 2);
      service.registerBook("Memórias Póstumas de Brás Cubas", "Machado de Assis", 3);
      service.registerBook("Iracema", "José de Alencar", 1);
    });

    test("encontra o título exato", () => {
      expect(service.searchBooks("Dom Casmurro")).toEqual([
        expect.objectContaining({ title: "Dom Casmurro", author: "Machado de Assis", quantity: 2 })
      ]);
    });
    test("encontra parte do título ignorando maiúsculas e minúsculas", () => {
      expect(service.searchBooks("CASM")).toEqual([expect.objectContaining({ title: "Dom Casmurro" })]);
    });
    test("encontra todos os livros pelo autor completo", () => {
      expect(service.searchBooks("Machado de Assis").map(book => book.title))
        .toEqual(["Dom Casmurro", "Memórias Póstumas de Brás Cubas"]);
    });
    test("encontra parte do autor ignorando maiúsculas e minúsculas", () => {
      expect(service.searchBooks("aLeNc").map(book => book.title)).toEqual(["Iracema"]);
    });
    test("retorna lista vazia quando não encontra o termo", () => {
      expect(service.searchBooks("Python")).toEqual([]);
    });
    test.each(["", "   ", undefined, null, 42])("retorna lista vazia para termo vazio ou inválido %p", term => {
      expect(service.searchBooks(term)).toEqual([]);
    });
    test("busca em acervo vazio retorna lista vazia", () => {
      service = new LibraryService(new InMemoryRepository());
      expect(service.searchBooks("Machado")).toEqual([]);
    });
    test("um livro que corresponde em título e autor aparece só uma vez", () => {
      service.registerBook("Machado: biografia", "Machado de Assis", 1);
      expect(service.searchBooks("Machado").map(book => book.title))
        .toEqual(["Dom Casmurro", "Memórias Póstumas de Brás Cubas", "Machado: biografia"]);
    });
    test("retorna a disponibilidade atual sem modificar o acervo", () => {
      service.registerUser("u1", "Ana");
      service.borrowBook("u1", "Dom Casmurro", new Date("2026-03-01T10:00:00Z"));
      service.searchBooks("Casmurro").pop();
      expect(service.searchBooks("Casmurro")).toEqual([expect.objectContaining({ quantity: 1 })]);
      expect(service.listBooks()).toHaveLength(3);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
  });

  describe("NF02 / HU11 - datas dos empréstimos e devoluções", () => {
    beforeEach(() => {
      service.registerUser("u1", "Ana");
      service.registerBook("Dom Casmurro", "Machado de Assis", 2);
      service.registerBook("Iracema", "José de Alencar", 1);
    });

    function borrowAtFixedDate() {
      service.borrowBook("u1", "Dom Casmurro", new Date("2026-03-01T10:00:00Z"));
    }

    test("consulta a data exata do empréstimo ativo sem alterar listLoans", () => {
      borrowAtFixedDate();
      expect(service.listLoanDetails("u1")).toEqual([
        { title: "Dom Casmurro", borrowedAt: new Date("2026-03-01T10:00:00Z") }
      ]);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
      expect(service.listBooks()[0].quantity).toBe(1);
    });
    test("consulta detalhada de usuário sem empréstimos retorna lista vazia", () => {
      expect(service.listLoanDetails("u1")).toEqual([]);
    });
    test("consulta detalhada recusa usuário inexistente", () => {
      expect(() => service.listLoanDetails("ausente")).toThrow(new Error("Usuário não encontrado"));
    });
    test.each([
      ["2026-03-01T10:00:00Z", 0],
      ["2026-03-02T09:59:59.999Z", 0],
      ["2026-03-02T10:00:00Z", 1],
      ["2026-03-02T10:00:00.001Z", 1],
      ["2026-03-06T22:30:00Z", 5]
    ])("devolução em %s informa exatamente %i dias completos", (date, expectedDays) => {
      borrowAtFixedDate();
      const result = service.returnBook("u1", "DOM CASMURRO", new Date(date));
      expect(result).toEqual({
        title: "Dom Casmurro",
        borrowedAt: new Date("2026-03-01T10:00:00Z"),
        returnedAt: new Date(date),
        days: expectedDays
      });
      expect(service.listBooks()[0].quantity).toBe(2);
      expect(service.listLoans("u1")).toEqual([]);
      expect(service.listLoanDetails("u1")).toEqual([]);
    });
    test("conta intervalos de 24 horas mesmo atravessando mudança de fuso", () => {
      service.borrowBook("u1", "Dom Casmurro", new Date("2026-03-07T10:00:00-05:00"));
      const result = service.returnBook("u1", "Dom Casmurro", new Date("2026-03-08T10:00:00-04:00"));
      expect(result.days).toBe(0);
      expect(result.borrowedAt).toEqual(new Date("2026-03-07T15:00:00Z"));
      expect(result.returnedAt).toEqual(new Date("2026-03-08T14:00:00Z"));
    });
    test("recusa data de devolução anterior sem alterar estoque ou empréstimo", () => {
      borrowAtFixedDate();
      expect(() => service.returnBook("u1", "Dom Casmurro", new Date("2026-03-01T09:59:59.999Z")))
        .toThrow(new Error("Data de devolução inválida"));
      expect(service.listBooks()[0].quantity).toBe(1);
      expect(service.listLoanDetails("u1")).toEqual([
        { title: "Dom Casmurro", borrowedAt: new Date("2026-03-01T10:00:00Z") }
      ]);
    });
    test.each([new Date("inválida"), "2026-03-01", null])("recusa data de empréstimo inválida %p sem alterar estado", date => {
      expect(() => service.borrowBook("u1", "Dom Casmurro", date)).toThrow(new Error("Data de empréstimo inválida"));
      expect(service.listBooks()[0].quantity).toBe(2);
      expect(service.listLoanDetails("u1")).toEqual([]);
    });
    test.each([new Date("inválida"), "2026-03-02", null])("recusa data de devolução inválida %p sem alterar estado", date => {
      borrowAtFixedDate();
      expect(() => service.returnBook("u1", "Dom Casmurro", date)).toThrow(new Error("Data de devolução inválida"));
      expect(service.listBooks()[0].quantity).toBe(1);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
    test("cada empréstimo ativo preserva sua própria data e a devolução remove apenas o correspondente", () => {
      borrowAtFixedDate();
      service.borrowBook("u1", "Iracema", new Date("2026-03-02T10:00:00Z"));
      expect(service.listLoanDetails("u1")).toEqual([
        { title: "Dom Casmurro", borrowedAt: new Date("2026-03-01T10:00:00Z") },
        { title: "Iracema", borrowedAt: new Date("2026-03-02T10:00:00Z") }
      ]);
      service.returnBook("u1", "Dom Casmurro", new Date("2026-03-03T10:00:00Z"));
      expect(service.listLoanDetails("u1")).toEqual([
        { title: "Iracema", borrowedAt: new Date("2026-03-02T10:00:00Z") }
      ]);
      expect(service.listBooks().map(book => book.quantity)).toEqual([2, 0]);
    });
    test("alterar a Date recebida ou consultada não muda a data armazenada", () => {
      const date = new Date("2026-03-01T10:00:00Z");
      service.borrowBook("u1", "Dom Casmurro", date);
      date.setUTCFullYear(2000);
      const details = service.listLoanDetails("u1");
      details[0].borrowedAt.setUTCFullYear(2001);
      details[0].title = "Outro título";
      expect(service.listLoanDetails("u1")).toEqual([
        { title: "Dom Casmurro", borrowedAt: new Date("2026-03-01T10:00:00Z") }
      ]);
    });
    test("um novo empréstimo do mesmo título recebe a nova data", () => {
      borrowAtFixedDate();
      service.returnBook("u1", "Dom Casmurro", new Date("2026-03-02T10:00:00Z"));
      service.borrowBook("u1", "Dom Casmurro", new Date("2026-03-03T10:00:00Z"));
      expect(service.listLoanDetails("u1")).toEqual([
        { title: "Dom Casmurro", borrowedAt: new Date("2026-03-03T10:00:00Z") }
      ]);
      expect(service.listBooks()[0].quantity).toBe(1);
    });

    describe("compatibilidade das chamadas sem data", () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-03-01T10:00:00Z"));
      });
      afterEach(() => jest.useRealTimers());

      test("usa a data atual padrão no empréstimo e na devolução com relógio fixo", () => {
        expect(service.borrowBook("u1", "Dom Casmurro")).toBe(true);
        expect(service.listLoanDetails("u1")).toEqual([
          { title: "Dom Casmurro", borrowedAt: new Date("2026-03-01T10:00:00Z") }
        ]);
        jest.setSystemTime(new Date("2026-03-04T10:00:00Z"));
        expect(service.returnBook("u1", "Dom Casmurro")).toEqual({
          title: "Dom Casmurro",
          borrowedAt: new Date("2026-03-01T10:00:00Z"),
          returnedAt: new Date("2026-03-04T10:00:00Z"),
          days: 3
        });
        expect(service.listBooks()[0].quantity).toBe(2);
        expect(service.listLoans("u1")).toEqual([]);
      });
    });
  });
});
