# Relatório - Testes no R Book Lib

**Disciplina:** Qualidade de Software - IFAL / Campus Maceió.

**Integrantes:**

1. João Henrique
2. José Gouveia

**Evoluções implementadas:** NF02 / HU11 (datas de empréstimo e devolução) e NF01 / HU10 (busca por título parcial ou autor).

**Data da validação:** 25/10/2026.

**Ambiente:** Windows, Node.js 22.21.0, npm 10.9.4, Jest e prompt-sync nas versões registradas em `package-lock.json`.

**Resultado final de `npm test`:**

```text
Test Suites: 2 passed, 2 total
Tests:       90 passed, 90 total
```

São 57 casos das regras originais e 33 casos das evoluções, contabilizando separadamente as entradas de `test.each`. O projeto também passou com ordem aleatória (semente 271828). O caso `rejeita seis exemplares, primeiro inteiro acima do máximo` passou isoladamente.

Os documentos foram analisados nesta ordem:

| Documento | Uso no desenvolvimento |
|---|---|
| `0-atividade-RBL.pdf` | Quatro partes, qualidade dos testes, escolha de duas evoluções, meta de cobertura e formato da entrega |
| `1-descricao-rbl.pdf` | Referência para RN01 a RN08, contratos dos métodos e mensagens de erro |
| `2-historias-usuarios-rbl.pdf` | Conferência dos critérios HU01 a HU09 e do fluxo de operação |
| `3-evolucoes-rbl.pdf` | Seleção de NF02, obrigatória com data, e NF01, de livre escolha |
| `4-historias-usuarios-evolucoes-rbl.pdf` | Casos de aceitação HU10 e HU11 e limites do cálculo de dias |

## 1. Defeitos encontrados

Antes de alterar `src/`, a suíte da Parte 1 foi executada no código original com `npm test -- --runInBand --runTestsByPath tests/library-service.test.js`. Resultado: **5 falhas e 52 sucessos, em 57 casos**. As cinco falhas revelaram os três defeitos abaixo; três falhas são variações do mesmo defeito de validação de título. A saída foi preservada em `evidencias/testes-antes-correcoes.txt`.

| Regra | Teste que revela o defeito (nome e arquivo) | Comportamento esperado | Comportamento obtido no original | Correção feita (arquivo e resumo) |
|---|---|---|---|---|
| RN01 / HU01, título obrigatório | `rejeita título inválido %p com acervo preenchido`, em `tests/library-service.test.js`, com `undefined`, `null` e `42` | Lançar `Título inválido`, preservando o acervo | Com livros já cadastrados, a busca chamava `toLowerCase()` antes de validar. Gerava TypeError: leitura de `toLowerCase` de undefined/null ou `title.toLowerCase is not a function` | `src/services/library-service.js`, linhas 11 a 18: construir e validar `Book` antes de consultar duplicidade |
| RN02 / HU01, máximo de exemplares | `rejeita seis exemplares, primeiro inteiro acima do máximo`, em `tests/library-service.test.js` | Lançar `Quantidade máxima é 5 exemplares`, sem cadastrar | Aceitava seis exemplares; a função não lançava erro | `src/models/book.js`, linha 6: rejeitar quantidade inteira superior a 5 |
| RN02 / HU07, teto da devolução | `recusa devolução que ultrapassaria o total original mesmo abaixo de cinco`, em `tests/library-service.test.js` | Lançar `Quantidade máxima atingida`, sem alterar quantidade nem empréstimo | Com quantidade original 2 e disponível artificialmente em 2, permitia passar a 3 e retirava o empréstimo, pois comparava apenas com o número fixo 5 | `src/services/library-service.js`, linha 89: comparar a próxima quantidade com `book.originalQuantity` |

O terceiro teste prepara um **estado inconsistente intencional**: registra dois exemplares, empresta um e ajusta a quantidade disponível do objeto para dois. Esse estado não é produzido pelo fluxo válido do serviço; é necessário para verificar diretamente a guarda defensiva de RN02, pois RN07 já impede uma segunda devolução normal. O teste preserva esse propósito e não usa um comportamento incorreto como resultado esperado.

O caso de seis exemplares testa somente o primeiro inteiro acima do máximo. Quantidades zero, negativas, fracionárias e não numéricas têm casos separados com `Quantidade deve ser positiva`. Duplicidade, falta de estoque e limite de empréstimos também são provocados separadamente, sem depender de prioridade entre erros simultâneos.

### Conferência de RN01 a RN08

