// $(function () {
//   $.get(BASE_URL+'/api/komentar/', function (res) {
//     if (!res.success || !res.data?.length) return;
//     $('#content-title-pelatihan').html('Data Quisioner')
//     renderTable('#table-data-quisioner', res.data,1,'btn-review-quisioner');
//   });
// });

function parseKategoriViewData(kategoriViewRes) {
  const data = kategoriViewRes?.data || [];
  return Array.isArray(data)
    ? data.map(item => {
        let parsed = {};

        try {
          parsed = typeof item.data === 'string'
            ? JSON.parse(item.data)
            : item.data;
        } catch (e) {
          parsed = {};
        }

        return {
          ...item,
          data: parsed
        };
      })
    : [];
}

function buildJawabanMap(jawaban) {
  const map = {};
  (Array.isArray(jawaban) ? jawaban : []).forEach(function (item) {
    const idPertanyaan = Number(item.id_pertanyaan);
    if (!Number.isFinite(idPertanyaan)) return;

    const tenaga = item.tng_spec != null ? String(item.tng_spec) : '';
    const val = item.jawaban != null ? String(item.jawaban) : '';
    map[`${idPertanyaan}::${tenaga}`] = val;

    if (!(idPertanyaan in map)) {
      map[idPertanyaan] = val;
    }
  });
  return map;
}

function renderTabelRatingModal(parsedData, pengajarStatus, komentarList) {
  const $tbody = $('#detail-tabel-rating tbody');
  $tbody.empty();

  const kategoriPrefix = ['I.', 'II.', 'III.'];
  let x = 1;

  parsedData.forEach((kategoriObj, kategoriIdx) => {
    const kategoriNama = kategoriObj.kategori;
    const data = kategoriObj.data || {};
    const prefix = kategoriPrefix[kategoriIdx] || '';
    const hasSubkategori = prefix === 'II.' || prefix === 'III.';
    const isKategoriII = kategoriNama === 'Tenaga Pelatih';

    let $kategoriHeader;
    if (prefix === 'II.') {
      const thPengajar = (pengajarStatus || []).map(p => `<th>${p.nama}</th>`).join('');
      $kategoriHeader = $(`
        <tr class="kategori-header table-primary">
          <th colspan="2">
            <button class="toggle-kategori btn btn-sm" data-status="-">
              <i class="fas fa-minus-circle"></i>
            </button>
            ${prefix} ${kategoriNama}
          </th>
          ${thPengajar}
        </tr>
      `);
    } else {
      $kategoriHeader = $(`
        <tr class="kategori-header table-primary">
          <th colspan="2">
            <button class="toggle-kategori btn btn-sm" data-status="-">
              <i class="fas fa-minus-circle"></i>
            </button>
            ${prefix} ${kategoriNama}
          </th>
          <th colspan="99" class="text-center">Penilaian</th>
        </tr>
      `);
    }
    $tbody.append($kategoriHeader);

    let subCharCode = 'A'.charCodeAt(0);

    Object.entries(data).forEach(([subKategoriNama, pertanyaanArr], subIdx) => {
      const subId = `${kategoriIdx}-${subIdx}`;

      if (hasSubkategori) {
        const $subHeader = $(`
          <tr class="subkategori-header table-secondary" data-sub="${subId}">
            <td><b>${String.fromCharCode(subCharCode)}</b></td>
            <td colspan="${(pengajarStatus || []).length + 1}">
              <button class="toggle-sub btn btn-sm" data-status="-">
                <i class="fas fa-minus-circle"></i>
              </button>
              <b>${subKategoriNama}</b>
            </td>
          </tr>
        `);
        $tbody.append($subHeader);
        subCharCode++;
      }

      (Array.isArray(pertanyaanArr) ? pertanyaanArr : []).forEach((pertanyaan, qIdx) => {
        let $row = $('<tr class="pertanyaan-row"></tr>');

        if (isKategoriII) {
          $row.append(`<td>${qIdx + 1}</td>`);
          $row.append(`<td class="w-40 text-wrap">${pertanyaan}</td>`);

          (pengajarStatus || []).forEach(p => {
            let disabled = false;
            if (p.status === '1') {
              if ((subIdx === 0 && [1, 2, 3].includes(qIdx)) || (subIdx === 1 && qIdx === 6)) {
                disabled = true;
              }
            }

            $row.append(disabled ? `<td></td>` : `
              <td>
                <select class="form-select form-select-sm w-100 rating text-center jawaban-rating" data-id="${x}" data-tenaga="${p.ni}">
                  <option value="">-</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </td>
            `);
          });
        } else {
          $row.append(`<td>${qIdx + 1}</td>`);
          $row.append(`<td class="w-40 text-wrap">${pertanyaan}</td>`);
          $row.append(`<td colspan="99">
            <select class="form-select form-select-sm w-100 rating text-center jawaban-rating" data-id="${x}">
              <option value="">-</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </td>`);
        }

        x++;
        if (isKategoriII) $row.attr('data-sub', subId);
        $tbody.append($row);
      });
    });

    const colspan = isKategoriII ? (pengajarStatus || []).length + 2 : 2 + 99;
    const komentarText = Array.isArray(komentarList) ? (komentarList[kategoriIdx] ?? '') : '';
    const $komentarRow = $(`
      <tr class="komentar-row table-info">
        <td colspan="${colspan}">
          <textarea class="form-control form-control-sm w-100" disabled>${komentarText}</textarea>
        </td>
      </tr>
    `);
    $tbody.append($komentarRow);
  });

  $tbody.off('click', '.toggle-kategori').on('click', '.toggle-kategori', function () {
    const $btn = $(this);
    const $tr = $btn.closest('tr');
    const isOpen = $btn.attr('data-status') === '-';

    $btn.html(isOpen ? '<i class="fas fa-plus-circle"></i>' : '<i class="fas fa-minus-circle"></i>');
    $btn.attr('data-status', isOpen ? '+' : '-');

    let next = $tr.next();
    while (next.length && !next.hasClass('kategori-header')) {
      next.css('display', isOpen ? 'none' : 'table-row');
      next = next.next();
    }
  });

  $tbody.off('click', '.toggle-sub').on('click', '.toggle-sub', function () {
    const $btn = $(this);
    const $tr = $btn.closest('tr');
    const subId = $tr.data('sub');
    const isOpen = $btn.attr('data-status') === '-';

    $btn.html(isOpen ? '<i class="fas fa-plus-circle"></i>' : '<i class="fas fa-minus-circle"></i>');
    $btn.attr('data-status', isOpen ? '+' : '-');

    $tbody.find(`.pertanyaan-row[data-sub="${subId}"]`).css('display', isOpen ? 'none' : 'table-row');
  });
}

