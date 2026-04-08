$(function () {
  function resetUI() {
    $('#setup-twofa-qr-canvas').hide().empty();
    $('#setup-twofa-qr').hide().attr('src', '');
    $('#setup-twofa-qr-placeholder').show().text('QR belum dibuat');
    $('#setup-twofa-secret').val('');
    $('#setup-twofa-code').val('');
  }

  function renderQrCanvas(text) {
    if (!text || typeof QRCode === 'undefined') return false;

    $('#setup-twofa-qr-canvas').empty().css('display', 'flex');
    new QRCode(document.getElementById('setup-twofa-qr-canvas'), {
      text: String(text),
      width: 220,
      height: 220,
      correctLevel: QRCode.CorrectLevel.M
    });
    return true;
  }

  function generateQr() {
    resetUI();
    $('#setup-twofa-qr-placeholder').text('Membuat QR...');

    $.ajax({
      url: BASE_URL + '/api/auth/2fa/setup',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({}),
      success: function (res) {
        if (!res || !res.success || !res.data) {
          swalMsg('error', 'Gagal', 'Gagal membuat QR');
          $('#setup-twofa-qr-placeholder').text('QR gagal dibuat');
          return;
        }

        $('#setup-twofa-secret').val(res.data.secret || '');

        if (res.data.otpauth_url && renderQrCanvas(res.data.otpauth_url)) {
          $('#setup-twofa-qr').hide().attr('src', '');
          $('#setup-twofa-qr-placeholder').hide();
          return;
        }

        if (res.data.qr_url) {
          $('#setup-twofa-qr-canvas').hide().empty();
          $('#setup-twofa-qr').attr('src', res.data.qr_url).show();
          $('#setup-twofa-qr-placeholder').hide();
          return;
        }

        $('#setup-twofa-qr-placeholder').text('QR tidak tersedia');
      },
      error: function (xhr) {
        if (xhr && (xhr.status === 401 || xhr.status === 403)) {
          // approval gate will redirect by auth-client, but keep safe fallback
          $('#setup-twofa-qr-placeholder').text('Akun belum diapprove');
          return;
        }
        const msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Gagal membuat QR';
        swalMsg('error', 'Gagal', msg);
        $('#setup-twofa-qr-placeholder').text('QR gagal dibuat');
      }
    });
  }

  // page init
  resetUI();

  $('#setup-btn-generate-2fa').on('click', function () {
    generateQr();
  });

  $('#setup-btn-verify-2fa').on('click', function () {
    if (!String($('#setup-twofa-secret').val() || '').trim()) {
      swalMsg('warning', 'Validasi', 'Klik "Generate QR" dulu sebelum verifikasi');
      return;
    }

    const code = String($('#setup-twofa-code').val() || '').trim();
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

        localStorage.setItem('access_token', res.data.token);
        swalMsg('success', 'Sukses', '2FA berhasil diaktifkan').then(function () {
          window.location.href = '/';
        });
      },
      error: function (xhr) {
        const msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Verifikasi 2FA gagal';
        swalMsg('error', 'Gagal', msg);
      }
    });
  });
});