Todos os casos abaixo estão em `tests/library-service.test.js`, em blocos `describe` identificados pela regra.

| Regra | Caso válido / estado verificado | Caso inválido / limite verificado |
|---|---|---|
| RN01 | `cadastra títulos distintos e lista título, autor e quantidade`; autor omitido vira `Desconhecido` | Duplicidade com caixas diferentes; título ausente ou não textual em acervo vazio e preenchido |
| RN02 | Cadastro de 1 e 5; padrão 1; devolução restaura exatamente 1 ou 5 | 0, -1, 1.5, texto, NaN, Infinity, null e 6; teto original na devolução |
| RN03 | Usuários distintos na listagem; nome opcional vazio | ID ausente e ID repetido, preservando o usuário original |
| RN04 | `aceita o terceiro empréstimo e reduz os três estoques`; devolução libera vaga | `recusa o quarto empréstimo sem alterar o estoque ou a lista` |
| RN05 | Primeiro empréstimo; outro usuário usa outro exemplar; novo empréstimo após devolução | Duplicação pelo mesmo usuário, com caixa diferente e estoque ainda disponível |
| RN06 | Remoção sem empréstimo; remoção após devolução; preservação dos demais títulos | Remoção recusada mesmo com outro exemplar disponível |
| RN07 | Devolução incrementa estoque e limpa empréstimo, inclusive com título em outra caixa | Devolução por outro usuário e segunda devolução do mesmo empréstimo |
| RN08 | Último exemplar pode ser emprestado; listagens vazias e consultas de empréstimos ativos | Estoque zero; usuário ou livro inexistente nas operações que exigem cada entidade |

**Ajuste adicional na interface:** em `src/app.js`, linhas 19 e 20, a quantidade passa a usar `Number()`; uma entrada vazia deixa o serviço aplicar o padrão 1. O `parseInt` anterior truncava, por exemplo, `1.5` para `1`, mascarando a RN02. Esse ajuste foi identificado na revisão do console, não pelos testes de unidade, que não importam a interface.

## 2. Testabilidade

### a) Dependência de data e controle nos testes

A NF02 precisa do instante atual para registrar empréstimos e devoluções. Consultar exclusivamente o relógio do computador dentro da regra tornaria o resultado variável a cada execução. A dependência passou a ser recebida pelo último parâmetro dos dois métodos:

```javascript
borrowBook(userId, title, date = new Date())
returnBook(userId, title, date = new Date())
```

As assinaturas estão em `src/services/library-service.js`, linhas 58 e 80. O console omite a data e usa o instante atual; os testes passam objetos `Date` fixos.

Em `tests/library-evolutions.test.js`, o teste parametrizado `devolução em %s informa exatamente %i dias completos` usa empréstimo em `2026-03-01T10:00:00Z` e verifica:

| Devolução | Dias completos esperados |
|---|---:|
| `2026-03-01T10:00:00Z` | 0 |
| `2026-03-02T09:59:59.999Z` | 0 |
| `2026-03-02T10:00:00Z` | 1 |
| `2026-03-02T10:00:00.001Z` | 1 |
| `2026-03-06T22:30:00Z` | 5 |

O cálculo em `src/services/library-service.js`, linha 101, usa `Math.floor(diferençaEmMilissegundos / 86_400_000)`. Assim, conta intervalos completos de 24 horas, sem arredondar para cima e sem depender da virada de um dia civil. O teste `conta intervalos de 24 horas mesmo atravessando mudança de fuso` verifica que 23 horas correspondem a zero dias, mesmo com horários locais iguais em datas consecutivas.

O teste `recusa data de devolução anterior sem alterar estoque ou empréstimo` verifica a mensagem exata `Data de devolução inválida` e a preservação do estado. Há casos adicionais para `Invalid Date`, texto e null. Essas validações ocorrem antes de modificar o estoque ou excluir o empréstimo.

O teste `usa a data atual padrão no empréstimo e na devolução com relógio fixo` usa `jest.useFakeTimers()` e `jest.setSystemTime()` para verificar chamadas sem o terceiro argumento. O relógio é restaurado em `afterEach`. A suíte da Parte 1 também fixa o relógio, portanto seus empréstimos e devoluções continuam determinísticos depois da evolução. Nenhum teste depende da data real do computador.

O modelo `User` passou de `Set` para `Map<título, Date>`. `listLoans()` preserva a lista de títulos; `listLoanDetails()` oferece a consulta detalhada. A devolução agora retorna `{ title, borrowedAt, returnedAt, days }`. As datas de entrada e consulta são copiadas para evitar alteração acidental do registro; isso é verificado por `alterar a Date recebida ou consultada não muda a data armazenada`.

