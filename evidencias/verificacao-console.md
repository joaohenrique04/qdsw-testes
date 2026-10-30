# Verificação manual do console

Realizada em 25/10/2026 com `npm start`, em terminal interativo Windows. Esta conferência manual não integra os 90 testes automatizados nem altera os percentuais de cobertura.

| Ação | Resultado observado |
|---|---|
| Abrir o programa | Menu com as opções originais e as novas opções 9 e 10 |
| Cadastrar `Dom Casmurro`, autor `Machado de Assis`, quantidade vazia | `Livro cadastrado.`; quantidade padrão 1 |
| Buscar `MACHADO` pela opção 9 | Livro encontrado pelo autor, disponível 1 |
| Cadastrar usuário `u1`, nome `Ana` | `Usuário cadastrado.` |
| Emprestar `Dom Casmurro` a `u1` | `Empréstimo realizado.` |
| Consultar opção 10 para `u1` | `Dom Casmurro` com empréstimo em `2026-10-25T21:28:21.088Z` |
| Devolver o livro | `Devolução realizada.`, as duas datas e `Dias completos de empréstimo: 0` |
| Buscar `Python` | `Nenhum resultado encontrado` |
| Consultar opção 10 para `u1` após devolver | `(nenhum)` |
| Selecionar opção 0 | `Até logo!`; processo encerrado com código 0 |

Na devolução, a data exibida foi `2026-10-25T21:29:59.681Z`. São instantes reais desta conferência, em UTC. Os testes de unidade usam datas fixas independentes desses valores.
