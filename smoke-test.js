const fs = require('fs');
const path = require('path');

const base = __dirname;
const files = ['index.html', 'styles.css', 'app.js', 'README.md', 'package.json'];

for (const file of files) {
  const full = path.join(base, file);
  if (!fs.existsSync(full)) {
    console.error(`FALHOU: arquivo ausente -> ${file}`);
    process.exit(1);
  }
}

const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(base, 'app.js'), 'utf8');

if (!html.includes('id="percentual-medico"') || !html.includes('id="valor-repasse"')) {
  console.error('FALHOU: campos de repasse não encontrados no HTML.');
  process.exit(1);
}

if (!html.includes('id="filtro-data"') || !html.includes('id="filtro-mes"')) {
  console.error('FALHOU: filtros de data/mês não encontrados no HTML.');
  process.exit(1);
}

if (!html.includes('id="exportar-resumo-mensal"')) {
  console.error('FALHOU: botão de exportação de resumo mensal não encontrado no HTML.');
  process.exit(1);
}

if (!js.includes('calcRepasseFromPercent') || !js.includes('exportarBtn') || !js.includes('getFilteredData') || !js.includes('exportCsvResumoMensal')) {
  console.error('FALHOU: lógica de cálculo/exportação ausente no JS.');
  process.exit(1);
}

console.log('OK: smoke test passou para controle de repasse.');