function fillModalDetail(detail, masterTransact) {
  $('#modal-detail-quisioner #content-title').html('Form Quisioner (Detail)');

  // $('#detail-bag-konfirmasi').attr('hidden', true);
  $('#detail-bag-data').removeAttr('hidden');
  $('#detail-bag-quisioner').removeAttr('hidden');

  $('#detail-informasi').html(detail.nama_media || '-');

  if (masterTransact?.data) {
    $('#detail-pelatihan').html(masterTransact.data.nama_pelatihan || '-');
    $('#detail-tanggal').html(`${masterTransact.data.start_date || '-'} s/d <br>${masterTransact.data.end_date || '-'}`);

    if (Array.isArray(masterTransact.data.g_tenaga) && masterTransact.data.g_tenaga.length) {
      $('#detail-data-instruktur').html(masterTransact.data.g_tenaga.map(g => `- ${g.nama}`).join('<br>'));
    } else {
      $('#detail-data-instruktur').html('-');
    }
  } else {
    $('#detail-pelatihan').html(detail.nama_pelatihan || '-');
    $('#detail-tanggal').html('-');
    $('#detail-data-instruktur').html('-');
  }
}

function setJawabanToStars(detailJawaban) {
  const jawabanMap = buildJawabanMap(detailJawaban);

  $('#detail-tabel-rating select.jawaban-rating').each(function () {
    const idPertanyaan = Number($(this).data('id'));
    const tenaga = $(this).data('tenaga') != null ? String($(this).data('tenaga')) : '';

    const val = jawabanMap[`${idPertanyaan}::${tenaga}`] || jawabanMap[idPertanyaan] || '';
    $(this).val(val);
    $(this).prop('disabled', true);
  });

  $('#detail-form-content .rating').barrating({
    theme: 'fontawesome-stars',
    initialRating: 0,
    showSelectedRating: false
  });

  $('#detail-form-content #detail-tabel-rating').find('.br-widget').addClass('text-center');
}

$(function () {
  $.get(BASE_URL + '/api/komentar/', function (res) {
    if (!res.success || !res.data?.length) return;
    $('#content-title-pelatihan').html('Data Quisioner');
    renderTable('#table-data-quisioner', res.data, 1, 'btn-review-quisioner');
  });
});

