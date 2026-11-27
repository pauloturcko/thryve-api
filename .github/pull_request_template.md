<!--
Fluxo de branches:
- Feature/fix: abra a PR para a `developer` (ambiente de teste).
- Versão: PR `developer` -> `main` (produção), usando "Create a merge commit" (não squash),
  senão a developer e a main se separam e a próxima versão traz commits repetidos.
-->

## O que muda


## Como testar


## Checklist
- [ ] PR aberta para a branch certa (`developer`, ou `main` só se for versão/hotfix)
- [ ] Migrations novas (se houver) testadas localmente
