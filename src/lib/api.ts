import { Platform } from 'react-native';

import { deleteStoredItem, getStoredItem, setStoredItem } from './storage';

const TOKEN_KEY = 'aksara_auth_token';
const API_URL_KEY = 'aksara_api_url';

export interface GtkInfo {
  id: number;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  jenis_gtk: string;
}

export interface SiswaInfo {
  id: number;
  nis: string;
  nisn: string | null;
  nik?: string | null;
  nama: string;
  jenis_kelamin?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  agama?: string | null;
  kelas: string | null;
  wali_kelas: string | null;
  status?: string | null;
}

export interface UserProfile {
  id: number;
  role: 'guru' | 'siswa';
  name: string;
  email: string | null;
  gtk: GtkInfo | null;
  siswa: SiswaInfo | null;
}

export interface SiswaBerandaResponse {
  siswa: SiswaInfo;
  tahun_ajaran: string | null;
  semester: string;
  ringkasan: {
    presensi_bulan_ini: { hadir: number; sakit: number; izin: number; alpa: number };
    rata_rata: number | null;
    peringkat: number | null;
    total_tagihan_sisa: number;
    saldo_tabungan: number;
    poin_pelanggaran: number;
    jumlah_prestasi: number;
  };
}

export interface SiswaPresensiResponse {
  semester: string;
  rekap: { hadir: number; sakit: number; izin: number; alpa: number };
  riwayat: {
    id: number;
    tanggal: string;
    status: string;
    status_label: string;
    terlambat_menit: number;
    catatan: string | null;
  }[];
}

export interface SiswaNilaiResponse {
  semester_aktif: number;
  semester_opsi: Record<string, string>;
  peringkat: number | null;
  jumlah_siswa_kelas: number;
  jumlah: number;
  rata_rata: number | null;
  catatan_wali_kelas: string | null;
  catatan_orang_tua: string | null;
  keputusan: string | null;
  mapel: {
    id: number;
    mapel: string;
    kkm: number;
    nilai_pengetahuan: number | null;
    nilai_keterampilan: number | null;
    nilai_akhir: number | null;
    sikap: string | null;
    capaian_kompetensi: string | null;
  }[];
}

export interface SiswaEkskulResponse {
  ekskul: {
    id: number;
    nama: string;
    pembina: string | null;
    jabatan: string;
    nilai: string | null;
    keterangan: string | null;
  }[];
}

export interface SiswaCatatanResponse {
  total_poin_pelanggaran: number;
  pelanggaran: {
    id: number;
    tanggal: string;
    kategori: string;
    pelanggaran: string;
    poin: number;
    tindak_lanjut: string | null;
    status: string;
  }[];
  prestasi: {
    id: number;
    tanggal: string;
    nama_prestasi: string;
    tingkat: string;
    peringkat: string | null;
    penyelenggara: string | null;
    keterangan: string | null;
  }[];
}

export interface SiswaKeuanganResponse {
  total_sisa_tagihan: number;
  tagihan: {
    id: number;
    nama: string;
    periode: string;
    nominal: number;
    terbayar: number;
    sisa: number;
    status: string;
    jatuh_tempo: string;
  }[];
  saldo_tabungan: number;
  tabungan: {
    id: number;
    tanggal: string;
    jenis: 'setor' | 'tarik';
    nominal: number;
    keterangan: string | null;
  }[];
}

export interface PengumumanItem {
  id: number;
  judul: string;
  isi: string;
  tujuan: 'guru' | 'siswa' | 'semua';
  tujuan_label: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  pembuat: string | null;
  created_at: string | null;
}

export interface PengumumanResponse {
  pengumuman: PengumumanItem[];
}

export interface SiswaNotifikasiItem {
  id: number;
  kategori: string;
  judul: string;
  isi: string;
  dibaca_at: string | null;
  created_at: string | null;
}

export interface SiswaNotifikasiResponse {
  unread_count: number;
  items: SiswaNotifikasiItem[];
}

export interface GuruKeuanganResponse {
  ringkasan: {
    total_diterima: number;
    total_belum_dibayar: number;
    jumlah_slip: number;
  };
  slip: {
    id: number;
    periode: string;
    gaji_pokok: number;
    tunjangan: number;
    potongan: number;
    bersih: number;
    sudah_dibayar: boolean;
    tanggal_bayar: string | null;
    catatan: string | null;
  }[];
}

export interface TahunAjaranInfo {
  id: number;
  nama: string;
  semester: string;
}

export interface PelajaranItem {
  id: number;
  jp_ke: number;
  waktu: string | null;
  mulai?: string | null;
  selesai?: string | null;
  kelas: string;
  mapel: string;
  singkatan: string | null;
}

