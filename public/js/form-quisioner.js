const pengajarStatus = [];




function renderTabelRating(parsedData, pengajarStatus) {
  const $tbody = $('#tabel-rating tbody');
  $tbody.empty();

  const kategoriPrefix = ['I.', 'II.', 'III.'];
  let x = 1
  parsedData.forEach((kategoriObj, kategoriIdx) => {


    const kategoriNama = kategoriObj.kategori;
    const data = kategoriObj.data;
    const prefix = kategoriPrefix[kategoriIdx] || '';
    const hasSubkategori = prefix === 'II.' || prefix === 'III.';
    const isKategoriII = kategoriNama === 'Tenaga Pelatih';

    // HEADER KATEGORI
    let $kategoriHeader;
    if (prefix == 'II.') {
      let thPengajar = pengajarStatus.map(p => `<th>${p.nama}</th>`).join('');
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

      // SUB HEADER
      if (prefix == 'II.' || prefix == 'III.') {
        const $subHeader = $(`
          <tr class="subkategori-header table-secondary" data-sub="${subId}">
            <td><b>${String.fromCharCode(subCharCode)}</b></td>
            <td colspan="${pengajarStatus.length + 1}">
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

      // PERTANYAAN
      pertanyaanArr.forEach((pertanyaan, qIdx) => {

        let $row = $('<tr class="pertanyaan-row"></tr>');

        if (isKategoriII) {
          $row.append(`<td>${qIdx + 1}</td>`);
          $row.append(`<td class="w-40 text-wrap">${pertanyaan}</td>`);

          pengajarStatus.forEach(p => {
            let disabled = false;
            if (p.status === "1") {
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
        x++
        if (isKategoriII) $row.attr('data-sub', subId);
        $tbody.append($row);
      });



    });
    let colspan = isKategoriII ? pengajarStatus.length + 2 : 2 + 99; // 2 untuk nomor + pertanyaan
    const $komentarRow = $(`
      <tr class="komentar-row table-info">
        <td colspan="${colspan}">
          <textarea class="form-control form-control-sm w-100 jawaban-rating" placeholder="Komentar / saran tambahan mengenai ${kategoriNama}"></textarea>
        </td>
      </tr>
    `);
    $tbody.append($komentarRow);
  });

  // TOGGLE KATEGORI
  $tbody.off('click', '.toggle-kategori').on('click', '.toggle-kategori', function () {
    const $btn = $(this);
    const $tr = $btn.closest('tr');
    const isOpen = $btn.attr('data-status') === '-';

    $btn.html(isOpen ? `<i class="fas fa-plus-circle"></i>` : `<i class="fas fa-minus-circle"></i>`);
    $btn.attr('data-status', isOpen ? '+' : '-');

    let next = $tr.next();
    while (next.length && !next.hasClass('kategori-header')) {
      next.css('display', isOpen ? 'none' : 'table-row');
      next = next.next();
    }
  });

  // TOGGLE SUB KATEGORI
  $tbody.off('click', '.toggle-sub').on('click', '.toggle-sub', function () {
    const $btn = $(this);
    const $tr = $btn.closest('tr');
    const subId = $tr.data('sub');
    const isOpen = $btn.attr('data-status') === '-';

    $btn.html(isOpen ? `<i class="fas fa-plus-circle"></i>` : `<i class="fas fa-minus-circle"></i>`);
    $btn.attr('data-status', isOpen ? '+' : '-');

    $tbody.find(`.pertanyaan-row[data-sub="${subId}"]`).css('display', isOpen ? 'none' : 'table-row');
  });
}

$('#btn-navigation-a').click(function (e) {
  e.preventDefault();
  if ($(this).html() == 'Simpan') {

    if ($(this).html() === 'Simpan') {
      const collection = {
        id_si: $('#informasi').val(),     // dari select #informasi
        id_transact: $('#pelatihan').val(), // dari select #pelatihan
        jawaban: [],
        komentar: ''
      };

      const komentarList = [];

      $('.jawaban-rating').each(function () {
        const $el = $(this);

        if ($el.is('select')) {
          const ratingValue = $el
            .next('.br-widget')
            .find('a.br-selected.br-current')
            .data('rating-value');

          if (ratingValue !== undefined) {
            const item = {
              id_pertanyaan: $el.data('id'),
              jawaban: ratingValue
            };

            if ($el.data('tenaga') !== undefined) {
              item.tng_spec = $el.data('tenaga');
            }

            collection.jawaban.push(item);
          }
        } else if ($el.is('textarea')) {
          const komentar = ($el.val() || '').trim();
          if (komentar) komentarList.push(komentar);
        }
      });

      collection.komentar = komentarList.join('<br>');

      $.ajax({
        url: BASE_URL + "/api/transact-jawaban/bulk",
        type: "POST",
        dataType: "JSON",
        contentType: "application/json; charset=UTF-8",
        data: JSON.stringify(collection),

        success: function (res, textStatus, xhr) {
          // pastikan status 201 + response success true
          if (xhr.status === 201 && res.success) {
            // refresh halaman pake location.href
            location.href = location.href;
          } else {
            console.warn("Response tidak sesuai ekspektasi:", res);
          }
        },

        error: function (xhr) {
          console.error("Gagal simpan:", xhr.status, xhr.responseText);
        }
      });

    }



  } else {
    $(this).html('Simpan');
    $(this).attr('id', 'simpan-penilaian');
    $('#bag-data').removeAttr('hidden').show();
  }

});


$(function () {
  $('#content-title').html('Form Quisioner')
  $.ajax({
    type: "get",
    url: BASE_URL + "/api/master-si",
    dataType: "JSON",
    success: function (response) {
      if (response?.data && response.data.length > 0) {
        $('#informasi').html("")
        response.data.forEach(item => {
          $('#informasi').append(
            $('<option>', {
              value: item.id, // bisa diganti ID jika ada
              text: item.nama_media
            })
          )
        })
      }
    }
  });

  $.ajax({
    type: "get",
    url: BASE_URL + "/api/master-transact-pelatihan",
    dataType: "JSON",
    success: function (response) {
      // cek data dulu
      if (response?.data && response.data.length > 0) {
        let i = 0
        response.data.forEach(item => {
          // data
          $('#pelatihan').append(
            $('<option>', {
              value: item.id, // bisa diganti ID jika ada
              text: item.nama_pelatihan
            }).attr({
              'data-start': item.start_date,
              'data-end': item.end_date
            })
          )
          if (i == 0) {
            $('#tanggal').val(`${item.start_date} s/d \n${item.end_date}`)
          }

          if (item?.g_tenaga && item.g_tenaga.length > 0) {
            if (i == 0) {
              $('#data-instruktur').html("")
            }
            item.g_tenaga.forEach(g => {
              //tenaga
              if (i == 0) {
                $('#data-instruktur').append(`
                  <span class="badge btn btn-primary"><i class="fas fa-user"></i> ${g.nama}</span>
                  `)
              }
            });
            i++;
          } else {
            console.log("Tidak ada pengajar");
          }
        });
      } else {
        console.log("Data kosong atau null");
      }

    }
  });

  // $.get(BASE_URL+'/api/kategori/view', function (res) {
  //     const parsedData = res.data.map(item => {
  //     let parsed = {};

  //     try {
  //       parsed = item.data ? JSON.parse(item.data) : {};
  //     } catch (e) {
  //       console.error('JSON parse error kategori:', item.kategori_id);
  //     }

  //     return {
  //       ...item,
  //       data: parsed
  //     };
  //   });
  //   // console.log(JSON.stringify(parsedData))
  //   // renderTabelRating(parsedData, pengajarStatus)
  //   // $('#form-content .rating').barrating({
  //   //   theme: 'fontawesome-stars',
  //   //   initialRating: 0,
  //   //   showSelectedRating: false,
  //   //   onSelect: function (value) {
  //   //     console.log('Rating dipilih:', value);
  //   //   }
  //   // });
  // })
  $('#form-content #tabel-rating').find('.br-widget').addClass('text-center');
  $('#form-content #tabel-rating tbody').find('.toggle-kategori').click();
});

$("#bag-data #pelatihan").change(function () {
  // $(this).val();

  $("#form-footer #simpan-penilaian").removeAttr("disabled");

  $('#bag-quisioner').removeAttr('hidden').show();
  $.ajax({
    type: "get",
    url: BASE_URL + "/api/master-transact-pelatihan/" + $(this).val(),
    dataType: "JSON",
    success: function (response) {
      // console.log(response.data.length);
      if (response?.data) {

        $('#bag-data #data-instruktur').html("")
        $('#bag-data #tanggal').html("")
        $('#bag-data #tanggal').val(`${response.data.start_date} s/d \n${response.data.end_date}`)

        response.data.g_tenaga.forEach(g => {
          $('#bag-data #data-instruktur').append(`
                      <span class="badge btn btn-primary"><i class="fas fa-user"></i> ${g.nama}</span>
                      `)
        });


        $.get(BASE_URL + '/api/kategori/view', function (res) {
          const parsedData = res.data.map(item => {
            let parsed = {};

            try {
              parsed = typeof item.data === 'string'
                ? JSON.parse(item.data)
                : item.data; // ✅ langsung pakai kalau sudah object
            } catch (e) {
              console.error('JSON parse error kategori:', item.kategori_id);
            }

            return {
              ...item,
              data: parsed
            };
          }
          );
          // console.log(JSON.stringify(parsedData))
          renderTabelRating(parsedData, response.data.g_tenaga)
          $('#form-content .rating').barrating({
            theme: 'fontawesome-stars',
            initialRating: 0,
            showSelectedRating: false,
            onSelect: function (value) {
              console.log('Rating dipilih:', value);
            }
          });
          $('#form-content #tabel-rating').find('.br-widget').addClass('text-center');
          $('#form-content #tabel-rating tbody').find('.toggle-kategori').click();
        })

      }

    }
  });

});

