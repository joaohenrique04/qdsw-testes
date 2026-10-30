// ui/console-ui.js
import promptSync from "prompt-sync";

export const prompt = promptSync({ sigint: true });

export function showMenu() {
  console.log("\n=== R Book Lib ===");
  console.log("1. Cadastrar livro");
  console.log("2. Listar livros");
  console.log("3. Remover livro");
  console.log("4. Cadastrar usuário");
  console.log("5. Listar usuários");
  console.log("6. Emprestar livro");
  console.log("7. Devolver livro");
  console.log("8. Listar empréstimos de usuário");
  console.log("9. Buscar livros por título ou autor");
  console.log("10. Consultar empréstimos com datas");
  console.log("0. Sair");
  return prompt("Escolha uma opção: ");
}

export function pause() {
  prompt("Enter para continuar...");
}
