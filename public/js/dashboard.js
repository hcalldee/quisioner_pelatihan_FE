$(function () {
  function refreshTable() {
    $.get(BASE_URL + '/api/tenaga/', function (res) {
      if (!res || !res.success || !res.data) return;
      $('#content-title').html('Data Tenaga Instruktur / Pemateri');

      const rows = res.data.map(r => ({ ...r, id: r.NI }));
      if (!rows.length) return;
      renderTable('#table-x1', rows, '0', 'btn-tenaga-pelatihan');
    });
  }

  function loadMaster(done) {
    const reqKejuruan = $.ajax({ url: BASE_URL + '/api/kejuruan', type: 'GET', dataType: 'json' });
    const reqKelas = $.ajax({ url: BASE_URL + '/api/kelas', type: 'GET', dataType: 'json' });

    $.when(reqKejuruan, reqKelas).done(function (kejuruanRes, kelasRes) {
      done({
        kejuruan: kejuruanRes[0] && kejuruanRes[0].data ? kejuruanRes[0].data : [],
        kelas: kelasRes[0] && kelasRes[0].data ? kelasRes[0].data : []
      });
    }).fail(function () {
      done({ kejuruan: [], kelas: [] });
    });
  }

  function renderFormTenaga(mode) {
    $('#modalBody').html('');
    $('#modalTitle').text(mode === 'edit' ? 'Edit Data Tenaga' : 'Tambah Data Tenaga');

    $('#modalBody').html(`
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>NI</label>
            <input type="text" class="form-control" id="NI" name="NI" ${mode === 'edit' ? 'disabled' : ''}>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label>Nama</label>
            <input type="text" class="form-control" id="Nama" name="Nama">
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>Kelas</label>
            <select id="Kelas" class="form-control"></select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label>Kejuruan</label>
            <select id="Kejuruan" class="form-control"></select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="Status" name="Status">
          <option value="">-- Pilih Status --</option>
          <option value="0">Teori & Praktik</option>
          <option value="1">Teori</option>
          <option value="2">Praktik</option>
        </select>
      </div>
    `);
  }

  // init
  refreshTable();

  // open create modal
  $('#tbh-data-tenaga').on('click', function () {
    renderFormTenaga('create');

    loadMaster(function (DATA) {
      renderSelect({
        selector: '#Kejuruan',
        data: DATA.kejuruan,
        valueKey: 'id',
        labelKey: 'nama',
        placeholder: '-- Pilih Kejuruan --'
      });

      renderSelect({
        selector: '#Kelas',
        data: DATA.kelas,
        valueKey: 'id',
        labelKey: 'nama_kelas',
        placeholder: '-- Pilih Kelas --'
      });
    });

    $('#modal-x1').modal('show');
    $('#btn-save').attr('data-id', 'tbh-data-tenaga').removeAttr('data-ni');
  });

  // Edit / Delete tenaga from table action button
  $('#table-x1').on('click', '.btn-tenaga-pelatihan', function (e) {
    e.preventDefault();

    const isEditBtn = $(this).find('i').hasClass('fa-edit');
    const isDeleteBtn = $(this).find('i').hasClass('fa-trash');

    const ni = $(this).attr('data-id');
    if (!ni) return;

    if (isDeleteBtn) {
      swalConfirm('anda yakin ingin menghapus data ini.?').then(function (r) {
        if (!r.isConfirmed) return;

        $.ajax({
          url: BASE_URL + '/api/tenaga/' + ni,
          type: 'DELETE',
          success: function (res) {
            if (res && res.success) {
              refreshTable();
            } else {
              swalMsg('error', 'Gagal', 'Gagal menghapus data');
            }
          },
          error: function (xhr) {
            console.error(xhr.responseText);
            swalMsg('error', 'Gagal', 'Gagal menghapus data');
          }
        });
      });
      return;
    }

    if (!isEditBtn) return;

    renderFormTenaga('edit');

    const reqTenaga = $.ajax({ url: BASE_URL + '/api/tenaga/' + ni, type: 'GET', dataType: 'json' });

    loadMaster(function (DATA) {
      $.when(reqTenaga).done(function (tenagaRes) {
        const tenaga = tenagaRes && tenagaRes.data ? tenagaRes.data : null;

        renderSelect({
          selector: '#Kejuruan',
          data: DATA.kejuruan,
          valueKey: 'id',
          labelKey: 'nama',
          placeholder: '-- Pilih Kejuruan --'
        });

        renderSelect({
          selector: '#Kelas',
          data: DATA.kelas,
          valueKey: 'id',
          labelKey: 'nama_kelas',
          placeholder: '-- Pilih Kelas --'
        });

        if (tenaga) {
          $('#modalBody #NI').val(tenaga.NI || ni);
          $('#modalBody #Nama').val(tenaga.Nama || '');

          const kelasVal = tenaga.Kelas ?? '';
          const kejuruanVal = tenaga.Kejuruan ?? '';

          if (kelasVal) {
            $('#modalBody #Kelas option').each(function () {
              if ($(this).text().trim() === String(kelasVal).trim()) {
                $(this).prop('selected', true);
                return false;
              }
            });
          }

          if (kejuruanVal) {
            $('#modalBody #Kejuruan option').each(function () {
              if ($(this).text().trim() === String(kejuruanVal).trim()) {
                $(this).prop('selected', true);
                return false;
              }
            });
          }

          $('#modalBody #Status').val(tenaga.Status ?? '');
        }

        $('#modal-x1').modal('show');
        $('#btn-save').attr('data-id', 'edit-data-tenaga').attr('data-ni', ni);
      }).fail(function () {
        swalMsg('error', 'Gagal', 'Gagal mengambil data untuk edit');
      });
    });
  });

  // Save (create/update)
  $('#btn-save').on('click', function () {
    const action = $(this).attr('data-id');

    if (action === 'edit-data-tenaga') {
      const ni = $(this).attr('data-ni');
      if (!ni) return;

      const nama = $('#modalBody #Nama').val();
      if (!nama) {
        swalMsg('warning', 'Validasi', 'Nama wajib diisi');
        return;
      }

      const payload = {
        Nama: nama,
        Kelas: $('#modalBody #Kelas option:selected').text().trim(),
        Kejuruan: $('#modalBody #Kejuruan option:selected').text().trim(),
        Status: $('#modalBody #Status').val()
      };

      $.ajax({
        url: BASE_URL + '/api/tenaga/' + ni,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res && res.success) {
            $('#modal-x1').modal('hide');
            swalMsg('success', 'Sukses', 'Data tenaga berhasil diupdate');
            refreshTable();
          } else {
            swalMsg('error', 'Gagal', 'Gagal mengupdate data');
          }
        },
        error: function (xhr) {
          console.error(xhr.responseText);
          swalMsg('error', 'Gagal', 'Gagal mengupdate data');
        }
      });

      return;
    }

    if (action === 'tbh-data-tenaga') {
      const payload = {
        NI: $('#modalBody #NI').val(),
        Nama: $('#modalBody #Nama').val(),
        Kelas: $('#modalBody #Kelas option:selected').text().trim(),
        Kejuruan: $('#modalBody #Kejuruan option:selected').text().trim(),
        Status: $('#modalBody #Status').val()
      };

      if (!payload.NI || !payload.Nama) {
        swalMsg('warning', 'Validasi', 'NI dan Nama wajib diisi');
        return;
      }

      $.ajax({
        url: BASE_URL + '/api/tenaga',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res && res.success) {
            $('#modal-x1').modal('hide');
            swalMsg('success', 'Sukses', 'Data tenaga berhasil disimpan');
            refreshTable();
          } else {
            swalMsg('error', 'Gagal', 'Gagal menyimpan data');
          }
        },
        error: function (xhr) {
          console.error(xhr.responseText);
          swalMsg('error', 'Gagal', 'Gagal menyimpan data');
        }
      });
    }
  });
});