export interface PengaturanPresensiInfo {
  aktif: boolean;
  nama_lokasi: string;
  latitude: number | null;
  longitude: number | null;
  radius_meter: number;
  jam_mulai: string;
  jam_selesai: string;
  wajib_foto: boolean;
}

export interface BerandaResponse {
  tanggal: string;
  hari_ini: string;
  peran: {
    is_wali_kelas: boolean;
    is_piket: boolean;
    is_pembina_ekskul: boolean;
    kelas_perwalian: { id: number; nama: string }[];
    ekskul_binaan: { id: number; nama: string }[];
  };
  kehadiran_gtk_hari_ini: {
    status: string;
    label: string;
    dicatat_pada: string | null;
    jarak_meter?: number | null;
    punya_foto?: boolean;
    foto_url?: string | null;
  } | null;
  pengaturan_presensi?: PengaturanPresensiInfo;
  tugas: {
    total: number;
    selesai: number;
    belum: number;
    persen: number;
    items: {
      id: string;
      kategori: string;
      judul: string;
      ringkasan: string;
      status: 'selesai' | 'sebagian' | 'belum';
      labelStatus: string;
    }[];
  };
  jadwal_hari_ini: PelajaranItem[];
  agenda: {
    id: number;
    nama: string;
    rentang: string;
    jenis: string;
    keterangan: string | null;
  }[];
}

export interface JadwalHari {
  hari: number;
  label: string;
  pelajaran: PelajaranItem[];
}

export interface JadwalResponse {
  jadwal_terbit: boolean;
  hari_ini: { hari: number; label: string } | null;
  hari: JadwalHari[];
}

export interface KelasOption {
  id: number;
  nama: string;
  tingkat: number;
}

export interface PresensiOpsiResponse {
  tanggal: string;
  piket: boolean;
  status_opsi: Record<string, string>;
  kelas: KelasOption[];
}

export interface PresensiSiswaRow {
  siswa_id: number;
  nis: string | null;
  nama: string;
  status: string | null;
  terlambat_menit: number;
  catatan: string | null;
}

export interface PresensiSheetResponse {
  tanggal: string;
  kelas: { id: number; nama: string };
  versi: string;
  siswa: PresensiSiswaRow[];
}

export interface PertemuanItem {
  sumber_jadwal: string;
  guru_id: number;
  kelas_id: number;
  nama_guru: string;
  nama_kelas: string;
  nama_mapel: string;
  jp_mulai: number;
  jp_selesai: number;
  waktu: string | null;
  status: string;
  materi: string | null;
  kegiatan: string | null;
  refleksi: string | null;
  tindak_lanjut: string | null;
  alasan: string | null;
  pelaksana_id: number | null;
}

export interface JurnalListResponse {
  tanggal: string;
  piket: boolean;
  gemini_aktif?: boolean;
  status_opsi: Record<string, string>;
  guru_opsi: { id: number; nama: string }[];
  pertemuan: PertemuanItem[];
}

export interface KehadiranGtkResponse {
  tanggal: string;
  bisa_catat_piket: boolean;
  pengaturan_presensi?: PengaturanPresensiInfo;
  status_opsi: Record<string, string>;
  gtk_opsi: { id: number; nama: string }[];
  riwayat: {
    id: number;
    tanggal: string;
    gtk_id: number;
    gtk_nama: string;
    status: string;
    status_label: string;
    catatan: string | null;
    jarak_meter?: number | null;
    punya_foto?: boolean;
    foto_url?: string | null;
    waktu: string | null;
  }[];
}

export interface PiketResponse {
  tanggal: string;
  jenis_opsi: Record<string, string>;
  kelas_opsi: { id: number; nama: string }[];
  gtk_opsi: { id: number; nama: string }[];
  catatan: {
    id: number;
    tanggal: string;
    jenis: string;
    jenis_label: string;
    kelas: string | null;
    siswa: string | null;
    gtk: string | null;
    kejadian: string;
    tindak_lanjut: string | null;
    terlambat_menit: number;
    jam_pelajaran: string | null;
  }[];
}

export interface PermintaanJadwalResponse {
  jenis_opsi: Record<string, string>;
  sifat_opsi: Record<string, string>;
  hari_opsi: Record<string, string>;
  mapel_opsi: Record<string, string>;
  items: {
    id: number;
    jenis: string;
    jenis_label: string;
    sifat: string;
    sifat_label: string;
    hari: number[];
    jp_mulai: number | null;
    jp_selesai: number | null;
    mapel: string | null;
    keterangan: string | null;
    is_aktif: boolean;
  }[];
}

export interface NilaiOpsiResponse {
  tahun_ajaran_aktif_id: number | null;
  semester_aktif: number;
  semester_opsi: Record<string, string>;
  penugasan: {
    tahun_ajaran_id: number;
    tahun_ajaran: string;
    kelas_id: number;
    kelas: string;
    mata_pelajaran_id: number;
    mapel: string;
    kkm: number;
  }[];
  kelas_perwalian: { id: number; nama: string }[];
}