### b) Separação já existente no projeto original

No **código original**, `LibraryService.borrowBook(userId, title)` já consultava o repositório, verificava estoque, limite de três empréstimos e duplicidade e, só depois, decrementava `book.quantity` e chamava `user.borrow(book.title)`. O método não lia teclado nem chamava `console.log`; a leitura e a mensagem de confirmação ficavam no `case "6"` de `src/app.js`.

O construtor `LibraryService(repository)` já recebia o armazenamento de fora. Por isso, cada `beforeEach` pôde criar `new LibraryService(new InMemoryRepository())`, sem abrir o console, simular teclado ou usar banco de dados. O teste `recusa o quarto empréstimo sem alterar o estoque ou a lista` chama diretamente o serviço e verifica a mensagem e o estado, demonstrando essa vantagem concreta da separação original.

As preparações recorrentes da Parte 1 usam `prepareLoan()` e `prepareThreeLoans()`. Os testes são agrupados com `describe`, têm nomes de comportamento, expectativas explícitas e não contêm `if`, `for` ou `try/catch`.

### Critérios de aceitação das evoluções

| História | Critério | Evidência em `tests/library-evolutions.test.js` |
|---|---|---|
| HU10 / NF01 | Busca exata, parcial e por autor | `encontra o título exato`, `encontra parte do título ignorando maiúsculas e minúsculas`, `encontra todos os livros pelo autor completo` |
| HU10 / NF01 | Ignorar maiúsculas e minúsculas | Busca de `CASM` no título e `aLeNc` no autor |
| HU10 / NF01 | Nenhum resultado e termo vazio retornam `[]` | Casos com `Python`, termo vazio, espaços, parâmetro omitido e acervo vazio |
| HU11 / NF02 | Receber data com padrão atual; manter chamadas sem data | Teste com relógio fixo e assinaturas com `date = new Date()` |
| HU11 / NF02 | Consultar a data de cada empréstimo ativo | `consulta a data exata do empréstimo ativo sem alterar listLoans`; dois empréstimos com datas diferentes |
| HU11 / NF02 | Devolução informar as duas datas e os dias completos | Cinco casos parametrizados com objeto de retorno e estado final exatos |
| HU11 / NF02 | Menos de 24 horas vale zero; limite de 24 horas | Casos com 23h59min59,999s, 24h e 24h mais 1ms |
| HU11 / NF02 | Recusar data anterior | Erro exato e empréstimo preservado |

A exibição de `Nenhum resultado encontrado` e das datas ficou no console, nas opções 9, 10 e 7. Foi conferida manualmente, separadamente da suíte de unidade.

## 3. Cobertura

Saída real de `npm run coverage`, também preservada em `evidencias/cobertura.txt`:

```text
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------|---------|----------|---------|---------|-------------------
All files                 |     100 |    98.48 |     100 |     100 |
 models                   |     100 |    94.11 |     100 |     100 |
  book.js                 |     100 |     92.3 |     100 |     100 | 3
  user.js                 |     100 |      100 |     100 |     100 |
 repo                     |     100 |      100 |     100 |     100 |
  in-memory-repository.js |     100 |      100 |     100 |     100 |
 services                 |     100 |      100 |     100 |     100 |
  library-service.js      |     100 |      100 |     100 |     100 |
--------------------------|---------|----------|---------|---------|-------------------
```

A meta de **90% de linhas e 90% de ramos** foi atendida sem reduzir os limiares ou excluir arquivos adicionais da configuração original.

| Arquivo e linha | O que o trecho faz | Por que não foi coberto |
|---|---|---|
| `src/models/book.js`, linha 3, ramo `quantity = 1` | Aplica a quantidade padrão ao instanciar `Book` diretamente sem quantidade | Todos os testes exercitam o domínio pelo `LibraryService`. `registerBook(title, author, quantity = 1)` já fornece o padrão ao construtor. O padrão do serviço é testado, mas não há uma chamada direta de `new Book` sem quantidade. Não foi criado um teste do modelo apenas para elevar a porcentagem. |

Não há linhas executáveis completamente sem cobertura nos arquivos medidos. A indicação de linha 3 aparece por um **ramo** não executado, compatível com 100% de linhas e 98,48% de ramos. O HTML detalhado pode ser regenerado com `npm run coverage` em `coverage/lcov-report/index.html`.

## 4. O que ficou sem teste, e por quê