$('#table-data-quisioner').on('click', '.btn-review-quisioner', function (e) {
  e.preventDefault();

  const isSearchBtn = $(this).find('i').hasClass('fa-search');
  if (!isSearchBtn) return;

  const id_komentar = $(this).data('id');
  if (!id_komentar) return;

  $.ajax({
    url: BASE_URL + '/api/komentar/detail',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=UTF-8',
    data: JSON.stringify({ id_komentar: Number(id_komentar) }),
    success: function (res) {
      if (!res.success) return;

      const detail = res.data || {};
      const komentarList = (detail.komentar || '').split('<br>');

      $.ajax({
        type: 'get',
        url: BASE_URL + '/api/master-transact-pelatihan/' + detail.id_transact,
        dataType: 'JSON',
        success: function (response) {
          if (!response?.data) return;

          fillModalDetail(detail, response);

          $.get(BASE_URL + '/api/kategori/view', function (kategoriRes) {
            const parsedData = parseKategoriViewData(kategoriRes);
            renderTabelRatingModal(parsedData, response.data.g_tenaga || [], komentarList);
            setJawabanToStars(detail.jawaban || []);

            $('#modal-detail-quisioner').modal('show');
          });
        }
      });
    }
  });
});

$('#modal-detail-quisioner').on('hidden.bs.modal', function () {
  $('#detail-informasi').html('-');
  $('#detail-pelatihan').html('-');
  $('#detail-tanggal').html('-');
  $('#detail-data-instruktur').html('-');
  $('#detail-tabel-rating tbody').html('');

  $('#detail-bag-konfirmasi').removeAttr('hidden');
  $('#detail-bag-data').attr('hidden', true);
  $('#detail-bag-quisioner').attr('hidden', true);
});

// Print only the modal content (detail form)
$('#btn-print-detail-quisioner').on('click', function () {
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) return;

  const styleLinks = $('link[rel="stylesheet"]')
    .map(function () {
      const href = $(this).attr('href');
      if (!href) return '';
      // Make absolute for printWindow (about:blank) so `/css/...` still loads.
      const absHref = href.startsWith('/') ? (window.location.origin + href) : href;
      return `<link rel="stylesheet" href="${absHref}">`;
    })
    .get()
    .join('');

  const starsText = function (val) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 1 || n > 5) return '-';
    // Use HTML entities to avoid encoding/font issues in Chrome print preview.
    return '&#9733;'.repeat(n) + '&#9734;'.repeat(5 - n);
  };

  // Clone the modal content and replace bar-rating widgets with plain text stars
  const $clone = $('#detail-form-content').clone();
  $clone.find('.toggle-kategori, .toggle-sub').remove();
  $clone.find('tr').removeAttr('style'); // ensure rows aren't hidden in print

  // Replace the whole bar-rating wrapper to avoid hidden/overlapping elements in print.
  $clone.find('.br-wrapper').each(function () {
    const $wrap = $(this);
    // Prefer bar-rating rendered state (more reliable than <select>.val()).
    const valFromWidget = $wrap
      .find('.br-widget a.br-selected')
      .last()
      .data('rating-value');
    const valFromSelect = $wrap.find('select.jawaban-rating').val();
    const val = valFromWidget != null ? valFromWidget : valFromSelect;
    $(this).replaceWith(`<div class="print-stars text-center">${starsText(val)}</div>`);
  });
  // Fallback: if there are any remaining selects (shouldn't), replace them too.
  $clone.find('select.jawaban-rating').each(function () {
    const val = $(this).val();
    $(this).replaceWith(`<div class="print-stars text-center">${starsText(val)}</div>`);
  });

  const htmlContent = `
    <div class="container-fluid mt-2">
      ${$clone.html()}
    </div>
  `;

  printWindow.document.open();
  printWindow.document.write(`
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Detail Quisioner</title>
        ${styleLinks}
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          body { padding: 0; font-size: 11px; line-height: 1.2; }
          table { width: 100% !important; margin-bottom: 6px !important; }
          th, td { padding: 4px !important; vertical-align: top; word-wrap: break-word; overflow-wrap: anywhere; }
          .toggle-kategori, .toggle-sub { display: none !important; }
          textarea { min-height: 42px !important; font-size: 10px !important; line-height: 1.2 !important; }
          #detail-form-content { height: auto !important; overflow: visible !important; }
          .print-stars { font-size: 12px; letter-spacing: 1px; color: #000; white-space: nowrap; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.onload = function () {
    printWindow.focus();
    // Give time for CSS/fonts to apply
    setTimeout(function () {
      printWindow.print();
      printWindow.close();
    }, 300);
  };
});
