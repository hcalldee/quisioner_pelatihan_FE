$(function () {
  // Kalau udah login, langsung balik ke dashboard
  if (localStorage.getItem("access_token")) {
    window.location.href = "/";
    return;
  }

  var tempToken = null;

  function showError(msg) {
    $("#login-error").removeClass("d-none").text(msg || "Terjadi kesalahan");
  }

  function hideError() {
    $("#login-error").addClass("d-none").text("");
  }

  function showInfo(msg) {
    $("#login-info").removeClass("d-none").text(msg || "");
  }

  function hideInfo() {
    $("#login-info").addClass("d-none").text("");
  }

  function set2faMode(on) {
    if (on) {
      $("#group-password").addClass("d-none");
      $("#group-2fa").removeClass("d-none");
      $("#btn-login").text("Verifikasi");
      showInfo("2FA aktif. Masukkan kode Google Authenticator.");
    } else {
      $("#group-password").removeClass("d-none");
      $("#group-2fa").addClass("d-none");
      $("#btn-login").text("Masuk");
      hideInfo();
    }
  }

  $("#form-login").on("submit", function (e) {
    e.preventDefault();
    hideError();

    var username = $("#login-username").val();

    if (!tempToken) {
      var password = $("#login-password").val();

      $.ajax({
        url: BASE_URL + "/api/auth/login",
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({ username: username, password: password }),
        success: function (res) {
          if (!res || !res.success || !res.data) {
            showError("Login gagal");
            return;
          }

          if (res.data.requires_2fa) {
            tempToken = res.data.temp_token;
            set2faMode(true);
            return;
          }

          localStorage.setItem("access_token", res.data.token);

          // cek status 2FA: kalau belum aktif arahkan ke halaman setup
          $.ajax({
            url: BASE_URL + "/api/auth/me",
            type: "GET",
            dataType: "json",
            success: function (me) {
              const approved = me && me.success && me.data && me.data.user
                ? String(me.data.user.approved) === "1"
                : true;

              if (!approved) {
                window.location.href = "/pending-approval";
                return;
              }

              const enabled = me && me.success && me.data && me.data.user
                ? String(me.data.user.twofa_enabled) === "1"
                : false;

              window.location.href = enabled ? "/" : "/setup-2fa";
            },
            error: function () {
              // fallback: tetap ke dashboard
              window.location.href = "/";
            }
          });
        },
        error: function (xhr) {
          showError(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Login gagal");
        }
      });

      return;
    }

    // verify 2FA
    var code = $("#login-2fa-code").val();

    $.ajax({
      url: BASE_URL + "/api/auth/2fa/verify",
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      headers: { Authorization: "Bearer " + tempToken },
      data: JSON.stringify({ code: code }),
      success: function (res) {
        if (!res || !res.success || !res.data || !res.data.token) {
          showError("Verifikasi 2FA gagal");
          return;
        }

        localStorage.setItem("access_token", res.data.token);
        tempToken = null;

        // setelah verifikasi 2FA (login), masuk dashboard
        window.location.href = "/";
      },
      error: function (xhr) {
        showError(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Verifikasi 2FA gagal");
      }
    });
  });
});