| Parte não verificada automaticamente | Motivo | Erro que poderia passar despercebido |
|---|---|---|
| `src/app.js`: fluxo completo do menu, leitura e formatação das mensagens | A atividade exclui a interface dos testes de unidade e da cobertura. As regras ficam no serviço; a integração foi conferida em uma sessão manual de `npm start`. | Opção conectada ao método errado, formatação inadequada ou conversão incorreta de uma entrada em um fluxo que não foi percorrido manualmente. |
| `src/ui/console-ui.js`: interação de `prompt-sync` com terminais diferentes | Depende de teclado e terminal reais; fica fora da medição original. | Problemas de eco, caracteres acentuados, cancelamento ou leitura em outro terminal. |
| Construtor `Book` chamado diretamente sem quantidade | A API avaliada é o serviço, que aplica o padrão e o encaminha ao modelo. | Regressão no padrão do modelo ao ser usado diretamente por um consumidor externo. |
| APIs internas dos modelos e repositório chamadas com estados arbitrários | Os testes exercitam o uso real pelo serviço. A adulteração do estoque foi feita apenas para conferir a guarda defensiva exigida por RN02. | Uso direto indevido, como inserir entidades inválidas no repositório; o serviço valida os fluxos cobertos. |
| Caminho `InMemoryRepository.removeBook()` retornando `false` para título inexistente | O serviço já lança `Livro não encontrado` antes de chamar o repositório; esse contrato é testado na Parte 1. | Uma regressão nesse retorno interno, se outro consumidor passar a depender dele diretamente. |
| Volume elevado, concorrência e compatibilidade com todos os sistemas operacionais | O escopo é uma aplicação pequena, síncrona e em memória. A validação foi feita em Windows com Node.js 22.21.0. | Lentidão com grandes acervos ou problemas específicos de outros ambientes. |

Os objetos de livros e usuários devolvidos pelo repositório mantêm a estrutura original de referências compartilhadas. A suíte verifica que alterar os **arrays** de consulta não remove registros internos; não promete imutabilidade profunda das entidades. A NF02 protege especificamente suas datas com cópias.

NF03 a NF09 não foram implementadas: a atividade pede duas evoluções, atendidas por NF02 e NF01. Não há persistência, histórico completo, bloqueio por atraso, exportação ou novas políticas de limite nesta entrega. Essas funcionalidades não são comportamentos implementados sem teste.

### Verificações complementares e reprodução

| Verificação | Resultado e evidência |
|---|---|
| Instalação | `npm install` concluído; `package-lock.json` incluído na entrega |
| Regressão no original | 5 falhas e 52 sucessos em 57 casos, antes das correções; `evidencias/testes-antes-correcoes.txt` |
| Suíte final | `npm test`: 90 testes aprovados; `evidencias/testes-finais.txt` |
| Cobertura | `npm run coverage`: meta atendida; `evidencias/cobertura.txt` |
| Independência por ordem | `npm test -- --runInBand --randomize --seed=271828 --showSeed`: 90 aprovados; `evidencias/testes-ordem-aleatoria.txt` |
| Execução isolada | `npm test -- -t "rejeita seis exemplares"`: 1 aprovado, demais ignorados pelo filtro; `evidencias/teste-isolado.txt` |
| Sintaxe da interface | `node --check src/app.js` e `node --check src/ui/console-ui.js`: sem erros |
| Uso manual | Cadastro com quantidade padrão, busca por autor, cadastro de usuário, empréstimo, consulta da data, devolução com zero dias completos, busca sem resultado, consulta sem empréstimos e saída limpa; `evidencias/verificacao-console.md` |
| Pacote extraído em pasta independente | Dependências instaladas novamente e `npm test` com 90 aprovados; `evidencias/instalacao-pacote.txt` e `evidencias/testes-pacote-extraido.txt` |

O aviso `ExperimentalWarning: VM Modules` vem do suporte de ES Modules usado pelo comando original do Jest. Não representa falha dos testes.

Na verificação do pacote extraído, a instalação usou `npm install --offline --cache <cache-local> --no-audit --no-fund`, reaproveitando os downloads da instalação inicial. Não foi copiada uma pasta `node_modules`: ela foi criada novamente pelo npm a partir dos arquivos do pacote e do lockfile. O teste seguinte foi o comando normal `npm test`.

Para reproduzir após extrair o ZIP, entre em `r-book-lib/` e execute `npm install`, `npm test` e `npm run coverage`. Para usar o programa, execute `npm start` em um terminal interativo.
