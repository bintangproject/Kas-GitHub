const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUd2C4ViGifq1vrsrb289YJrneXbDSZIeILPLdODsGUQc9stAkW3c81olii9CVIoOs/exec";

// Fungsi Penghubung (API Bridge) ke Google Apps Script
async function fetchServer(action, payload = {}) {
  try {
  const response = await fetchServer('simpanTransaksasi', data);
  
  // Menggunakan teks langsung agar pasti muncul tulisan yang benar
  tampilkanNotifikasi("Transaksi berhasil disimpan di buku kas!", "success");
  
  document.getElementById('formKas').reset();
  
  // Setel ulang input tanggal ke hari ini setelah reset
  var today = new Date().toISOString().split('T')[0];
  var elTanggal = document.getElementById('tanggal');
  if (elTanggal) elTanggal.value = today;

  muatRekapData(); 
} catch (error) {
  tampilkanNotifikasi("Gagal: " + error.message, "danger");
}

var semuaDataRiwayat = []; 
var jumlahDataDitampilkan = 10; 

window.onload = function() {
  muatRekapData();
  
  // Set default tanggal hari ini saat pertama buka
  var today = new Date().toISOString().split('T')[0];
  var elTanggal = document.getElementById('tanggal');
  if (elTanggal) {
    elTanggal.value = today;
  }
};

function formatRupiahInput(input) {
  var value = input.value.replace(/[^0-9]/g, '');
  input.value = value ? new Intl.NumberFormat('id-ID').format(value) : '';
}

function tampilkanNotifikasi(pesan, tipe = "success") {
  var alertBox = document.getElementById('appAlert');
  alertBox.className = "custom-alert alert alert-" + (tipe === "success" ? "success" : "danger");
  alertBox.innerHTML = (tipe === "success" ? "<i class='fa-solid fa-check-circle me-2'></i>" : "<i class='fa-solid fa-triangle-exclamation me-2'></i>") + pesan;
  alertBox.style.display = "block";
  setTimeout(() => alertBox.style.display = "none", 4000);
}

function toggleLoadingButton(isLoading) {
  var btn = document.getElementById('btnSimpan');
  var icon = document.getElementById('btnIcon');
  var text = document.getElementById('btnText');
  btn.disabled = isLoading;
  icon.className = isLoading ? "fa-solid fa-spinner fa-spin me-2" : "fa-regular fa-floppy-disk me-2";
  text.innerText = isLoading ? "Memproses Data..." : "Simpan Transaksi";
}

// Menarik data dari Apps Script via Fetch API
async function muatRekapData() {
  try {
    const response = await fetchServer('ambilSemuaData');
    const data = response.data;
    
    document.getElementById('txtMasuk').innerText = "Rp " + data.totalMasuk;
    document.getElementById('txtKeluar').innerText = "Rp " + data.totalKeluar;
    document.getElementById('txtSaldo').innerText = "Rp " + data.saldoAkhir;
    
    semuaDataRiwayat = data.riwayat; 
    jumlahDataDitampilkan = 10; 
    renderTabel();
  } catch (error) {
    tampilkanNotifikasi("Gagal memuat data: " + error.message, "danger");
  }
}

function renderTabel() {
  var container = document.getElementById('tabelRiwayat');
  
  if (semuaDataRiwayat.length === 0) {
    container.innerHTML = "<tr><td colspan='5' class='text-center py-5 text-muted'><i class='fa-regular fa-folder-open mb-2 d-block fa-2x'></i>Belum ada data transaksi tercatat.</td></tr>";
    document.getElementById('btnLoadMore').style.display = "none";
    document.getElementById('txtInfoData').innerText = "";
    return;
  }

  var htmlTabel = semuaDataRiwayat.slice(0, jumlahDataDitampilkan).map(row => {
    var tipe = row.jenis;
    var classBadge = tipe === "masuk" ? "badge-nominal-masuk" : (tipe === "keluar" ? "badge-nominal-keluar" : "badge-nominal-netral");
    var cellNominal = `<span class="badge-nominal ${classBadge}">${row.nominal}</span>`;
    
    // Memisah tanggal dan jam jika dikirim berjarak spasi dari server
    var tglFormatted = row.tanggal.replace(" ", "<br><small class='text-muted'>");
    if(row.tanggal.includes(" ")) {
      tglFormatted += "</small>";
    }
    
    return `<tr>
      <td class="text-secondary small px-4">${tglFormatted}</td>
      <td class="fw-semibold text-dark">${row.rincian}</td>
      <td>${cellNominal}</td>
      <td class="text-muted small"><i class="fa-regular fa-user me-1"></i>${row.pj}</td>
      <td class="fw-bold text-dark px-4">${row.saldo}</td>
    </tr>`;
  }).join("");

  container.innerHTML = htmlTabel;

  var hasMore = semuaDataRiwayat.length > jumlahDataDitampilkan;
  document.getElementById('btnLoadMore').style.display = hasMore ? "inline-block" : "none";
  document.getElementById('txtInfoData').innerText = hasMore ? 
    `Menampilkan ${jumlahDataDitampilkan} dari ${semuaDataRiwayat.length} transaksi.` : 
    `Menampilkan seluruh data (${semuaDataRiwayat.length} transaksi).`;
    
  document.getElementById('inputCari').value = "";
}

function tampilkanLebihBanyak() {
  jumlahDataDitampilkan += 10; 
  renderTabel();
}

function filterTabel() {
  var input = document.getElementById("inputCari").value.toUpperCase();
  if(!input) return renderTabel();

  document.getElementById('btnLoadMore').style.display = "none";
  var htmlTabel = semuaDataRiwayat.filter(row => {
    return Object.values(row).join(" ").toUpperCase().includes(input);
  }).map(row => {
    var classBadge = row.jenis === "masuk" ? "badge-nominal-masuk" : (row.jenis === "keluar" ? "badge-nominal-keluar" : "badge-nominal-netral");
    return `<tr>
      <td class="text-secondary small px-4">${row.tanggal}</td>
      <td class="fw-semibold text-dark">${row.rincian}</td>
      <td><span class="badge-nominal ${classBadge}">${row.nominal}</span></td>
      <td class="text-muted small"><i class="fa-regular fa-user me-1"></i>${row.pj}</td>
      <td class="fw-bold text-dark px-4">${row.saldo}</td>
    </tr>`;
  }).join("");
  
  document.getElementById("tabelRiwayat").innerHTML = htmlTabel || "<tr><td colspan='5' class='text-center text-muted py-4'>Transaksi tidak ditemukan.</td></tr>";
}

async function submitForm() {
  var now = new Date();
  // Mengambil jam, menit, detik saat ini (format HH:mm:ss)
  var jamSekarang = now.toTimeString().split(' ')[0];

  var data = {
    tanggal: document.getElementById('tanggal').value, 
    jam: jamSekarang, // Mengirimkan jam real-time saat klik simpan
    jenis: document.getElementById('jenis').value,
    jumlah: document.getElementById('jumlah').value, 
    rincian: document.getElementById('rincian').value,
    pj: document.getElementById('pj').value,
    keterangan: document.getElementById('keterangan').value
  };

  // Mandatory check untuk tanggal, nominal, rincian, dan PJ
  if(!data.tanggal || !data.jumlah || !data.rincian || !data.pj) {
    return tampilkanNotifikasi("Mohon lengkapi tanggal, nominal, rincian, dan PJ!", "danger");
  }

  toggleLoadingButton(true);

  try {
    const response = await fetchServer('simpanTransaksasi', data);
    tampilkanNotifikasi(response.message, "success");
    
    document.getElementById('formKas').reset();
    
    // Setel ulang input tanggal ke hari ini setelah form di-reset
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal').value = today;

    muatRekapData(); 
  } catch (error) {
    tampilkanNotifikasi("Gagal: " + error.message, "danger");
  } finally {
    toggleLoadingButton(false);
  }
}
