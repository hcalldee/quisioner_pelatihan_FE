$(function () {
  var isAdmin = false;

  // determine admin from /api/auth/me (admin is user id=1)
  $.ajax({
    url: BASE_URL + "/api/auth/me",
    type: "GET",
    dataType: "json",
    success: function (res) {
      try {
        isAdmin = !!(res && res.success && res.data && res.data.user && String(res.data.user.sub) === "1");
      } catch (e) {}
    }
  });

  function safeText(x) {
    return String(x == null ? '' : x).replace(/"/g, '&quot;');
  }

  function refreshTable() {
    $.get(BASE_URL + '/api/user', function (res) {
      if (!res || !res.success) return;

      $('#content-title-user').html('Data User');

      if (!res.data || !res.data.length) {
        $('#table-data-user').html('<tbody><tr><td>Data kosong</td></tr></tbody>');
        return;
      }

      var rows = res.data.map(function (u) {
        return {
          id: u.id,
          username: u.username,
          email: u.email ? u.email : '-',
          approved: String(u.approved) === '1' ? 'Approved' : 'Pending',
          twofa_enabled: String(u.twofa_enabled) === '1' ? 'Aktif' : 'Nonaktif'
        };
      });

      renderTable('#table-data-user', rows, '0', 'btn-user-action');
    });
  }

  function renderFormUser(opts) {
    var mode = (opts && opts.mode) ? opts.mode : 'create'; // create|edit|view
    var u = (opts && opts.data) ? opts.data : {};

    var readonly = mode === 'view';
    var title = mode === 'edit'
      ? 'Edit Data User'
      : mode === 'view'
        ? 'Detail User'
        : 'Tambah Data User';

    $('#modalTitleUser').text(title);

    $('#modalBodyUser').html(
      '<div class="row">' +
      '  <div class="col-md-6">' +
      '    <div class="form-group">' +
      '      <label>Username</label>' +
      '      <input type="text" class="form-control" id="user-username" value="' + safeText(u.username) + '"' + (readonly ? ' disabled' : '') + '>' +
      '    </div>' +
      '  </div>' +
      '  <div class="col-md-6">' +
      '    <div class="form-group">' +
      '      <label>Email</label>' +
      '      <input type="email" class="form-control" id="user-email" value="' + safeText(u.email || '') + '"' + (readonly ? ' disabled' : '') + '>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      ' <div class="form-group">' +
      '   <label>Password</label>' +
      '   <input type="password" class="form-control" id="user-password" placeholder="' + (mode === 'edit' ? 'Kosongkan jika tidak diubah' : 'Wajib diisi') + '"' + (readonly ? ' disabled' : '') + '>' +
      '   <small class="form-text text-muted">' +
      (mode === 'edit'
        ? 'Biarkan kosong kalau password tidak diubah.'
        : 'Minimal isi password untuk membuat user.') +
      '   </small>' +
      ' </div>' +
      ' <div class="form-group">' +
      '   <label>Status 2FA</label>' +
      '   <input type="text" class="form-control" id="user-twofa" value="' + (String(u.twofa_enabled) === '1' ? 'Aktif' : 'Nonaktif') + '" disabled>' +
      ' </div>'
    );

    // Reset 2FA (admin only)
    if (isAdmin && String(u.twofa_enabled) === "1") {
      $('#modalBodyUser').append(
        '<div class="form-group">' +
        '  <label>Reset 2FA</label>' +
        '  <div>' +
        '    <button type="button" class="btn btn-danger btn-sm" id="btn-reset-2fa-user">Reset 2FA</button>' +
        '  </div>' +
        '</div>'
      );
    }

    // Approval section (admin only)
    if (isAdmin) {
      var approvedTxt = String(u.approved) === "1" ? "Approved" : "Pending";
      var approveBtn = String(u.approved) === "1"
        ? ""
        : '<button type="button" class="btn btn-success btn-sm" id="btn-approve-user">Approve</button>';

      $('#modalBodyUser').append(
        '<div class="form-group">' +
        '  <label>Approval</label>' +
        '  <div class="d-flex align-items-center" style="gap:8px;">' +
        '    <input type="text" class="form-control" id="user-approved" value="' + approvedTxt + '" disabled>' +
        '    ' + approveBtn +
        '  </div>' +
        '</div>'
      );
    }

    if (readonly) {
      $('#btn-save-user').hide();
    } else {
      $('#btn-save-user').show();
    }

    $('#modal-data-user').modal('show');

    if (mode === 'edit') {
      $('#btn-save-user').attr('data-id', 'edit-data-user');
      $('#btn-save-user').attr('data-user-id', u.id);
    } else if (mode === 'create') {
      $('#btn-save-user').attr('data-id', 'tbh-data-user');
      $('#btn-save-user').removeAttr('data-user-id');
    } else {
      $('#btn-save-user').removeAttr('data-id');
      $('#btn-save-user').removeAttr('data-user-id');
    }
  }

  function loadUser(id, done) {
    $.get(BASE_URL + '/api/user/' + id, function (res) {
      if (!res || !res.success || !res.data) {
        done(null);
        return;
      }
      done(res.data);
    }).fail(function () {
      done(null);
    });
  }

  // init
  refreshTable();

  // open create
  $('#tbh-data-user').on('click', function () {
    renderFormUser({ mode: 'create', data: {} });
  });

  // save create/edit
  $('#btn-save-user').on('click', function () {
    var action = $(this).attr('data-id');
    if (action !== 'tbh-data-user' && action !== 'edit-data-user') return;

    var username = $('#modalBodyUser #user-username').val();
    var email = $('#modalBodyUser #user-email').val();
    var password = $('#modalBodyUser #user-password').val();

    if (!username) {
      swalMsg('warning', 'Validasi', 'Username wajib diisi');
      return;
    }

    if (action === 'tbh-data-user') {
      if (!password) {
        swalMsg('warning', 'Validasi', 'Password wajib diisi');
        return;
      }
    }

    var payload = {
      username: username,
      email: (email === '' ? null : email)
    };

    // untuk edit: jangan kirim password kalau kosong
    if (password) payload.password = password;

    if (action === 'tbh-data-user') {
      $.ajax({
        url: BASE_URL + '/api/user',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (!res || !res.success) {
            swalMsg('error', 'Gagal', (res && res.message) ? res.message : 'Gagal membuat user');
            return;
          }
          swalMsg('success', 'Sukses', 'User berhasil dibuat');
          $('#modal-data-user').modal('hide');
          refreshTable();
        },
        error: function (xhr) {
          var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal membuat user';
          swalMsg('error', 'Gagal', msg);
        }
      });
      return;
    }

    // edit
    var id = $(this).attr('data-user-id');
    if (!id) return;

    $.ajax({
      url: BASE_URL + '/api/user/' + id,
      type: 'PUT',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(payload),
      success: function (res) {
        if (!res || !res.success) {
          swalMsg('error', 'Gagal', (res && res.message) ? res.message : 'Gagal update user');
          return;
        }
        swalMsg('success', 'Sukses', 'User berhasil diupdate');
        $('#modal-data-user').modal('hide');
        refreshTable();
      },
      error: function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal update user';
        swalMsg('error', 'Gagal', msg);
      }
    });
  });

  // table action
  $('#table-data-user').on('click', '.btn-user-action', function (e) {
    e.preventDefault();

    var id = $(this).attr('data-id');
    if (!id) return;

    if ($(this).find('.fa-trash').length) {
      swalConfirm('anda yakin ingin menghapus data ini.?', 'Hapus User').then(function (r) {
        if (!r || !r.isConfirmed) return;

        $.ajax({
          url: BASE_URL + '/api/user/' + id,
          type: 'DELETE',
          dataType: 'json',
          success: function (res) {
            if (!res || !res.success) {
              swalMsg('error', 'Gagal', (res && res.message) ? res.message : 'Gagal hapus user');
              return;
            }
            swalMsg('success', 'Sukses', 'User berhasil dihapus');
            refreshTable();
          },
          error: function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal hapus user';
            swalMsg('error', 'Gagal', msg);
          }
        });
      });
      return;
    }

    if ($(this).find('.fa-edit').length) {
      loadUser(id, function (u) {
        if (!u) {
          swalMsg('error', 'Gagal', 'User tidak ditemukan');
          return;
        }
        renderFormUser({ mode: 'edit', data: u });
      });
      return;
    }

    if ($(this).find('.fa-search').length) {
      loadUser(id, function (u) {
        if (!u) {
          swalMsg('error', 'Gagal', 'User tidak ditemukan');
          return;
        }
        renderFormUser({ mode: 'view', data: u });
      });
    }
  });

  // approve handler (inside modal)
  $('#modal-data-user').on('click', '#btn-approve-user', function () {
    var id = $('#btn-save-user').attr('data-user-id');
    if (!id) return;

    swalConfirm('Approve user ini?', 'Approval').then(function (r) {
      if (!r || !r.isConfirmed) return;

      $.ajax({
        url: BASE_URL + '/api/user/' + id + '/approve',
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ approved: 1 }),
        success: function (res) {
          if (!res || !res.success) {
            swalMsg('error', 'Gagal', (res && res.message) ? res.message : 'Gagal approve user');
            return;
          }
          swalMsg('success', 'Sukses', 'User berhasil diapprove');
          $('#modal-data-user').modal('hide');
          refreshTable();
        },
        error: function (xhr) {
          var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal approve user';
          swalMsg('error', 'Gagal', msg);
        }
      });
    });
  });

  // reset 2FA handler (inside modal)
  $('#modal-data-user').on('click', '#btn-reset-2fa-user', function () {
    var id = $('#btn-save-user').attr('data-user-id');
    if (!id) return;

    swalConfirm('Reset 2FA user ini? User harus setup ulang authenticator.', 'Reset 2FA').then(function (r) {
      if (!r || !r.isConfirmed) return;

      $.ajax({
        url: BASE_URL + '/api/user/' + id + '/reset-2fa',
        type: 'PUT',
        dataType: 'json',
        success: function (res) {
          if (!res || !res.success) {
            swalMsg('error', 'Gagal', (res && res.message) ? res.message : 'Gagal reset 2FA');
            return;
          }
          swalMsg('success', 'Sukses', '2FA berhasil direset');
          $('#modal-data-user').modal('hide');
          refreshTable();
        },
        error: function (xhr) {
          var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Gagal reset 2FA';
          swalMsg('error', 'Gagal', msg);
        }
      });
    });
  });

  // clear modal on close
  $('#modal-data-user').on('hidden.bs.modal', function () {
    $('#modalBodyUser').html('');
    $('#btn-save-user').removeAttr('data-id').removeAttr('data-user-id').show();
  });
});
