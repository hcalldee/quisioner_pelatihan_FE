

window.parseDate = function (isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};


// const BASE_URL = `${window.location.protocol}//${window.location.hostname}`+':3000';
const BASE_URL = window.APP_CONFIG.BASE_URL;

window.romanNumb = function (n) {
  const romanMap = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return  romanMap[n] || '';
}

window.renderSelect = function ({
  selector,
  data,
  valueKey,
  labelKey,
  placeholder
}) {
  const options = data.map(item => `
    <option value="${item[labelKey]}">
      ${item[labelKey]}
    </option>
  `).join('');

  if (!data.length) {
    $(selector).html(`<option value="">Data tidak tersedia</option>`);
    return;
  }

  $(selector).html(`
    <option value="">${placeholder}</option>
    ${options}
  `);
};

window.renderValue = function (key, value) {
  // === G TENAGA ===
  if (key === "g_tenaga") {
    if (!Array.isArray(value) || value.length === 0) return "-";

    return value
      .map((t) => {
        if (t && typeof t === "object") {
          const nama = t.nama || t.Nama || "";
          const ni = t.ni || t.NI || "";
          const label = ni ? `${nama} | ${ni}` : String(nama || "-");
          return `
        <span class="badge btn btn-primary me-1 mb-1">
          ${label}
        </span><br>`;
        }

        return `
        <span class="badge btn btn-primary me-1 mb-1">
          ${String(t)}
        </span><br>`;
      })
      .join("");
  }

  // === STATUS TENAGA ===
  if (key === "Status") {
    return value == "0" ? "Pengajar Teori & Praktik"
      : value == "1" ? "Pengajar Teori"
      : value == "2" ? "Pengajar Praktik"
      : "-";
  }

  return value ?? "";
};
window.customaction = function (i, data_id, classbtn, opts) {
  opts = opts || {};
  const dataIdAttr =
    data_id !== undefined && data_id !== null && String(data_id).trim() !== ""
      ? ` data-id="${data_id}"`
      : "";

  const grafikButton = opts.grafik
    ? `<button class="btn btn-info btn-sm ${classbtn}"${dataIdAttr}><i class="fas fa-chart-bar"></i></button>`
    : "";

  const middleButton =
    String(i) === "1"
      ? ""
      : `<button class="btn btn-warning btn-sm ${classbtn}"${dataIdAttr}><i class="fas fa-edit"></i></button>`;

  return `
    <td>
      <button class="btn btn-success btn-sm ${classbtn}"${dataIdAttr}><i class="fas fa-search"></i></button>
      ${grafikButton}
      ${middleButton}
      <button class="btn btn-danger btn-sm ${classbtn}"${dataIdAttr}><i class="fas fa-trash"></i></button>
    </td>
  `;
};

window.renderTable = function (selector, data, i='0', classbtn="", opts) {
  const $table = $(selector);

  if ($.fn.DataTable.isDataTable($table)) {
    $table.DataTable().clear().destroy();
  }

  const keys = Object.keys(data[0]).filter(k => k !== 'id');

  const thead = `
    <thead>
      <tr>
        ${keys.map(k => `<th>${k}</th>`).join('')}
        <th>Aksi</th>
      </tr>
    </thead>
  `;

const tbody = `
  <tbody>
    ${data.map((row, index) => {
      const dataId =
        row && typeof row === "object" && Object.prototype.hasOwnProperty.call(row, "id")
          ? row.id
          : index;

      return `
        <tr>
          ${keys.map(k => `<td>${renderValue(k, row[k])}</td>`).join('')}
          ${customaction(i, dataId, classbtn, opts)}
        </tr>
      `;
    }).join('')}
  </tbody>
`;

  $table.html(thead + tbody);

  $table.DataTable({
    responsive: true,
    pageLength: 10,
    autoWidth: false
  });
};



// === SWEETALERT HELPERS ===
window.swalMsg = function (icon, title, text) {
  if (typeof Swal === "undefined") {
    alert((title ? title + ": " : "") + (text || ""));
    return;
  }

  return Swal.fire({
    icon: icon || "info",
    title: title || "",
    text: text || "",
    confirmButtonText: "OK"
  });
};

window.swalConfirm = function (text, title) {
  if (typeof Swal === "undefined") {
    return Promise.resolve({ isConfirmed: confirm(text) });
  }

  return Swal.fire({
    title: title || "Konfirmasi",
    text: text || "Anda yakin?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Tidak"
  });
};
