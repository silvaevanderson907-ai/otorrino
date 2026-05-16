(function () {
  const STORAGE_KEY = 'clinica-repasse-v1';

  const form = document.getElementById('registro-form');
  const dataInput = document.getElementById('data');
  const pacienteInput = document.getElementById('paciente');
  const medicoInput = document.getElementById('medico');
  const procedimentoInput = document.getElementById('procedimento');
  const formaPagamentoInput = document.getElementById('forma-pagamento');
  const valorRecebidoInput = document.getElementById('valor-recebido');
  const percentualMedicoInput = document.getElementById('percentual-medico');
  const valorRepasseInput = document.getElementById('valor-repasse');
  const statusRepasseInput = document.getElementById('status-repasse');
  const observacoesInput = document.getElementById('observacoes');
  const limparBtn = document.getElementById('limpar');

  const filtroMedico = document.getElementById('filtro-medico');
  const filtroStatus = document.getElementById('filtro-status');
  const filtroBusca = document.getElementById('filtro-busca');
  const resumo = document.getElementById('resumo');
  const listaRegistros = document.getElementById('lista-registros');

  const exportarBtn = document.getElementById('exportar-csv');
  const apagarTudoBtn = document.getElementById('apagar-tudo');

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function parseMoneyBR(value) {
    const s = String(value || '')
      .trim()
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoneyBR(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function normalizeText(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function generateId(data) {
    const max = data.reduce((acc, item) => {
      const n = Number(String(item.id || '').replace(/^R/, ''));
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    return `R${String(max + 1).padStart(4, '0')}`;
  }

  function updateMedicoFilter(data) {
    const current = filtroMedico.value;
    const medicos = [...new Set(data.map((x) => x.medico).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    filtroMedico.innerHTML = '<option value="Todos">Todos</option>';
    medicos.forEach((medico) => {
      const option = document.createElement('option');
      option.value = medico;
      option.textContent = medico;
      filtroMedico.appendChild(option);
    });
    if (medicos.includes(current)) {
      filtroMedico.value = current;
    }
  }

  function calcRepasseFromPercent() {
    const recebido = parseMoneyBR(valorRecebidoInput.value);
    const percentual = Number(percentualMedicoInput.value || 0);
    const repasse = recebido * (percentual / 100);
    valorRepasseInput.value = formatMoneyBR(repasse);
  }

  function calcPercentFromRepasse() {
    const recebido = parseMoneyBR(valorRecebidoInput.value);
    const repasse = parseMoneyBR(valorRepasseInput.value);
    const percentual = recebido > 0 ? (repasse / recebido) * 100 : 0;
    percentualMedicoInput.value = percentual.toFixed(2);
  }

  function renderSummary(data) {
    const recebidoTotal = data.reduce((acc, x) => acc + Number(x.valorRecebido || 0), 0);
    const repasseTotal = data.reduce((acc, x) => acc + Number(x.valorRepasse || 0), 0);
    const clinicaTotal = data.reduce((acc, x) => acc + Number(x.valorClinica || 0), 0);
    const pendente = data.filter((x) => x.statusRepasse === 'Pendente').length;
    const pago = data.filter((x) => x.statusRepasse === 'Pago').length;

    resumo.innerHTML = [
      `<span class="badge">Atendimentos: ${data.length}</span>`,
      `<span class="badge">Recepção recebeu: R$ ${formatMoneyBR(recebidoTotal)}</span>`,
      `<span class="badge">Repasse médico: R$ ${formatMoneyBR(repasseTotal)}</span>`,
      `<span class="badge">Fica na clínica: R$ ${formatMoneyBR(clinicaTotal)}</span>`,
      `<span class="badge">Pendentes: ${pendente}</span>`,
      `<span class="badge">Pagos: ${pago}</span>`
    ].join('');
  }

  function renderTable() {
    const all = load();
    updateMedicoFilter(all);

    const medicoFiltro = filtroMedico.value;
    const statusFiltro = filtroStatus.value;
    const busca = normalizeText(filtroBusca.value);

    const filtered = all.filter((item) => {
      if (medicoFiltro !== 'Todos' && item.medico !== medicoFiltro) {
        return false;
      }
      if (statusFiltro !== 'Todos' && item.statusRepasse !== statusFiltro) {
        return false;
      }
      if (!busca) {
        return true;
      }

      const haystack = normalizeText([
        item.paciente,
        item.medico,
        item.procedimento,
        item.formaPagamento,
        item.observacoes
      ].join(' '));

      return haystack.includes(busca);
    });

    listaRegistros.innerHTML = '';

    filtered
      .sort((a, b) => String(b.data).localeCompare(String(a.data)))
      .forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHTML(item.data)}</td>
          <td>${escapeHTML(item.paciente)}</td>
          <td>${escapeHTML(item.medico)}</td>
          <td>${escapeHTML(item.procedimento)}</td>
          <td>R$ ${formatMoneyBR(item.valorRecebido)}</td>
          <td>${Number(item.percentualMedico || 0).toFixed(2)}%</td>
          <td>R$ ${formatMoneyBR(item.valorRepasse)}</td>
          <td>R$ ${formatMoneyBR(item.valorClinica)}</td>
          <td>${escapeHTML(item.statusRepasse)}</td>
          <td><button class="btn-remove" data-remove="${escapeHTML(item.id)}">Remover</button></td>
        `;
        listaRegistros.appendChild(tr);
      });

    renderSummary(filtered);
  }

  function resetForm() {
    form.reset();
    dataInput.value = new Date().toISOString().slice(0, 10);
    percentualMedicoInput.value = '60';
    valorRecebidoInput.value = '0,00';
    valorRepasseInput.value = '0,00';
    statusRepasseInput.value = 'Pendente';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = load();

    const valorRecebido = parseMoneyBR(valorRecebidoInput.value);
    const valorRepasse = parseMoneyBR(valorRepasseInput.value);
    const percentualMedico = valorRecebido > 0
      ? (valorRepasse / valorRecebido) * 100
      : Number(percentualMedicoInput.value || 0);

    const registro = {
      id: generateId(data),
      data: dataInput.value,
      paciente: pacienteInput.value.trim(),
      medico: medicoInput.value.trim(),
      procedimento: procedimentoInput.value.trim(),
      formaPagamento: formaPagamentoInput.value,
      valorRecebido,
      percentualMedico,
      valorRepasse,
      valorClinica: Math.max(0, valorRecebido - valorRepasse),
      statusRepasse: statusRepasseInput.value,
      observacoes: observacoesInput.value.trim()
    };

    data.push(registro);
    save(data);
    resetForm();
    renderTable();
  });

  limparBtn.addEventListener('click', resetForm);

  listaRegistros.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-remove]');
    if (!btn) {
      return;
    }

    const id = btn.getAttribute('data-remove');
    const updated = load().filter((item) => item.id !== id);
    save(updated);
    renderTable();
  });

  [filtroMedico, filtroStatus, filtroBusca].forEach((element) => {
    element.addEventListener('change', renderTable);
    element.addEventListener('input', renderTable);
  });

  valorRecebidoInput.addEventListener('blur', () => {
    valorRecebidoInput.value = formatMoneyBR(parseMoneyBR(valorRecebidoInput.value));
    calcRepasseFromPercent();
  });

  percentualMedicoInput.addEventListener('input', calcRepasseFromPercent);

  valorRepasseInput.addEventListener('blur', () => {
    valorRepasseInput.value = formatMoneyBR(parseMoneyBR(valorRepasseInput.value));
    calcPercentFromRepasse();
  });

  exportarBtn.addEventListener('click', () => {
    const data = load();
    const headers = [
      'id',
      'data',
      'paciente',
      'medico',
      'procedimento',
      'formaPagamento',
      'valorRecebido',
      'percentualMedico',
      'valorRepasse',
      'valorClinica',
      'statusRepasse',
      'observacoes'
    ];
    const lines = [headers.join(',')];

    data.forEach((item) => {
      const row = headers.map((h) => csvEscape(item[h]));
      lines.push(row.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'repasse_medico.csv';
    link.click();
    URL.revokeObjectURL(url);
  });

  apagarTudoBtn.addEventListener('click', () => {
    const ok = window.confirm('Deseja apagar todos os atendimentos?');
    if (!ok) {
      return;
    }
    save([]);
    renderTable();
  });

  resetForm();
  renderTable();
})();(function () {
  const STORAGE_KEY = 'hospital-separado-registros-v1';

  const form = document.getElementById('registro-form');
  const dataInput = document.getElementById('data');
  const tipoInput = document.getElementById('tipo');
  const categoriaInput = document.getElementById('categoria');
  const descricaoInput = document.getElementById('descricao');
  const quantidadeInput = document.getElementById('quantidade');
  const responsavelInput = document.getElementById('responsavel');
  const statusInput = document.getElementById('status');
  const limparBtn = document.getElementById('limpar');

  const filtroTipo = document.getElementById('filtro-tipo');
  const listaRegistros = document.getElementById('lista-registros');

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function generateId(data) {
    const next = data.length ? Math.max(...data.map((x) => x.idNum || 0)) + 1 : 1;
    return { idNum: next, id: `H${String(next).padStart(4, '0')}` };
  }

  function resetForm() {
    form.reset();
    dataInput.value = new Date().toISOString().slice(0, 10);
    quantidadeInput.value = '1';
  }

  function render() {
    const filtro = filtroTipo.value;
    const data = load();

    const filtered = filtro === 'Todos'
      ? data
      : data.filter((item) => item.tipo === filtro);

    listaRegistros.innerHTML = '';

    filtered
      .sort((a, b) => String(b.data).localeCompare(String(a.data)))
      .forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.data}</td>
          <td>${item.tipo}</td>
          <td>${item.categoria}</td>
          <td>${item.descricao}</td>
          <td>${item.quantidade}</td>
          <td>${item.responsavel}</td>
          <td>${item.status}</td>
          <td><button class="btn-remove" data-remove="${item.id}">Remover</button></td>
        `;
        listaRegistros.appendChild(tr);
      });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = load();
    const generated = generateId(data);

    const registro = {
      id: generated.id,
      idNum: generated.idNum,
      data: dataInput.value,
      tipo: tipoInput.value,
      categoria: categoriaInput.value.trim(),
      descricao: descricaoInput.value.trim(),
      quantidade: Number(quantidadeInput.value || 0),
      responsavel: responsavelInput.value.trim(),
      status: statusInput.value
    };

    data.push(registro);
    save(data);
    resetForm();
    render();
  });

  listaRegistros.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-remove]');
    if (!btn) return;

    const id = btn.getAttribute('data-remove');
    const data = load().filter((item) => item.id !== id);
    save(data);
    render();
  });

  filtroTipo.addEventListener('change', render);
  limparBtn.addEventListener('click', resetForm);

  resetForm();
  render();
})();
