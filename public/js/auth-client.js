(function () {
  function getToken() {
    return localStorage.getItem("access_token");
  }

  function setToken(token) {
    if (token) localStorage.setItem("access_token", token);
  }

  function clearToken() {
    localStorage.removeItem("access_token");
  }

  function redirectToLogin() {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  // Attach Authorization header to every AJAX request going to API
  $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    // Only attach token to requests to our API host
    if (options && typeof options.url === "string" && options.url.indexOf(BASE_URL) === 0) {
      var token = getToken();
      if (token) {
        jqXHR.setRequestHeader("Authorization", "Bearer " + token);
      }
    }
  });

  // Update sliding token after each AJAX completes
  $(document).ajaxComplete(function (evt, xhr) {
    try {
      var newToken = xhr && xhr.getResponseHeader && xhr.getResponseHeader("x-access-token");
      if (newToken) setToken(newToken);
    } catch (e) {}
  });

  // Redirect to login if unauthorized
  $(document).ajaxError(function (evt, xhr) {
    if (!xhr) return;
    if (xhr.status === 401 || xhr.status === 403) {
      clearToken();
      redirectToLogin();
    }
  });

  // Guard page access (except login)
  $(function () {
    if (window.location.pathname === "/login") return;

    var token = getToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    $.ajax({
      url: BASE_URL + "/api/auth/me",
      type: "GET",
      dataType: "json",
      success: function (res) {
        if (!res || !res.success) {
          clearToken();
          redirectToLogin();
          return;
        }

        // Approval + 2FA gate
        try {
          var isAdmin = res && res.data && res.data.user
            ? String(res.data.user.sub) === "1"
            : false;

          // Hide user menu if not admin
          if (!isAdmin) {
            $("#nav-menu-user").hide();
          } else {
            $("#nav-menu-user").show();
          }

          // Prevent non-admin from opening /user page
          if (!isAdmin && window.location.pathname === "/user") {
            window.location.href = "/";
            return;
          }

          var approved = res && res.data && res.data.user
            ? String(res.data.user.approved) === "1"
            : true;

          if (!approved && window.location.pathname !== "/pending-approval") {
            window.location.href = "/pending-approval";
            return;
          }

          if (approved && window.location.pathname === "/pending-approval") {
            // lanjutkan gate 2FA di bawah
          }

          var enabled = res && res.data && res.data.user
            ? String(res.data.user.twofa_enabled) === "1"
            : false;

          if (approved && !enabled && window.location.pathname !== "/setup-2fa") {
            window.location.href = "/setup-2fa";
            return;
          }

          if (enabled && window.location.pathname === "/setup-2fa") {
            window.location.href = "/";
            return;
          }
        } catch (e) {}

        // Update navbar username if exists
        if (res.data && res.data.user && res.data.user.username) {
          $("#nav-username").text(res.data.user.username);
        }
      },
      error: function () {
        clearToken();
        redirectToLogin();
      }
    });

    $("#btn-logout").on("click", function (e) {
      e.preventDefault();
      clearToken();
      window.location.href = "/login";
    });
  });

  window.AuthClient = {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken
  };
})();
