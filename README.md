# R Book Lib - atividade de Qualidade de Software

**Integrantes:** João Henrique, José Gouveia e Luiz Cláudio.

Sistema de biblioteca em console, com armazenamento em memória. A atividade foi desenvolvida a partir dos cinco documentos, na ordem de 0 a 4. Inclui as regras RN01 a RN08 e as duas evoluções exigidas: **NF02 / HU11 (datas)** e **NF01 / HU10 (busca)**.

## Instalação e execução

Use **Node.js 22**, versão utilizada na validação (22.21.0, com npm 10.9.4). O Jest instalado declara suporte a Node `^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0`.

```bash
npm install
npm test
npm run coverage
npm start
```

Execute na pasta que contém `package.json`. O sistema precisa de um terminal interativo para ler o teclado. Os dados são perdidos ao encerrar.

## O que foi desenvolvido

- 57 casos de teste das regras originais, agrupados por RN01 a RN08.
- 33 casos das evoluções NF01 e NF02, totalizando **90 testes**.
- Correção de três defeitos confirmados pelos testes no código original: máximo de cinco exemplares, limite de devolução igual ao total cadastrado e validação do título antes da busca.
- Busca por título ou autor, exata ou parcial, ignorando maiúsculas e minúsculas.
- Registro da data de cada empréstimo, consulta dos empréstimos ativos com datas e devolução com cálculo de dias completos de 24 horas.
- Validação de datas inválidas e de devolução anterior ao empréstimo, antes de modificar o estado.
- Relatório com defeitos, testabilidade, cobertura e limitações; evidências reais das execuções.

Resultado medido: **100% das linhas e 98,48% dos ramos**. O único ramo não executado é o valor padrão do construtor `Book`, pois o serviço já fornece a quantidade padrão. A explicação está no relatório.

## Menu e novas funcionalidades

As opções 1 a 8 continuam disponíveis. As evoluções foram integradas ao console:

| Opção | Uso |
|---|---|
| 1 | Cadastrar livro: quantidade de 1 a 5; Enter usa 1 |
| 7 | Devolver: exibe data do empréstimo, data da devolução e dias completos |
| 9 | Buscar livros por parte do título ou do autor |
| 10 | Consultar empréstimos ativos com as respectivas datas |
| 0 | Encerrar |

Busca sem resultados exibe `Nenhum resultado encontrado`. As datas aparecem no formato ISO 8601 em UTC, com sufixo `Z`.

## API das evoluções

```javascript
const service = new LibraryService(new InMemoryRepository());
service.registerBook("Dom Casmurro", "Machado de Assis", 2);
service.registerUser("u1", "Ana");

service.searchBooks("machado"); // array de livros
service.borrowBook("u1", "Dom Casmurro", new Date("2026-03-01T10:00:00Z"));
service.listLoans("u1"); // ["Dom Casmurro"], contrato preservado
service.listLoanDetails("u1");
// [{ title: "Dom Casmurro", borrowedAt: Date("2026-03-01T10:00:00Z") }]

service.returnBook("u1", "Dom Casmurro", new Date("2026-03-04T22:00:00Z"));
// { title: "Dom Casmurro", borrowedAt: Date, returnedAt: Date, days: 3 }
```

`borrowBook(userId, title, date = new Date())` e `returnBook(userId, title, date = new Date())` aceitam uma `Date` válida. As chamadas sem data continuam funcionando. `borrowBook` continua retornando `true`; `returnBook` agora retorna o resumo da devolução para atender à HU11. `listLoans` continua retornando somente os títulos.

`searchBooks(term = "")` devolve um array, com os dados atuais dos livros. Termos vazios, só com espaços ou não textuais retornam `[]`. Espaços nas extremidades do termo são removidos. A comparação ignora caixa; não remove acentos.

## Testes e evidências

| Comando | Finalidade |
|---|---|
| `npm test` | Executar os 90 testes |
| `npm test -- -t "rejeita seis exemplares"` | Executar um caso isolado |
| `npm test -- --randomize --seed=271828 --showSeed` | Conferir independência em ordem aleatória reproduzível |
| `npm run coverage` | Medir cobertura e exigir mínimo de 90% de linhas e ramos |

O relatório visual de cobertura é gerado em `coverage/lcov-report/index.html`. Essa pasta é regenerável e fica fora do ZIP de entrega. A tabela e os resultados textuais estão em `evidencias/`.

```text
src/
  app.js                         Ponto de entrada e integração com o console
  ui/console-ui.js               Menu e leitura do teclado
  models/book.js                 Livro e validação dos exemplares
  models/user.js                 Usuário e empréstimos ativos com datas
  repo/in-memory-repository.js   Armazenamento em memória
  services/library-service.js    Regras de negócio e API das evoluções
tests/
  library-service.test.js        RN01 a RN08: 57 casos
  library-evolutions.test.js     NF01 e NF02: 33 casos
evidencias/                      Saídas das validações
relatorio.md                     Respostas das quatro partes do relatório
package-lock.json                Versões das dependências para reprodução
```

Os testes acessam as regras pelo `LibraryService`, sem importar a interface. Cada caso cria um repositório novo; os casos com data usam valores fixos. O relógio também é fixado ao verificar os parâmetros padrão, evitando dependência do dia da execução.

## Entrega

O arquivo `entrega/r-book-lib-joao-henrique-jose-gouveia-luiz-claudio.zip` contém código, testes, relatório, documentação, evidências e os PDFs de referência. Não inclui `node_modules`, cache, arquivos temporários ou a pasta regenerável de cobertura. Após extrair, execute `npm install` e `npm test` dentro de `r-book-lib/`.

O pacote foi conferido em uma pasta independente, com nova instalação das dependências e os 90 testes aprovados.
