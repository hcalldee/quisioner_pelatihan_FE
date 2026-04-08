$(function () {
  function refreshTable() {
    $.get(BASE_URL + '/api/master-transact-pelatihan/', function (res) {
      if (!res || !res.success) return;
      $('#content-title-pelatihan').html('Data Pelatihan');

      if (!res.data || !res.data.length) {
        $('#table-data-pelatihan').html('<tbody><tr><td>Data kosong</td></tr></tbody>');
        return;
      }

      renderTable('#table-data-pelatihan', res.data, '0', 'btn-pelatihan-action');
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
});
