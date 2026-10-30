import { jest } from "@jest/globals";
import { InMemoryRepository } from "../src/repo/in-memory-repository.js";
import { LibraryService } from "../src/services/library-service.js";

describe("Parte 1 - regras do LibraryService", () => {
  let service;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-01T10:00:00Z"));
    service = new LibraryService(new InMemoryRepository());
  });
  afterEach(() => jest.useRealTimers());

  function prepareLoan(quantity = 2) {
    const book = service.registerBook("Dom Casmurro", "Machado de Assis", quantity);
    service.registerUser("u1", "Ana");
    service.borrowBook("u1", "Dom Casmurro");
    return book;
  }

  function prepareThreeLoans() {
    service.registerUser("u1", "Ana");
    service.registerBook("Livro A", "Autor A");
    service.registerBook("Livro B", "Autor B");
    service.registerBook("Livro C", "Autor C");
    service.registerBook("Livro D", "Autor D");
    service.borrowBook("u1", "Livro A");
    service.borrowBook("u1", "Livro B");
    service.borrowBook("u1", "Livro C");
  }

  describe("RN01 - cadastro único e título obrigatório", () => {
    test("cadastra títulos distintos e lista título, autor e quantidade", () => {
      service.registerBook("Dom Casmurro", "Machado de Assis", 2);
      service.registerBook("Iracema", "José de Alencar", 1);
      expect(service.listBooks()).toEqual([
        expect.objectContaining({ title: "Dom Casmurro", author: "Machado de Assis", quantity: 2 }),
        expect.objectContaining({ title: "Iracema", author: "José de Alencar", quantity: 1 })
      ]);
    });
    test.each(["Dom Casmurro", "DOM CASMURRO", "dom casmurro"])("rejeita título duplicado %s sem alterar o acervo", title => {
      service.registerBook("Dom Casmurro", "Machado de Assis", 2);
      expect(() => service.registerBook(title, "Outro autor", 1)).toThrow(new Error("Livro já existe na biblioteca"));
      expect(service.listBooks()).toEqual([expect.objectContaining({ title: "Dom Casmurro", quantity: 2 })]);
    });
    test.each([undefined, null, "", 42])("rejeita título inválido %p com acervo vazio", title => {
      expect(() => service.registerBook(title, "Autor", 1)).toThrow(new Error("Título inválido"));
      expect(service.listBooks()).toEqual([]);
    });
    test.each([undefined, null, 42])("rejeita título inválido %p com acervo preenchido", title => {
      service.registerBook("Iracema", "José de Alencar");
      expect(() => service.registerBook(title, "Autor", 1)).toThrow(new Error("Título inválido"));
      expect(service.listBooks()).toHaveLength(1);
    });
    test("usa autor Desconhecido quando o autor é omitido", () => {
      const book = service.registerBook("Livro sem autor");
      expect(book).toEqual(expect.objectContaining({ title: "Livro sem autor", author: "Desconhecido", quantity: 1 }));
      expect(service.listBooks()).toEqual([book]);
    });
  });

  describe("RN02 - limites de exemplares", () => {
    test.each([1, 5])("aceita o limite de %i exemplares", quantity => {
      const book = service.registerBook("Iracema", "José de Alencar", quantity);
      expect(book.quantity).toBe(quantity);
      expect(book.originalQuantity).toBe(quantity);
      expect(service.listBooks()).toEqual([book]);
    });
    test("usa um exemplar quando a quantidade é omitida", () => {
      service.registerBook("Iracema", "José de Alencar");
      expect(service.listBooks()).toEqual([expect.objectContaining({ quantity: 1, originalQuantity: 1 })]);
    });
    test.each([0, -1, 1.5, "2", NaN, Infinity, null])("rejeita quantidade não positiva ou não inteira %p", quantity => {
      expect(() => service.registerBook("Iracema", "José de Alencar", quantity)).toThrow(new Error("Quantidade deve ser positiva"));
      expect(service.listBooks()).toEqual([]);
    });
    test("rejeita seis exemplares, primeiro inteiro acima do máximo", () => {
      expect(() => service.registerBook("Iracema", "José de Alencar", 6)).toThrow(new Error("Quantidade máxima é 5 exemplares"));
      expect(service.listBooks()).toEqual([]);
    });
    test.each([1, 5])("devolução restaura exatamente os %i exemplares cadastrados", quantity => {
      prepareLoan(quantity);
      service.returnBook("u1", "Dom Casmurro");
      expect(service.listBooks()[0].quantity).toBe(quantity);
      expect(service.listLoans("u1")).toEqual([]);
    });
    test("recusa devolução que ultrapassaria o total original mesmo abaixo de cinco", () => {
      const book = prepareLoan(2);
      // Estado inconsistente intencional para exercitar a guarda defensiva da RN02.
      book.quantity = 2;
      expect(() => service.returnBook("u1", "Dom Casmurro")).toThrow(new Error("Quantidade máxima atingida"));
      expect(book.quantity).toBe(2);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
    test("recusa devolução acima de cinco e mantém o empréstimo", () => {
      const book = prepareLoan(5);
      book.quantity = 5;
      expect(() => service.returnBook("u1", "Dom Casmurro")).toThrow(new Error("Quantidade máxima atingida"));
      expect(book.quantity).toBe(5);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
  });

  describe("RN03 - identificador único e obrigatório", () => {
    test("cadastra usuários distintos e lista os dados", () => {
      service.registerUser("u1", "Ana");
      service.registerUser("u2", "Beto");
      expect(service.listUsers()).toEqual([
        expect.objectContaining({ id: "u1", name: "Ana" }),
        expect.objectContaining({ id: "u2", name: "Beto" })
      ]);
    });
    test("cadastra usuário sem nome com nome vazio", () => {
      const user = service.registerUser("u1");
      expect(user.name).toBe("");
      expect(service.listUsers()).toEqual([user]);
      expect(service.listLoans("u1")).toEqual([]);
    });
    test.each([undefined, null, ""])("recusa identificador ausente %p", id => {
      expect(() => service.registerUser(id, "Ana")).toThrow(new Error("Identificador inválido"));
      expect(service.listUsers()).toEqual([]);
    });
    test("recusa identificador duplicado e preserva o usuário original", () => {
      service.registerUser("u1", "Ana");
      expect(() => service.registerUser("u1", "Beto")).toThrow(new Error("Usuário já cadastrado"));
      expect(service.listUsers()).toEqual([expect.objectContaining({ id: "u1", name: "Ana" })]);
    });
  });

  describe("RN04 - no máximo três empréstimos simultâneos", () => {
    test("aceita o terceiro empréstimo e reduz os três estoques", () => {
      prepareThreeLoans();
      expect(service.listLoans("u1")).toEqual(["Livro A", "Livro B", "Livro C"]);
      expect(service.listBooks().map(book => book.quantity)).toEqual([0, 0, 0, 1]);
    });
    test("recusa o quarto empréstimo sem alterar o estoque ou a lista", () => {
      prepareThreeLoans();
      expect(() => service.borrowBook("u1", "Livro D")).toThrow(new Error("Usuário atingiu o limite de empréstimos (3)"));
      expect(service.listLoans("u1")).toEqual(["Livro A", "Livro B", "Livro C"]);
      expect(service.listBooks()[3].quantity).toBe(1);
    });
    test("libera uma vaga após devolver um dos três livros", () => {
      prepareThreeLoans();
      service.returnBook("u1", "Livro B");
      service.borrowBook("u1", "Livro D");
      expect(service.listLoans("u1")).toEqual(["Livro A", "Livro C", "Livro D"]);
      expect(service.listBooks().map(book => book.quantity)).toEqual([0, 1, 0, 0]);
    });
  });

  describe("RN05 - proibição de empréstimo duplicado", () => {
    test("aceita o primeiro empréstimo e registra o título canônico", () => {
      service.registerBook("Dom Casmurro", "Machado de Assis", 2);
      service.registerUser("u1", "Ana");
      expect(service.borrowBook("u1", "DOM CASMURRO")).toBe(true);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
      expect(service.listBooks()[0].quantity).toBe(1);
    });
    test("recusa duplicação ignorando caixa mesmo com exemplar disponível", () => {
      prepareLoan(2);
      expect(() => service.borrowBook("u1", "DOM CASMURRO")).toThrow(new Error("Usuário já tem esse livro emprestado"));
      expect(service.listBooks()[0].quantity).toBe(1);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
    test("permite que outro usuário pegue o segundo exemplar", () => {
      prepareLoan(2);
      service.registerUser("u2", "Beto");
      service.borrowBook("u2", "Dom Casmurro");
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
      expect(service.listLoans("u2")).toEqual(["Dom Casmurro"]);
      expect(service.listBooks()[0].quantity).toBe(0);
    });
    test("permite pegar o mesmo título novamente após devolução", () => {
      prepareLoan();
      service.returnBook("u1", "Dom Casmurro");
      service.borrowBook("u1", "Dom Casmurro");
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
      expect(service.listBooks()[0].quantity).toBe(1);
    });
  });

  describe("RN06 - remoção somente sem empréstimos ativos", () => {
    test("remove título ignorando caixa e preserva os outros livros", () => {
      service.registerBook("Dom Casmurro", "Machado de Assis", 2);
      service.registerBook("Iracema", "José de Alencar");
      expect(service.removeBook("DOM CASMURRO")).toBe(true);
      expect(service.listBooks()).toEqual([expect.objectContaining({ title: "Iracema", quantity: 1 })]);
    });
    test("recusa remoção com um exemplar emprestado mesmo havendo outro disponível", () => {
      prepareLoan(2);
      expect(() => service.removeBook("Dom Casmurro")).toThrow(new Error("Não é possível remover: há exemplares emprestados"));
      expect(service.listBooks()).toEqual([expect.objectContaining({ title: "Dom Casmurro", quantity: 1 })]);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
    test("permite remover depois de todos os exemplares serem devolvidos", () => {
      prepareLoan();
      service.returnBook("u1", "Dom Casmurro");
      expect(service.removeBook("Dom Casmurro")).toBe(true);
      expect(service.listBooks()).toEqual([]);
    });
  });

  describe("RN07 - devolução de livro emprestado ao próprio usuário", () => {
    test("devolve usando título em outra caixa, incrementa estoque e limpa a lista", () => {
      prepareLoan();
      service.returnBook("u1", "DOM CASMURRO");
      expect(service.listBooks()[0].quantity).toBe(2);
      expect(service.listLoans("u1")).toEqual([]);
    });
    test("recusa devolução por outro usuário e preserva o empréstimo original", () => {
      prepareLoan();
      service.registerUser("u2", "Beto");
      expect(() => service.returnBook("u2", "Dom Casmurro")).toThrow(new Error("Usuário não emprestou este livro"));
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
      expect(service.listLoans("u2")).toEqual([]);
      expect(service.listBooks()[0].quantity).toBe(1);
    });
    test("recusa uma segunda devolução do mesmo empréstimo", () => {
      prepareLoan();
      service.returnBook("u1", "Dom Casmurro");
      expect(() => service.returnBook("u1", "Dom Casmurro")).toThrow(new Error("Usuário não emprestou este livro"));
      expect(service.listBooks()[0].quantity).toBe(2);
      expect(service.listLoans("u1")).toEqual([]);
    });
  });

  describe("RN08 - existência e disponibilidade", () => {
    test("inicia com listagens vazias", () => {
      expect(service.listBooks()).toEqual([]);
      expect(service.listUsers()).toEqual([]);
    });
    test("empresta o último exemplar disponível a usuário existente", () => {
      prepareLoan(1);
      expect(service.listBooks()[0].quantity).toBe(0);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
    test("recusa empréstimo sem exemplares disponíveis para outro usuário", () => {
      prepareLoan(1);
      service.registerUser("u2", "Beto");
      expect(() => service.borrowBook("u2", "Dom Casmurro")).toThrow(new Error("Nenhum exemplar disponível"));
      expect(service.listLoans("u2")).toEqual([]);
      expect(service.listBooks()[0].quantity).toBe(0);
    });
    test("recusa empréstimo para usuário inexistente", () => {
      service.registerBook("Iracema", "José de Alencar");
      expect(() => service.borrowBook("ausente", "Iracema")).toThrow(new Error("Usuário não encontrado"));
      expect(service.listBooks()[0].quantity).toBe(1);
    });
    test("recusa empréstimo de livro inexistente", () => {
      service.registerUser("u1", "Ana");
      expect(() => service.borrowBook("u1", "ausente")).toThrow(new Error("Livro não encontrado"));
      expect(service.listLoans("u1")).toEqual([]);
    });
    test("recusa devolução por usuário inexistente", () => {
      service.registerBook("Iracema", "José de Alencar");
      expect(() => service.returnBook("ausente", "Iracema")).toThrow(new Error("Usuário não encontrado"));
      expect(service.listBooks()[0].quantity).toBe(1);
    });
    test("recusa devolução de livro inexistente", () => {
      service.registerUser("u1", "Ana");
      expect(() => service.returnBook("u1", "ausente")).toThrow(new Error("Livro não encontrado"));
      expect(service.listLoans("u1")).toEqual([]);
    });
    test("recusa remoção de livro inexistente", () => {
      expect(() => service.removeBook("ausente")).toThrow(new Error("Livro não encontrado"));
      expect(service.listBooks()).toEqual([]);
    });
    test("recusa consulta de empréstimos de usuário inexistente", () => {
      expect(() => service.listLoans("ausente")).toThrow(new Error("Usuário não encontrado"));
    });
    test("lista todos e somente os empréstimos ainda ativos", () => {
      prepareThreeLoans();
      service.returnBook("u1", "Livro B");
      expect(service.listLoans("u1")).toEqual(["Livro A", "Livro C"]);
    });
    test("alterar arrays devolvidos pelas consultas não remove registros internos", () => {
      prepareLoan();
      service.listBooks().pop();
      service.listUsers().pop();
      service.listLoans("u1").pop();
      expect(service.listBooks()).toHaveLength(1);
      expect(service.listUsers()).toHaveLength(1);
      expect(service.listLoans("u1")).toEqual(["Dom Casmurro"]);
    });
  });
});