export interface NilaiSheetResponse {
  kkm: number;
  kolom_nilai: Record<string, string>;
  pakai_predikat: boolean;
  pakai_capaian?: boolean;
  predikat_sikap: string[];
  siswa: {
    siswa_id: number;
    nis: string | null;
    nama: string;
    terkunci: boolean;
    nilai_pengetahuan: number | null;
    nilai_keterampilan: number | null;
    nilai_akhir: number | null;
    sikap: string | null;
    capaian_kompetensi: string | null;
  }[];
}

export interface LegerResponse {
  judul: string;
  keterangan_kolom: string;
  mapel: { id: number; nama: string; singkatan: string | null }[];
  baris: {
    siswa_id: number;
    nis: string | null;
    nama: string;
    jumlah: number;
    rata_rata: number | null;
    peringkat: number | null;
    nilai: { mapel_id: number; skor: Record<string, number | null>; kkm: number }[];
  }[];
}

export interface RaporResponse {
  keputusan_opsi: Record<string, string>;
  rapor: {
    id: number;
    siswa_id: number;
    nis: string | null;
    nama: string;
    sakit: number;
    izin: number;
    tanpa_keterangan: number;
    catatan: string | null;
    keputusan: string | null;
    keputusan_label: string | null;
  }[];
}

export interface PerangkatResponse {
  tahun_ajaran: string | null;
  ringkasan: BerandaResponse['tugas'];
  penugasan: { id: number; kelas: string; mapel: string; singkatan: string | null }[];
  dokumen: {
    atp: number;
    prota: number;
    prosem: number;
    perangkat_ajar: number;
  };
}

export interface OrganisasiResponse {
  tanggal: string;
  ekskul: {
    id: number;
    nama: string;
    anggota_count: number;
    kegiatan: {
      id: number;
      tanggal: string;
      materi: string;
      jumlah_hadir: number;
      catatan: string | null;
    }[];
  }[];
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function defaultApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured && configured.trim() !== '') {
    return configured.replace(/\/+$/, '');
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://127.0.0.1:8000/api/v1';
}

export async function getApiUrl(): Promise<string> {
  const saved = await getStoredItem(API_URL_KEY);
  return saved && saved.trim() !== '' ? saved.replace(/\/+$/, '') : defaultApiUrl();
}

export function resolveMediaUrl(url: string, activeApiUrl: string): string {
  const apiIndex = url.indexOf('/api/v1');
  if (apiIndex !== -1) {
    return `${activeApiUrl.replace(/\/+$/, '')}${url.slice(apiIndex + '/api/v1'.length)}`;
  }
  return url;
}

export async function setApiUrl(url: string): Promise<void> {
  const normalized = url.trim().replace(/\/+$/, '');
  if (normalized === '') {
    await deleteStoredItem(API_URL_KEY);
    return;
  }
  await setStoredItem(API_URL_KEY, normalized);
}

export async function getToken(): Promise<string | null> {
  return getStoredItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await setStoredItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await deleteStoredItem(TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const baseUrl = await getApiUrl();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (options.auth !== false) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = {};
    }
  }

  if (!response.ok) {
    const errors = json.errors as Record<string, string[]> | undefined;
    const firstError = errors ? Object.values(errors).flat()[0] : undefined;
    const message =
      firstError ||
      (typeof json.message === 'string' && json.message) ||
      `Permintaan gagal (${response.status})`;
    throw new ApiError(message, response.status, errors);
  }

  return json as T;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const baseUrl = await getApiUrl();
  const token = await getToken();

  if (Platform.OS === 'web') {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await response.text();
    let json: Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        json = {};
      }
    }

    if (!response.ok) {
      const errors = json.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors).flat()[0] : undefined;
      const message =
        firstError ||
        (typeof json.message === 'string' && json.message) ||
        `Unggahan gagal (${response.status})`;
      throw new ApiError(message, response.status, errors);
    }

    return json as T;
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}${path}`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      let json: Record<string, unknown> = {};
      if (xhr.responseText) {
        try {
          json = JSON.parse(xhr.responseText) as Record<string, unknown>;
        } catch {
          json = {};
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(json as T);
        return;
      }

      const errors = json.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors).flat()[0] : undefined;
      const message =
        firstError ||
        (typeof json.message === 'string' && json.message) ||
        `Unggahan gagal (${xhr.status})`;
      reject(new ApiError(message, xhr.status, errors));
    };

    xhr.onerror = () => {
      reject(new ApiError('Koneksi ke server gagal saat mengunggah foto.', 0));
    };

    xhr.send(formData);
  });
}
