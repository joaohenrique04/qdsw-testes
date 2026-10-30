// app.js — ponto de entrada (interface de console)
import { InMemoryRepository } from "./repo/in-memory-repository.js";
import { LibraryService } from "./services/library-service.js";
import * as ui from "./ui/console-ui.js";

const repo = new InMemoryRepository();
const service = new LibraryService(repo);

function run() {
  let opt;
  do {
    opt = ui.showMenu();

    try {
      switch (opt) {
        case "1": {
          const title = ui.prompt("Título: ");
          const author = ui.prompt("Autor: ");
          const quantityInput = ui.prompt("Quantidade (1 a 5, Enter = 1): ");
          const q = quantityInput.trim() === "" ? undefined : Number(quantityInput);
          service.registerBook(title, author, q);
          console.log("Livro cadastrado.");
          break;
        }
        case "2": {
          const books = service.listBooks();
          if (books.length === 0) {
            console.log("Nenhum livro cadastrado.");
            break;
          }
          console.log("Livros cadastrados:");
          books.forEach(b => {
            console.log(`${b.title} - ${b.author} | Disponível: ${b.quantity}`);
          });
          break;
        }
        case "3": {
          const title = ui.prompt("Título a remover: ");
          service.removeBook(title);
          console.log("Livro removido.");
          break;
        }
        case "4": {
          const id = ui.prompt("ID do usuário: ");
          const name = ui.prompt("Nome: ");
          service.registerUser(id, name);
          console.log("Usuário cadastrado.");
          break;
        }
        case "5": {
          const users = service.listUsers();
          if (users.length === 0) {
            console.log("Nenhum usuário cadastrado.");
            break;
          }
          console.log("Usuários:");
          users.forEach(u => {
            console.log(`${u.id} - ${u.name}`);
          });
          break;
        }
        case "6": {
          const userId = ui.prompt("ID do usuário: ");
          const title = ui.prompt("Título do livro: ");
          service.borrowBook(userId, title);
          console.log("Empréstimo realizado.");
          break;
        }
        case "7": {
          const userId = ui.prompt("ID do usuário: ");
          const title = ui.prompt("Título do livro: ");
          const result = service.returnBook(userId, title);
          console.log("Devolução realizada.");
          console.log(`Empréstimo: ${result.borrowedAt.toISOString()}`);
          console.log(`Devolução: ${result.returnedAt.toISOString()}`);
          console.log(`Dias completos de empréstimo: ${result.days}`);
          break;
        }
        case "8": {
          const userId = ui.prompt("ID do usuário: ");
          const loans = service.listLoans(userId);
          console.log(`Empréstimos de ${userId}: ${loans.join(", ") || "(nenhum)"}`);
          break;
        }
        case "9": {
          const term = ui.prompt("Parte do título ou autor: ");
          const books = service.searchBooks(term);
          if (books.length === 0) {
            console.log("Nenhum resultado encontrado");
            break;
          }
          books.forEach(book => {
            console.log(`${book.title} - ${book.author} | Disponível: ${book.quantity}`);
          });
          break;
        }
        case "10": {
          const userId = ui.prompt("ID do usuário: ");
          const loans = service.listLoanDetails(userId);
          if (loans.length === 0) {
            console.log("(nenhum)");
            break;
          }
          loans.forEach(loan => {
            console.log(`${loan.title} | Empréstimo: ${loan.borrowedAt.toISOString()}`);
          });
          break;
        }
        case "0":
          console.log("Até logo!");
          break;
        default:
          console.log("Opção inválida.");
      }
    } catch (err) {
      console.log("Erro:", err.message);
    }

    if (opt !== "0") ui.pause();
  } while (opt !== "0");
}

run();
