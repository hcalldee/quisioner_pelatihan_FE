$(function () {
  function reset2faUI() {
    $('#twofa-qr-canvas').hide().empty();
    $('#twofa-qr').hide().attr('src', '');
    $('#twofa-qr-placeholder').show().text('QR belum dibuat');
    $('#twofa-secret').val('');
    $('#twofa-code').val('');
  }

  function renderQrCanvas(text) {
    if (!text || typeof QRCode === 'undefined') return false;

    // qrcodejs renders into the container element
    $('#twofa-qr-canvas').empty().css('display', 'flex');
    new QRCode(document.getElementById('twofa-qr-canvas'), {
      text: String(text),
      width: 220,
      height: 220,
      correctLevel: QRCode.CorrectLevel.M
    });
    return true;
  }

  function generateQr() {
    reset2faUI();
    $('#twofa-qr-placeholder').text('Membuat QR...');

    $.ajax({
      url: BASE_URL + '/api/auth/2fa/setup',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({}),
      success: function (res) {
        if (!res || !res.success || !res.data) {
          swalMsg('error', 'Gagal', 'Gagal membuat QR');
          $('#twofa-qr-placeholder').text('QR gagal dibuat');
          return;
        }

        $('#twofa-secret').val(res.data.secret || '');

        // Prefer generate QR on frontend from otpauth_url (offline-friendly)
        if (res.data.otpauth_url && renderQrCanvas(res.data.otpauth_url)) {
          $('#twofa-qr').hide().attr('src', '');
          $('#twofa-qr-placeholder').hide();
        } else if (res.data.qr_url) {
          $('#twofa-qr-canvas').hide().empty();
          $('#twofa-qr').attr('src', res.data.qr_url).show();
          $('#twofa-qr-placeholder').hide();
        } else {
          $('#twofa-qr-placeholder').text('QR tidak tersedia');
        }
      },
      error: function (xhr) {
        const msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Gagal membuat QR';
        swalMsg('error', 'Gagal', msg);
        $('#twofa-qr-placeholder').text('QR gagal dibuat');
      }
    });
  }

  // Open modal
  $('#btn-open-2fa').on('click', function (e) {
    e.preventDefault();
    reset2faUI();
    $('#modal-2fa').modal('show');
  });

  // Generate QR button
  $('#btn-generate-2fa').on('click', function () {
    generateQr();
  });

  // Verify button
  $('#btn-verify-2fa').on('click', function () {
    const code = String($('#twofa-code').val() || '').trim();
    if (!/^\d{6}$/.test(code)) {
      swalMsg('warning', 'Validasi', 'Kode harus 6 digit');
      return;
    }

    $.ajax({
      url: BASE_URL + '/api/auth/2fa/verify',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ code: code }),
      success: function (res) {
        if (!res || !res.success || !res.data || !res.data.token) {
          swalMsg('error', 'Gagal', 'Verifikasi 2FA gagal');
          return;
        }

        // update token
        localStorage.setItem('access_token', res.data.token);

        swalMsg('success', 'Sukses', '2FA berhasil diaktifkan');
        $('#modal-2fa').modal('hide');
      },
      error: function (xhr) {
        const msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Verifikasi 2FA gagal';
        swalMsg('error', 'Gagal', msg);
      }
    });
  });

  // Clear on close
  $('#modal-2fa').on('hidden.bs.modal', function () {
    reset2faUI();
  });
});
