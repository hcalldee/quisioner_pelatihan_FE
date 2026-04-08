$(function () {
  var currentGrafikId = null;
  var grafikDataCache = null;
  var grafikMetaCache = null;
  var pelatihanRowMap = {};
  var chartGlobal1 = null;
  var chartGlobal24 = null;
  var chartTenaga = null;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toNum(val) {
    var n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  function predikatFromNilai(nilai) {
    var v = toNum(nilai);
    if (v == null) return '-';
    if (v >= 4.3) return 'Baik Sekali';
    if (v >= 3.5) return 'Baik';
    if (v >= 2.7) return 'Cukup';
    if (v >= 1.9) return 'Kurang Baik';
    return 'Tidak Baik';
  }

  function destroyCharts() {
    if (chartGlobal1) {
      chartGlobal1.destroy();
      chartGlobal1 = null;
    }
    if (chartGlobal24) {
      chartGlobal24.destroy();
      chartGlobal24 = null;
    }
    if (chartTenaga) {
      chartTenaga.destroy();
      chartTenaga = null;
    }

    $('#chart-global-1-5').html('');
    $('#chart-global-24-42').html('');
    $('#chart-tenaga-6-23').html('');
  }

  function showGrafikView() {
    $('#card-pelatihan-table').hide();
    $('#card-pelatihan-grafik').show();
    $('#btn-refresh-grafik-pelatihan').show();
    $('#btn-print-tabel-grafik-pelatihan').show();
  }

  function hideGrafikView() {
    currentGrafikId = null;
    grafikDataCache = null;
    grafikMetaCache = null;
    destroyCharts();
    $('#grafik-content-pelatihan').html('');
    $('#select-tenaga-grafik').html('');
    $('#btn-refresh-grafik-pelatihan').hide();
    $('#btn-print-tabel-grafik-pelatihan').hide();
    $('#card-pelatihan-grafik').hide();
    $('#card-pelatihan-table').show();
  }

  function renderBarChart(targetSelector, title, rows) {
    if (typeof ApexCharts === 'undefined') {
      swalMsg('error', 'Error', 'ApexCharts belum ter-load (cek CDN di footer).');
      return null;
    }

    var categories = (rows || []).map(function (r) { return String(r.id_pertanyaan); });
    var seriesData = (rows || []).map(function (r) {
      var v = toNum(r.nilai_rata);
      return v == null ? 0 : Number(v.toFixed ? v.toFixed(2) : v);
    });

    var options = {
      chart: {
        type: 'bar',
        height: 260,
        toolbar: { show: false }
      },
      title: { text: title || '', style: { fontSize: '12px' } },
      series: [{ name: 'Nilai', data: seriesData }],
      xaxis: { categories: categories, labels: { rotate: 0 } },
      yaxis: { min: 0, max: 5, tickAmount: 5 },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      dataLabels: {
        enabled: true,
        style: { fontSize: '10px' },
        formatter: function (val, opts) {
          var idx = opts.dataPointIndex;
          var r = rows && rows[idx] ? rows[idx] : {};
          var nilai = toNum(r.nilai_rata);
          var d = r.deskripsi || predikatFromNilai(nilai);
          if (nilai == null) return '-';
          return nilai.toFixed(2) + '\n' + d;
        }
      },
      tooltip: {
        custom: function (ctx) {
          var idx = ctx.dataPointIndex;
          var r = rows && rows[idx] ? rows[idx] : {};
          var nilai = toNum(r.nilai_rata);
          var d = r.deskripsi || predikatFromNilai(nilai);
          return (
            '<div class="p-2" style="max-width: 320px;">' +
            '<div style="font-weight:600;">' + escapeHtml((r.id_pertanyaan ? r.id_pertanyaan + '. ' : '') + (r.pertanyaan || '')) + '</div>' +
            '<div>' + escapeHtml((nilai == null ? '-' : nilai.toFixed(2)) + ' - ' + d) + '</div>' +
            '</div>'
          );
        }
      }
    };

    var chart = new ApexCharts(document.querySelector(targetSelector), options);
    chart.render();
    return chart;
  }

  function renderTenagaSelect(tenagaRows) {
    var map = {};
    (tenagaRows || []).forEach(function (r) {
      if (!r || !r.id_tenaga) return;
      var idt = String(r.id_tenaga);
      if (!map[idt]) map[idt] = String(r.nama_tenaga || r.nama || idt);
    });

    var entries = Object.keys(map).map(function (k) { return { id_tenaga: k, nama: map[k] }; });
    entries.sort(function (a, b) { return a.nama.localeCompare(b.nama); });

    var $sel = $('#select-tenaga-grafik');
    $sel.html('');

    if (!entries.length) {
      $sel.append('<option value="">Tidak ada instruktur</option>');
      return null;
    }

    entries.forEach(function (t) {
      $sel.append('<option value="' + escapeHtml(t.id_tenaga) + '">' + escapeHtml(t.nama) + '</option>');
    });

    return entries[0].id_tenaga;
  }

  function renderReviewTables(data) {
    var global1 = (data && data.global_1_5) ? data.global_1_5 : [];
    var tenaga = (data && data.tenaga_6_23) ? data.tenaga_6_23 : [];
    var global24 = (data && data.global_24_42) ? data.global_24_42 : [];
    var komentar = (data && data.komentar) ? data.komentar : { i0: '', i1: '', i2: '' };

    function rowPenilaian(r) {
      var nilai = toNum(r.nilai_rata);
      var d = r.deskripsi || predikatFromNilai(nilai);
      if (nilai == null) return '-';

      var pct = Math.max(0, Math.min(100, (nilai / 5) * 100));
      return (
        escapeHtml(nilai.toFixed(2)) +
        '<br>' +
        escapeHtml(d) +
        // Use SVG so it prints reliably even when Chrome "background graphics" is off.
        '<svg viewBox="0 0 100 10" preserveAspectRatio="none" ' +
        'style="width:100%;height:10px;display:block;margin-top:4px;">' +
        '  <rect x="0" y="0" width="100" height="10" fill="#d9d9d9" stroke="#000" stroke-width="1.5" vector-effect="non-scaling-stroke"></rect>' +
        '  <rect x="0" y="0" width="' + pct.toFixed(2) + '" height="10" fill="#1e88e5"></rect>' +
        '</svg>'
      );
    }

    function renderKomentarCell(str) {
      var raw = String(str == null ? '' : str);
      if (!raw.trim()) return '<span class="text-muted">-</span>';

      // backend sudah concat pakai "," -> tampilkan tetap inline (tanpa enter)
      var parts = raw
        .split(',')
        .map(function (s) { return String(s || '').trim(); })
        .filter(Boolean);

      if (!parts.length) return '<span class="text-muted">-</span>';
      return escapeHtml(parts.join(', '));
    }

    function groupBy(arr, key) {
      var m = {};
      (arr || []).forEach(function (r) {
        var k = (r && r[key]) ? String(r[key]) : '';
        if (!m[k]) m[k] = [];
        m[k].push(r);
      });
      return m;
    }

    var html = '';

    // I. Materi (1-5)
    html += '<div class="mb-4">';
    html += '<table class="table table-bordered border-primary" id="tabel-review-global-1-5">';
    html += '<tbody>';
    html += '<tr class="kategori-header table-primary">';
    html += '<th colspan="2">I. Materi Pelatihan (kurikulum silabus dan modul)</th>';
    html += '<th class="text-center">Penilaian</th>';
    html += '</tr>';
    global1.forEach(function (r, idx) {
      html += '<tr class="pertanyaan-row">';
      html += '<td style="width:52px;">' + escapeHtml(String(idx + 1)) + '</td>';
      html += '<td class="text-wrap">' + escapeHtml(r.pertanyaan || '') + '</td>';
      html += '<td class="text-center">' + rowPenilaian(r) + '</td>';
      html += '</tr>';
    });

    // komentar materi (index 0)
    html += '<tr class="komentar-row table-info">';
    html += '<td colspan="3"><b>Komentar / Saran (Materi Pelatihan)</b><br>' + renderKomentarCell(komentar.i0) + '</td>';
    html += '</tr>';
    html += '</tbody></table></div>';

    // II. Tenaga Pelatih (6-23) pivot
    html += '<div class="mb-4">';
    html += '<table class="table table-bordered border-primary" id="tabel-review-tenaga-6-23">';
    html += '<tbody>';

    // tenaga list
    var tenagaMap = {};
    tenaga.forEach(function (r) {
      if (!r || !r.id_tenaga) return;
      var idt = String(r.id_tenaga);
      if (!tenagaMap[idt]) tenagaMap[idt] = String(r.nama_tenaga || r.nama || idt);
    });
    var tenagaIds = Object.keys(tenagaMap);
    tenagaIds.sort(function (a, b) { return String(tenagaMap[a]).localeCompare(String(tenagaMap[b])); });

    // questions map
    var qMap = {};
    tenaga.forEach(function (r) {
      if (!r || !r.id_pertanyaan) return;
      var pid = String(r.id_pertanyaan);
      if (!qMap[pid]) qMap[pid] = { id_pertanyaan: r.id_pertanyaan, pertanyaan: r.pertanyaan || '', sub_kategori: r.sub_kategori || '' };
    });
    var qList = Object.keys(qMap)
      .map(function (k) { return qMap[k]; })
      .sort(function (a, b) { return Number(a.id_pertanyaan) - Number(b.id_pertanyaan); });

    // compute avg per tenaga
    var avgTenaga = {};
    tenagaIds.forEach(function (idt) { avgTenaga[idt] = { sum: 0, cnt: 0 }; });
    tenaga.forEach(function (r) {
      var idt = r && r.id_tenaga ? String(r.id_tenaga) : null;
      var v = toNum(r.nilai_rata);
      if (!idt || v == null) return;
      if (!avgTenaga[idt]) avgTenaga[idt] = { sum: 0, cnt: 0 };
      avgTenaga[idt].sum += v;
      avgTenaga[idt].cnt += 1;
    });

    var totalCols = 2 + tenagaIds.length; // no + pertanyaan + instruktur

    html += '<tr class="kategori-header table-primary">';
    html += '<th colspan="2">II. Tenaga Pelatih</th>';
    tenagaIds.forEach(function (idt) {
      var meta = avgTenaga[idt] || { sum: 0, cnt: 0 };
      var avg = meta.cnt ? (meta.sum / meta.cnt) : null;
      var pred = avg == null ? '-' : predikatFromNilai(avg);
      html += '<th class="text-center">' + escapeHtml(tenagaMap[idt]) +
        '<br><small class="text-muted">' + escapeHtml(avg == null ? '-' : avg.toFixed(2)) + ' | ' + escapeHtml(pred) + '</small></th>';
    });
    html += '</tr>';

    // data lookup by (id_pertanyaan, id_tenaga)
    var lookup = {};
    tenaga.forEach(function (r) {
      var pid = r && r.id_pertanyaan ? String(r.id_pertanyaan) : null;
      var idt = r && r.id_tenaga ? String(r.id_tenaga) : null;
      if (!pid || !idt) return;
      lookup[pid + '||' + idt] = r;
    });

    var grouped = groupBy(qList, 'sub_kategori');
    Object.keys(grouped).forEach(function (sk) {
      var arr = grouped[sk] || [];
      if (sk) {
        html += '<tr class="subkategori-header table-secondary">';
        html += '<td><b></b></td>';
        html += '<td colspan="' + (totalCols - 1) + '"><b>' + escapeHtml(sk) + '</b></td>';
        html += '</tr>';
      }

      arr.forEach(function (q, idx) {
        var pid = String(q.id_pertanyaan);
        html += '<tr class="pertanyaan-row">';
        html += '<td style="width:52px;">' + escapeHtml(String(idx + 1)) + '</td>';
        html += '<td class="text-wrap">' + escapeHtml(q.pertanyaan || '') + '</td>';

        // per tenaga
        tenagaIds.forEach(function (idt) {
          var r = lookup[pid + '||' + idt];
          html += '<td class="text-center">' + (r ? rowPenilaian(r) : '-') + '</td>';
        });
        html += '</tr>';
      });
    });

    // komentar tenaga (index 1)
    html += '<tr class="komentar-row table-info">';
    html += '<td colspan="' + totalCols + '"><b>Komentar / Saran (Tenaga Pelatih)</b><br>' + renderKomentarCell(komentar.i1) + '</td>';
    html += '</tr>';

    html += '</tbody></table></div>';

    // III. Sarana / Prasarana (24-42) grouped by sub_kategori
    html += '<div class="mb-4">';
    html += '<table class="table table-bordered border-primary" id="tabel-review-global-24-42">';
    html += '<tbody>';
    html += '<tr class="kategori-header table-primary">';
    html += '<th colspan="2">III. Sarana / Prasarana</th>';
    html += '<th class="text-center">Penilaian</th>';
    html += '</tr>';

    var g24Grouped = groupBy(global24, 'sub_kategori');
    Object.keys(g24Grouped).forEach(function (sk) {
      var arr = g24Grouped[sk] || [];
      if (sk) {
        html += '<tr class="subkategori-header table-secondary">';
        html += '<td><b></b></td>';
        html += '<td colspan="2"><b>' + escapeHtml(sk) + '</b></td>';
        html += '</tr>';
      }
      arr.forEach(function (r, idx) {
        html += '<tr class="pertanyaan-row">';
        html += '<td style="width:52px;">' + escapeHtml(String(idx + 1)) + '</td>';
        html += '<td class="text-wrap">' + escapeHtml(r.pertanyaan || '') + '</td>';
        html += '<td class="text-center">' + rowPenilaian(r) + '</td>';
        html += '</tr>';
      });
    });

    // komentar sarana (index 2)
    html += '<tr class="komentar-row table-info">';
    html += '<td colspan="3"><b>Komentar / Saran (Sarana / Prasarana)</b><br>' + renderKomentarCell(komentar.i2) + '</td>';
    html += '</tr>';

    html += '</tbody></table></div>';

    $('#grafik-content-pelatihan').html(html);
  }

  function fetchAndRenderGrafik(idTransact) { 
    currentGrafikId = idTransact; 
    showGrafikView(); 
    $('#grafik-content-pelatihan').html('<div class="text-muted">Loading...</div>'); 
 
    // meta pelatihan (nama + tanggal) untuk kop print: ambil dari row tabel yang diklik
    grafikMetaCache = pelatihanRowMap[String(idTransact)] || null;
 
    $.ajax({ 
      url: BASE_URL + '/api/master-transact-pelatihan/grafik', 
      type: 'POST', 
      contentType: 'application/json', 
      dataType: 'json',
      data: JSON.stringify({ id_transact: Number(idTransact) }),
      success: function (res) {
        if (!res || !res.success || !res.data) {
          swalMsg('error', 'Gagal', 'Response grafik tidak valid');
          return;
        }

        grafikDataCache = res.data;

        destroyCharts();
        chartGlobal1 = renderBarChart('#chart-global-1-5', '', grafikDataCache.global_1_5 || []);
        chartGlobal24 = renderBarChart('#chart-global-24-42', '', grafikDataCache.global_24_42 || []);

        // tenaga chart based on selected instruktur
        var defaultTenaga = renderTenagaSelect(grafikDataCache.tenaga_6_23 || []);
        if (defaultTenaga) {
          var tenagaRows = (grafikDataCache.tenaga_6_23 || []).filter(function (r) {
            return r && String(r.id_tenaga) === String(defaultTenaga);
          });
          chartTenaga = renderBarChart('#chart-tenaga-6-23', '', tenagaRows);
        } else {
          $('#chart-tenaga-6-23').html('<div class="text-muted">Tidak ada data instruktur</div>');
        }

        renderReviewTables(grafikDataCache);
      },
      error: function (xhr) {
        swalMsg('error', 'Gagal', (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal load grafik');
      }
    });
  }
  function refreshTable() { 
    $.get(BASE_URL + '/api/master-transact-pelatihan/', function (res) { 
      if (!res || !res.success) return; 
      $('#content-title-pelatihan').html('Data Pelatihan'); 
 
      if (!res.data || !res.data.length) { 
        $('#table-data-pelatihan').html('<tbody><tr><td>Data kosong</td></tr></tbody>'); 
        return; 
      } 

      // cache row untuk kebutuhan kop print (tanpa call endpoint lain)
      pelatihanRowMap = {};
      res.data.forEach(function (r) {
        if (r && r.id != null) pelatihanRowMap[String(r.id)] = r;
      });
 
      renderTable('#table-data-pelatihan', res.data, '0', 'btn-pelatihan-action', { grafik: true }); 
    }); 
  } 

  function loadTenagaList(done) {
    $.get(BASE_URL + '/api/tenaga', function (res) {
      if (!res || !res.success || !res.data) {
        done([]);
        return;
      }
      done(res.data);
    }).fail(function () {
      done([]);
    });
  }

  function parseGTenagaToList(gTenaga) {
    if (!gTenaga) return [];

    // backend format: {NI1,NI2}
    if (typeof gTenaga === 'string') {
      return gTenaga
        .replace(/[{}]/g, '')
        .split(',')
        .map(function (x) { return String(x || '').trim(); })
        .filter(Boolean);
    }

    // kalau backend return array objek
    if (Array.isArray(gTenaga)) {
      return gTenaga
        .map(function (t) {
          if (t && typeof t === 'object') return String(t.ni || t.NI || '').trim();
          return String(t || '').trim();
        })
        .filter(Boolean);
    }

    return [];
  }

  function buildGTenagaString(niList) {
    var list = Array.isArray(niList) ? niList : [];
    return '{' + list.join(',') + '}';
  }

  function updateBadgesFromSelect() {
    var $sel = $('#modalBody #g_tenaga_select');
    var $box = $('#modalBody #g_tenaga_badges');
    if (!$sel.length || !$box.length) return;

    $box.html('');

    $sel.find('option:selected').each(function () {
      var ni = $(this).val();
      var txt = $(this).text();
      $box.append(
        '<button type="button" class="badge btn btn-primary mr-1 mb-1 btn-remove-tenaga" data-ni="' + ni + '">' +
        '<i class="fas fa-user"></i> ' + txt + ' <i class="fas fa-times ml-1"></i>' +
        '</button>'
      );
    });

    if ($box.html().trim() === '') {
      $box.html('<span class="text-muted">Belum ada instruktur dipilih</span>');
    }
  }

  function renderTenagaOptions($select, tenagaList, selectedNI, withPlaceholder) {
    $select.html('');

    if (withPlaceholder) {
      $select.append('<option value="">-- Pilih Instruktur --</option>');
    }

    if (!tenagaList.length) {
      $select.append('<option value="" disabled>Data tenaga tidak tersedia</option>');
      return;
    }

    tenagaList.forEach(function (t) {
      var ni = t.NI || t.ni;
      var nama = t.Nama || t.nama;
      if (!ni) return;
      var label = (nama ? nama : ni) + ' | ' + ni;

      var opt = $('<option></option>').attr('value', ni).text(label);
      if (selectedNI && selectedNI.indexOf(String(ni)) >= 0) opt.prop('selected', true);
      $select.append(opt);
    });
  }

  function renderFormPelatihan(opts) {
    var mode = opts && opts.mode ? opts.mode : 'create';
    var pel = (opts && opts.data) ? opts.data : {};
    var tenagaList = (opts && opts.tenagaList) ? opts.tenagaList : [];

    var selectedNI = parseGTenagaToList(pel.g_tenaga);

    $('#modalTitle').text(mode === 'edit' ? 'Edit Data Pelatihan' : 'Tambah Data Pelatihan');

    $('#modalBody').html(
      '<div class="form-group">' +
      '  <label>Nama Pelatihan</label>' +
      '  <input type="text" class="form-control" id="nama_pelatihan" value="' + (pel.nama_pelatihan ? String(pel.nama_pelatihan).replace(/"/g, '&quot;') : '') + '" />' +
      '</div>' +
      '<div class="row">' +
      '  <div class="col-md-6">' +
      '    <div class="form-group">' +
      '      <label>Start Date</label>' +
      '      <input type="date" class="form-control" id="start_date" />' +
      '    </div>' +
      '  </div>' +
      '  <div class="col-md-6">' +
      '    <div class="form-group">' +
      '      <label>End Date</label>' +
      '      <input type="date" class="form-control" id="end_date" />' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="form-group">' +
      '  <label>Instruktur (Tenaga)</label>' +
      '  <div class="input-group mb-2">' +
      '    <select id="g_tenaga_picker" class="form-control"></select>' +
      '    <div class="input-group-append">' +
      '      <button class="btn btn-outline-primary" type="button" id="btn-add-tenaga">Tambah</button>' +
      '    </div>' +
      '  </div>' +
      '  <button class="btn btn-sm btn-outline-secondary mb-2" type="button" id="btn-clear-tenaga">Clear</button>' +
      '  <select id="g_tenaga_select" class="form-control" multiple size="6" hidden></select>' +
      '</div>' +
      '<div class="form-group">' +
      '  <label>Selected</label>' +
      '  <div id="g_tenaga_badges"></div>' +
      '</div>'
    );

    // set tanggal (pakai raw kalau ada)
    if (pel && pel.start_date_raw) {
      $('#modalBody #start_date').val(String(pel.start_date_raw).slice(0, 10));
    } else if (pel && pel.start_date && /^\d{4}-\d{2}-\d{2}/.test(String(pel.start_date))) {
      $('#modalBody #start_date').val(String(pel.start_date).slice(0, 10));
    }

    if (pel && pel.end_date_raw) {
      $('#modalBody #end_date').val(String(pel.end_date_raw).slice(0, 10));
    } else if (pel && pel.end_date && /^\d{4}-\d{2}-\d{2}/.test(String(pel.end_date))) {
      $('#modalBody #end_date').val(String(pel.end_date).slice(0, 10));
    }

    // render tenaga options (picker + multi)
    renderTenagaOptions($('#modalBody #g_tenaga_picker'), tenagaList, null, true);
    renderTenagaOptions($('#modalBody #g_tenaga_select'), tenagaList, selectedNI, false);

    updateBadgesFromSelect();

    // update badge on multi select change (desktop)
    $('#modalBody #g_tenaga_select').off('change').on('change', updateBadgesFromSelect);

    // add tenaga from picker (mobile friendly)
    $('#modalBody #btn-add-tenaga').off('click').on('click', function () {
      var ni = $('#modalBody #g_tenaga_picker').val();
      if (!ni) return;

      var $multi = $('#modalBody #g_tenaga_select');
      $multi.find('option').each(function () {
        if (String($(this).val()) === String(ni)) {
          $(this).prop('selected', true);
          return false;
        }
      });
      updateBadgesFromSelect();
    });

    // clear all selection
    $('#modalBody #btn-clear-tenaga').off('click').on('click', function () {
      $('#modalBody #g_tenaga_select option').prop('selected', false);
      updateBadgesFromSelect();
    });

    // remove by clicking badge
    $('#modalBody #g_tenaga_badges').off('click').on('click', '.btn-remove-tenaga', function () {
      var ni = $(this).attr('data-ni');
      $('#modalBody #g_tenaga_select option').each(function () {
        if (String($(this).val()) === String(ni)) {
          $(this).prop('selected', false);
          return false;
        }
      });
      updateBadgesFromSelect();
    });

    $('#modal-data-pelatihan').modal('show');

    if (mode === 'edit') {
      $('#btn-save').attr('data-id', 'edit-data-pelatihan');
      $('#btn-save').attr('data-pelatihan-id', pel.id);
    } else {
      $('#btn-save').attr('data-id', 'tbh-data-pelatihan');
      $('#btn-save').removeAttr('data-pelatihan-id');
    }
  }

  // init table
  refreshTable();

  // open create modal
  $('#tbh-data-pelatihan').on('click', function () {
    loadTenagaList(function (tenagaList) {
      renderFormPelatihan({ mode: 'create', tenagaList: tenagaList });
    });
  });

  // save handler (create/update)
  $('#btn-save').on('click', function () {
    var action = $(this).attr('data-id');
    if (action !== 'tbh-data-pelatihan' && action !== 'edit-data-pelatihan') return;

    var nama_pelatihan = $('#modalBody #nama_pelatihan').val();
    var start_date = $('#modalBody #start_date').val();
    var end_date = $('#modalBody #end_date').val();
    var selectedNI = $('#modalBody #g_tenaga_select').val() || [];

    if (!nama_pelatihan) {
      swalMsg('warning', 'Validasi', 'Nama pelatihan wajib diisi');
      return;
    }
    if (!start_date || !end_date) {
      swalMsg('warning', 'Validasi', 'Start date dan end date wajib diisi');
      return;
    }

    var sd = new Date(start_date);
    var ed = new Date(end_date);
    if (ed < sd) {
      swalMsg('warning', 'Validasi', 'End date tidak boleh lebih kecil dari start date');
      return;
    }

    if (!selectedNI.length) {
      swalMsg('warning', 'Validasi', 'Minimal pilih 1 instruktur');
      return;
    }

    var payload = {
      nama_pelatihan: nama_pelatihan,
      start_date: start_date,
      end_date: end_date,
      g_tenaga: buildGTenagaString(selectedNI)
    };

    if (action === 'tbh-data-pelatihan') {
      $.ajax({
        url: BASE_URL + '/api/master-transact-pelatihan',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res && res.success) {
            $('#modal-data-pelatihan').modal('hide');
            refreshTable();
          } else {
            swalMsg('error', 'Gagal', 'Gagal menyimpan data pelatihan');
          }
        },
        error: function (xhr) {
          swalMsg('error', 'Gagal', (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal menyimpan data');
        }
      });
      return;
    }

    // edit
    var id = $('#btn-save').attr('data-pelatihan-id');
    if (!id) return;

    $.ajax({
      url: BASE_URL + '/api/master-transact-pelatihan/' + id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (res) {
        if (res && res.success) {
          $('#modal-data-pelatihan').modal('hide');
          refreshTable();
        } else {
          swalMsg('error', 'Gagal', 'Gagal update data pelatihan');
        }
      },
      error: function (xhr) {
        swalMsg('error', 'Gagal', (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal update data');
      }
    });
  });

  // action buttons (edit/delete)
  $('#table-data-pelatihan').on('click', '.btn-pelatihan-action', function (e) {
    e.preventDefault();

    var $btn = $(this);
    var id = $btn.attr('data-id');

    if ($btn.find('i').hasClass('fa-chart-bar')) {
      if (!id) {
        swalMsg('warning', 'Info', 'ID pelatihan tidak ditemukan');
        return;
      }
      fetchAndRenderGrafik(id);
      return;
    }

    if ($btn.find('i').hasClass('fa-trash')) {
      swalConfirm('Anda yakin ingin menghapus data ini.?').then(function (r) {
        if (!r.isConfirmed) return;

        $.ajax({
          url: BASE_URL + '/api/master-transact-pelatihan/' + id,
          type: 'DELETE',
          success: function (res) {
            if (res && res.success) {
              refreshTable();
            } else {
              swalMsg('error', 'Gagal', 'Gagal hapus data');
            }
          },
          error: function (xhr) {
            swalMsg('error', 'Gagal', (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal hapus data');
          }
        });
      });
      return;
    }

    if ($btn.find('i').hasClass('fa-edit') || $btn.find('i').hasClass('fa-search')) {
      $.get(BASE_URL + '/api/master-transact-pelatihan/' + id, function (res) {
        if (!res || !res.success || !res.data) {
          swalMsg('warning', 'Info', 'Data tidak ditemukan');
          return;
        }

        loadTenagaList(function (tenagaList) {
          renderFormPelatihan({ mode: 'edit', data: res.data, tenagaList: tenagaList });
        });
      });
    }
  });

  // grafik controls
  $('#btn-back-grafik-pelatihan').on('click', function (e) {
    e.preventDefault();
    hideGrafikView();
  });

  $('#btn-refresh-grafik-pelatihan').on('click', function (e) {
    e.preventDefault();
    if (!currentGrafikId) return;
    fetchAndRenderGrafik(currentGrafikId);
  });

  $('#select-tenaga-grafik').on('change', function () {
    if (!grafikDataCache) return;
    var idt = $(this).val();
    var tenagaRows = (grafikDataCache.tenaga_6_23 || []).filter(function (r) {
      return r && String(r.id_tenaga) === String(idt);
    });
    if (chartTenaga) {
      chartTenaga.destroy();
      chartTenaga = null;
      $('#chart-tenaga-6-23').html('');
    }
    chartTenaga = renderBarChart('#chart-tenaga-6-23', '', tenagaRows);
  });

  $('#btn-print-tabel-grafik-pelatihan').on('click', function (e) {
    e.preventDefault();

    var html = $('#grafik-content-pelatihan').html();
    if (!html || !String(html).trim()) {
      swalMsg('warning', 'Info', 'Tidak ada tabel untuk di-print');
      return;
    }

    var w = window.open('', '_blank');
    if (!w) {
      swalMsg('warning', 'Info', 'Popup terblokir, izinkan popup untuk print.');
      return;
    }

    w.document.open();

    var namaPelatihan = (grafikMetaCache && grafikMetaCache.nama_pelatihan) ? String(grafikMetaCache.nama_pelatihan) : ('ID ' + String(currentGrafikId || ''));
    var tglMulai = (grafikMetaCache && grafikMetaCache.start_date) ? String(grafikMetaCache.start_date) : '';
    var tglSelesai = (grafikMetaCache && grafikMetaCache.end_date) ? String(grafikMetaCache.end_date) : '';
    var tglText = (tglMulai && tglSelesai) ? (tglMulai + ' s/d ' + tglSelesai) : '-';

    var kopHtml =
      '<div class="kop">' +
      '  <div class="kop-logo">' +
      '    <img src="https://kemnaker.go.id/assets/images/logo-color.png" alt="" style="width: 37.5%;">' +
      '  </div>' +
      '<br><br>' +
      '<h3 class="text-center"><b>EVALUASI PENYELENGGARAAN PELATIHAN</b></h3>' +
      '<p class="text-start">' +
      '  Dalam rangka meningkatkan mutu penyelenggaraan pelatihan dimasa mendatang, serta pengukuran kepuasan pelanggan maka kami mohon kesediaan Anda untuk mengisi kuisioner ini dengan memberikan penilaian yang sejujurnya. Penilaian anda dijamin kerahasiaannya. Terimakasih' +
      '</p>' +
      '  <div class="kop-meta">' +
      '    <div><b>Pelatihan</b> : ' + escapeHtml(namaPelatihan) + '</div>' +
      '    <div><b>Tanggal</b> : ' + escapeHtml(tglText) + '</div>' +
      '    <div><b>Tempat Pelatihan</b> : UPTD BLK Kab. Kotabaru</div>' +
      '  </div>' +
      '</div>' +
      '<br><br>'+
      '<p class="text-start"><b>Keterangan :</b></p>' +
      '<ul>5 : Baik Sekali</ul>' +
      '<ul>4 : Baik</ul>' +
      '<ul>3 : Cukup/Sedang</ul>' +
      '<ul>2 : Kurang Baik</ul>' +
      '<ul>1 : Tidak Baik</ul>' ;

    w.document.write(
      '<!doctype html><html><head><meta charset="utf-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '<title>Print Grafik</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;padding:12px;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      'table{width:100%;border-collapse:collapse;}' +
      'th,td{border:1px solid #999;padding:6px;vertical-align:top;}' +
      '.table-primary{background:#cfe2ff;}' +
      '.table-secondary{background:#e2e3e5;}' +
      '.text-center{text-align:center;}' +
      '.text-muted{color:#666;}' +
      '.text-wrap{white-space:normal;}' +
      '.text-start{text-align:left;}' +
      'p{margin:0;}' +
      '.kop-meta{margin-top:8px;}' +
      '.kop-meta div{margin:2px 0;}' +
      'svg{shape-rendering:crispEdges;}' +
      '</style>' +
      '</head><body>' +
      kopHtml +
      html +
      '<script>window.onload=function(){window.print();window.close();};</script>' +
      '</body></html>'
    );
    w.document.close();
  });
});
