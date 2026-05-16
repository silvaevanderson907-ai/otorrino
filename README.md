# Controle de Repasse Médico (Clínica)

Este projeto é separado do sistema Toyota e foi feito para controlar o repasse da recepção para o médico por atendimento.

## Arquivos

- `index.html`: tela principal
- `styles.css`: estilos visuais
- `app.js`: regras de cadastro, cálculo, filtros e exportação
- `smoke-test.js`: teste rápido de estrutura
- `package.json`: comandos de teste e execução local

## Funcionalidades

- Cadastro por atendimento (paciente, médico, procedimento e pagamento)
- Cálculo de repasse por percentual ou valor
- Cálculo automático do valor que fica para a clínica
- Filtro por médico, status e busca livre
- Exportação CSV (`repasse_medico.csv`)
- Exclusão de linha e limpeza total

## Como usar

```bash
cd /Users/charm.sucre/Downloads/PROJETOS/app/hospital-separado
npm test
npm start
```

Abrir no navegador:

- `http://localhost:8091`

## Observação

Os dados ficam no `localStorage` do navegador atual.
