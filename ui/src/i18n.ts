export type Language = 'id' | 'en';

export interface Translations {
  nav: {
    dashboard: string;
    sessions: string;
    chats: string;
    crm: string;
    contacts: string;
    groups: string;
    campaigns: string;
    tester: string;
    automation: string;
    integrations: string;
    infrastructure: string;
    logs: string;
  };
  common: {
    refresh: string;
    refreshing: string;
    synced: string;
    save: string;
    saving: string;
    saved: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    search: string;
    copy: string;
    copied: string;
    download: string;
    upload: string;
    actions: string;
    status: string;
    active: string;
    inactive: string;
    connected: string;
    disconnected: string;
    connecting: string;
    qrReady: string;
    online: string;
    standby: string;
    all: string;
    success: string;
    failed: string;
    warning: string;
    info: string;
    privacyOn: string;
    privacyOff: string;
    lightTheme: string;
    darkTheme: string;
    session: string;
    selectSession: string;
    coreService: string;
    noData: string;
    confirmDelete: string;
    gatewayReady: string;
    language: string;
    langIndonesian: string;
    langEnglish: string;
    searchPlaceholder: string;
    sendBroadcast: string;
    newChat: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    newSession: string;
    activeSessions: string;
    broadcastSent: string;
    totalContacts: string;
    systemHealth: string;
    trafficVolume: string;
    runningOf: string;
    messagesDispatched: string;
    acrossAllSessions: string;
    memoryHeap: string;
    quickActions: string;
    startBroadcast: string;
    manageSessions: string;
    testMessaging: string;
    viewCrm: string;
    recentActivity: string;
    noRecentActivity: string;
  };
  sessions: {
    title: string;
    subtitle: string;
    newSession: string;
    scanQrTitle: string;
    scanQrDesc: string;
    pairingCodeTitle: string;
    pairingCodeDesc: string;
    connectSession: string;
    disconnectSession: string;
    logoutSession: string;
    deleteSession: string;
    noSessions: string;
    qrExpired: string;
    phoneLabel: string;
    lastConnected: string;
    loginMethod: string;
    qrMethod: string;
    pairingMethod: string;
    phoneNumberInput: string;
    startConnecting: string;
    modalNewTitle: string;
    modalSessionId: string;
    modalSessionName: string;
  };
  chats: {
    title: string;
    subtitle: string;
    activeChats: string;
    autoReply: string;
    autoReplyOn: string;
    autoReplyOff: string;
    toggleAutoReply: string;
    sendBroadcast: string;
    newChat: string;
    searchChats: string;
    searchContacts: string;
    searchGroups: string;
    searchChannels: string;
    tabChats: string;
    tabContacts: string;
    tabGroups: string;
    tabChannels: string;
    filterAll: string;
    filterPersonal: string;
    filterGroups: string;
    filterChannels: string;
    filterUnread: string;
    noChats: string;
    noGroups: string;
    noChannels: string;
    noMessages: string;
    startConversation: string;
    refreshChat: string;
    refreshThread: string;
    typeMessage: string;
    send: string;
    attachFile: string;
    recordVoice: string;
    online: string;
    members: string;
    selfNote: string;
    newChatModalTitle: string;
    newChatPhonePlaceholder: string;
    newChatStartButton: string;
  };
  crm: {
    title: string;
    subtitle: string;
    newTask: string;
    pipelineStage: string;
    lead: string;
    prospect: string;
    customer: string;
    churned: string;
    totalLeads: string;
    pendingTasks: string;
    conversionRate: string;
    estimatedRevenue: string;
    autoDispatch: string;
    autoDispatchDesc: string;
    taskFilterAll: string;
    taskFilterPending: string;
    taskFilterCompleted: string;
    taskFilterCancelled: string;
    executeTask: string;
    cancelTask: string;
    applySequence: string;
    noTasks: string;
    noContactsInStage: string;
    timeRangeToday: string;
    timeRange7d: string;
    timeRange30d: string;
    timeRangeAll: string;
  };
  contacts: {
    title: string;
    subtitle: string;
    totalContacts: string;
    syncFromWa: string;
    exportExcel: string;
    importExcel: string;
    searchContacts: string;
    colName: string;
    colPhone: string;
    colTags: string;
    colStage: string;
    colActions: string;
    noContacts: string;
    tagInputPlaceholder: string;
  };
  groups: {
    title: string;
    subtitle: string;
    totalGroups: string;
    importMembers: string;
    exportExcel: string;
    participants: string;
    noGroups: string;
  };
  campaigns: {
    title: string;
    subtitle: string;
    newBroadcast: string;
    totalCampaigns: string;
    progress: string;
    sent: string;
    failed: string;
    statusDraft: string;
    statusRunning: string;
    statusPaused: string;
    statusCompleted: string;
    statusCancelled: string;
    startCampaign: string;
    pauseCampaign: string;
    noCampaigns: string;
  };
  tester: {
    title: string;
    subtitle: string;
    typeText: string;
    typeMedia: string;
    recipientPhone: string;
    recipientPlaceholder: string;
    messageText: string;
    mediaFile: string;
    mediaCaption: string;
    sendTest: string;
    sending: string;
    responseLog: string;
    noResponse: string;
  };
  automation: {
    title: string;
    subtitle: string;
    newRule: string;
    workingHours: string;
    workingHoursDesc: string;
    botSimulator: string;
    botSimulatorDesc: string;
    testInputPlaceholder: string;
    matchedRule: string;
    noMatch: string;
    replyPreview: string;
    configuredRules: string;
    ruleName: string;
    triggerCondition: string;
    replyAction: string;
    hitCount: string;
    status: string;
    actions: string;
    noRules: string;
    supportsSpintax: string;
  };
  integrations: {
    title: string;
    subtitle: string;
    testTrigger: string;
    addOutgoing: string;
    tabGoogleForm: string;
    tabWooCommerce: string;
    tabCf7: string;
    tabElementor: string;
    tabOutgoing: string;
    tabLogs: string;
    webhookUrlTitle: string;
    copyUrl: string;
    copiedUrl: string;
    urlHint: string;
    templateConfigTitle: string;
    templateTextLabel: string;
    supportedVars: string;
    adminPhoneLabel: string;
    saveConfig: string;
    appsScriptCodeTitle: string;
    copyScriptCode: string;
    copiedScriptCode: string;
    appsScriptGuideTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    outgoingTableTitle: string;
    outgoingSubtitle: string;
    colName: string;
    colTargetUrl: string;
    colEvents: string;
    colStatus: string;
    colActions: string;
    testPing: string;
    noOutgoing: string;
    logsTitle: string;
    colTime: string;
    colProvider: string;
    colTargetWa: string;
    colPayload: string;
    noLogs: string;
    testModalTitle: string;
    testModalDesc: string;
    testSenderName: string;
    testTargetPhone: string;
    testFormName: string;
    testSendButton: string;
  };
  infrastructure: {
    title: string;
    subtitle: string;
    createBackup: string;
    ramHeapUsed: string;
    portableStorage: string;
    uptime: string;
    totalBackups: string;
    backupsListTitle: string;
    colFileName: string;
    colSize: string;
    colCreatedAt: string;
    colAction: string;
    noBackups: string;
    downloadBackup: string;
  };
  logs: {
    title: string;
    subtitle: string;
    liveTelemetry: string;
    clearLogs: string;
    colTime: string;
    colType: string;
    colMessage: string;
    noLogs: string;
  };
}

export const translations: Record<Language, Translations> = {
  id: {
    nav: {
      dashboard: 'Dashboard',
      sessions: 'Sesi WhatsApp',
      chats: 'Obrolan (Inbox)',
      crm: 'CRM & Pipeline',
      contacts: 'Kontak',
      groups: 'Grup WhatsApp',
      campaigns: 'Broadcast Massal',
      tester: 'Message Tester',
      automation: 'Template & Auto-Reply',
      integrations: 'Webhooks & Apps Script',
      infrastructure: 'Infrastruktur',
      logs: 'Audit Logs'
    },
    common: {
      refresh: 'Refresh',
      refreshing: 'Menyegarkan...',
      synced: 'Tersinkron!',
      save: 'Simpan',
      saving: 'Menyimpan...',
      saved: 'Tersimpan!',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Edit',
      close: 'Tutup',
      search: 'Cari...',
      copy: 'Salin',
      copied: 'Tersalin!',
      download: 'Unduh',
      upload: 'Unggah',
      actions: 'Aksi',
      status: 'Status',
      active: 'Aktif',
      inactive: 'Nonaktif',
      connected: 'Terhubung',
      disconnected: 'Terputus',
      connecting: 'Menghubungkan',
      qrReady: 'QR Siap',
      online: 'Online',
      standby: 'Standby',
      all: 'Semua',
      success: 'Sukses',
      failed: 'Gagal',
      warning: 'Peringatan',
      info: 'Info',
      privacyOn: 'Privasi: ON (Alt+P)',
      privacyOff: 'Mode Privasi (Alt+P)',
      lightTheme: 'Tema Terang',
      darkTheme: 'Tema Gelap',
      session: 'Sesi',
      selectSession: 'Pilih Sesi',
      coreService: 'Layanan Utama',
      noData: 'Tidak ada data',
      confirmDelete: 'Apakah Anda yakin ingin menghapus data ini?',
      gatewayReady: 'Gateway Siap',
      language: 'Bahasa',
      langIndonesian: 'Bahasa Indonesia',
      langEnglish: 'English',
      searchPlaceholder: 'Cari obrolan, kontak, broadcast, pesan...',
      sendBroadcast: 'Kirim Broadcast',
      newChat: 'Chat Baru'
    },
    dashboard: {
      title: 'Dashboard Ringkasan',
      subtitle: 'Ringkasan instans WhatsApp, volume lalu lintas pesan, dan performa sistem.',
      newSession: 'Sesi Baru',
      activeSessions: 'Sesi Aktif',
      broadcastSent: 'Broadcast Terkirim',
      totalContacts: 'Total Kontak',
      systemHealth: 'Kesehatan Sistem',
      trafficVolume: 'Volume Pesan',
      runningOf: 'aktif dari',
      messagesDispatched: 'pesan terkirim',
      acrossAllSessions: 'di seluruh sesi WhatsApp',
      memoryHeap: 'Alokasi Memori RAM',
      quickActions: 'Aksi Cepat',
      startBroadcast: 'Kirim Broadcast',
      manageSessions: 'Kelola Sesi',
      testMessaging: 'Uji Coba Pesan',
      viewCrm: 'Lihat Pipeline CRM',
      recentActivity: 'Aktivitas Terbaru',
      noRecentActivity: 'Belum ada aktivitas tercatat.'
    },
    sessions: {
      title: 'Manajemen Sesi WhatsApp',
      subtitle: 'Kelola koneksi multi-device WhatsApp Anda, otentikasi QR Code, atau Pairing Code.',
      newSession: 'Tambah Sesi Baru',
      scanQrTitle: 'Pindai QR Code',
      scanQrDesc: 'Buka WhatsApp di HP Anda > Perangkat Tertaut > Tautkan Perangkat, lalu scan kode QR di bawah.',
      pairingCodeTitle: 'Kode Pairing WhatsApp',
      pairingCodeDesc: 'Masukkan kode berikut pada notifikasi penautan perangkat di aplikasi WhatsApp HP Anda.',
      connectSession: 'Hubungkan',
      disconnectSession: 'Putuskan',
      logoutSession: 'Keluar (Logout)',
      deleteSession: 'Hapus Sesi',
      noSessions: 'Belum ada sesi WhatsApp terdaftar. Klik "Tambah Sesi Baru" untuk menghubungkan nomor Anda.',
      qrExpired: 'QR Code telah kedaluwarsa. Klik Refresh untuk memuat ulang.',
      phoneLabel: 'Nomor HP',
      lastConnected: 'Terakhir Terhubung',
      loginMethod: 'Metode Login',
      qrMethod: 'Scan QR Code (Cepat)',
      pairingMethod: 'Gunakan Pairing Code (8 Digit)',
      phoneNumberInput: 'Nomor WhatsApp (Contoh: 6281234567890)',
      startConnecting: 'Mulai Menghubungkan',
      modalNewTitle: 'Tambah Sesi WhatsApp Baru',
      modalSessionId: 'ID Sesi (Unik, huruf kecil & angka)',
      modalSessionName: 'Nama / Label Sesi'
    },
    chats: {
      title: 'Obrolan & Kotak Masuk',
      subtitle: 'Kotak masuk percakapan WhatsApp dua arah secara real-time dan respon pelanggan.',
      activeChats: 'obrolan aktif',
      autoReply: 'Auto Reply',
      autoReplyOn: 'AKTIF',
      autoReplyOff: 'NONAKTIF',
      toggleAutoReply: 'Aktifkan / Nonaktifkan Auto Reply Sesi Ini',
      sendBroadcast: 'Kirim Broadcast',
      newChat: 'Chat Baru',
      searchChats: 'Cari chat atau nomor...',
      searchContacts: 'Cari kontak...',
      searchGroups: 'Cari grup...',
      searchChannels: 'Cari saluran...',
      tabChats: 'Chat',
      tabContacts: 'Kontak',
      tabGroups: 'Grup',
      tabChannels: 'Saluran',
      filterAll: 'Semua',
      filterPersonal: 'Pribadi',
      filterGroups: 'Grup',
      filterChannels: 'Saluran',
      filterUnread: 'Belum Dibaca',
      noChats: 'Belum ada percakapan',
      noGroups: 'Grup WhatsApp untuk sesi ini akan muncul di sini.',
      noChannels: 'Saluran yang Anda ikuti akan muncul di sini.',
      noMessages: 'Belum ada pesan',
      startConversation: 'Mulai percakapan dengan mengetik pesan di bawah!',
      refreshChat: 'Refresh Pesan',
      refreshThread: 'Segarkan Pesan',
      typeMessage: 'Ketik pesan balasan... (Shift+Enter untuk baris baru)',
      send: 'Kirim',
      attachFile: 'Lampirkan File / Gambar',
      recordVoice: 'Kirim Pesan Suara (VN)',
      online: 'online',
      members: 'anggota',
      selfNote: 'Anda (Catatan Anda)',
      newChatModalTitle: 'Mulai Obrolan WhatsApp Baru',
      newChatPhonePlaceholder: 'Contoh: 08123456789 atau 628123456789',
      newChatStartButton: 'Mulai Obrolan'
    },
    crm: {
      title: 'CRM Pipeline & Tindak Lanjut Penjualan',
      subtitle: 'Kelola prospek pelanggan, tugas follow-up berjadwal, dan pipeline konversi.',
      newTask: 'Tugas Follow-Up Baru',
      pipelineStage: 'Tahapan Pipeline',
      lead: 'Lead (Baru)',
      prospect: 'Prospek',
      customer: 'Pelanggan',
      churned: 'Batal / Churned',
      totalLeads: 'Total Prospek',
      pendingTasks: 'Tugas Menunggu',
      conversionRate: 'Tingkat Konversi',
      estimatedRevenue: 'Estimasi Omset',
      autoDispatch: 'Auto-Dispatch Otomatis',
      autoDispatchDesc: 'Kirim follow-up secara otomatis saat waktu jatuh tempo tercapai',
      taskFilterAll: 'Semua Tugas',
      taskFilterPending: 'Menunggu',
      taskFilterCompleted: 'Selesai',
      taskFilterCancelled: 'Dibatalkan',
      executeTask: 'Kirim Sekarang',
      cancelTask: 'Batalkan',
      applySequence: 'Terapkan Drip Sequence',
      noTasks: 'Tidak ada tugas follow-up dalam filter ini.',
      noContactsInStage: 'Belum ada kontak di tahapan pipeline ini.',
      timeRangeToday: 'Hari Ini',
      timeRange7d: '7 Hari Terakhir',
      timeRange30d: '30 Hari Terakhir',
      timeRangeAll: 'Semua Waktu'
    },
    contacts: {
      title: 'Manajemen Kontak',
      subtitle: 'Buku alamat pelanggan, segmentasi tag label, dan sinkronisasi kontak WhatsApp.',
      totalContacts: 'Total Kontak Tersimpan',
      syncFromWa: 'Sinkronisasi dari WA',
      exportExcel: 'Ekspor Excel (.xlsx)',
      importExcel: 'Impor Excel',
      searchContacts: 'Cari kontak berdasarkan nama atau nomor HP...',
      colName: 'NAMA KONTAK',
      colPhone: 'NOMOR WHATSAPP',
      colTags: 'TAG / SEGMEN',
      colStage: 'TAHAPAN CRM',
      colActions: 'AKSI',
      noContacts: 'Belum ada kontak. Klik "Sinkronisasi dari WA" atau impor file Excel.',
      tagInputPlaceholder: '+ Tambah Tag'
    },
    groups: {
      title: 'Grup WhatsApp',
      subtitle: 'Daftar grup WhatsApp, ekstraksi database anggota grup, dan ekspor ke Excel.',
      totalGroups: 'Total Grup',
      importMembers: 'Impor Anggota ke Kontak',
      exportExcel: 'Ekspor Excel (.xlsx)',
      participants: 'Peserta',
      noGroups: 'Belum ada grup yang ditemukan pada sesi ini.'
    },
    campaigns: {
      title: 'Broadcast Massal (Campaigns)',
      subtitle: 'Kirim pesan siaran terjadwal dengan jeda anti-banned humanis, variasi spintax, dan filter opt-out.',
      newBroadcast: 'Buat Broadcast Baru',
      totalCampaigns: 'Total Campaign',
      progress: 'Kemajuan',
      sent: 'Terkirim',
      failed: 'Gagal',
      statusDraft: 'Draft',
      statusRunning: 'Berjalan',
      statusPaused: 'Dijeda',
      statusCompleted: 'Selesai',
      statusCancelled: 'Dibatalkan',
      startCampaign: 'Mulai',
      pauseCampaign: 'Jeda',
      noCampaigns: 'Belum ada campaign broadcast. Klik "Buat Broadcast Baru" untuk memulai.'
    },
    tester: {
      title: 'Message Tester & Pengujian API',
      subtitle: 'Kirim pesan uji coba teks langsung atau lampiran file media ke nomor WhatsApp apa saja.',
      typeText: 'Pesan Teks Biasa',
      typeMedia: 'Pesan Media / Lampiran File',
      recipientPhone: 'Nomor WhatsApp Tujuan:',
      recipientPlaceholder: 'Contoh: 08123456789 atau 628123456789',
      messageText: 'Isi Pesan Uji Coba:',
      mediaFile: 'Pilih File (Gambar, Video, PDF, Audio):',
      mediaCaption: 'Keterangan / Caption Media:',
      sendTest: 'Kirim Pesan Pengujian',
      sending: 'Mengirimkan pesan...',
      responseLog: 'Respon Server & Engine:',
      noResponse: 'Tekan "Kirim Pesan Pengujian" untuk melihat respon engine.'
    },
    automation: {
      title: 'Template & Aturan Auto-Reply',
      subtitle: 'Otomatisasi balasan cerdas 24/7 dengan kata kunci, spintax, jam kerja operasional, dan auto-tagging.',
      newRule: 'Aturan Baru (New Rule)',
      workingHours: 'Pengaturan Jam Operasional & Auto-Reply',
      workingHoursDesc: 'Atur pesan otomatis saat toko/layanan Anda sedang offline atau di luar jam kerja.',
      botSimulator: 'Live Spintax & Bot Simulator',
      botSimulatorDesc: 'Ketik kata kunci untuk menguji apakah bot merespon dengan aturan yang tepat.',
      testInputPlaceholder: 'Ketik pesan masuk simulasi (misal: "halo", "harga", "katalog")...',
      matchedRule: 'Aturan yang Cocok:',
      noMatch: 'Tidak Ada Aturan yang Cocok',
      replyPreview: 'Preview Balasan Otomatis:',
      configuredRules: 'Daftar Aturan Balasan Otomatis',
      ruleName: 'NAMA ATURAN',
      triggerCondition: 'KONDISI PEMICU',
      replyAction: 'PESAN BALASAN & AKSI',
      hitCount: 'HIT COUNT',
      status: 'STATUS',
      actions: 'AKSI',
      noRules: 'Belum ada aturan auto-reply yang dibuat. Klik "Aturan Baru" untuk menambahkan.',
      supportsSpintax: 'Mendukung Spintax {Halo|Hai} dan Variabel {{name}}, {{phone}}'
    },
    integrations: {
      title: 'Webhooks & Integrasi Pihak Ketiga',
      subtitle: 'Hubungkan WhatsApp dengan Google Forms & Apps Script, WooCommerce, Contact Form 7, Elementor, atau sistem eksternal.',
      testTrigger: 'Test Trigger Webhook',
      addOutgoing: 'Tambah Outgoing Webhook',
      tabGoogleForm: 'Google Forms & Apps Script',
      tabWooCommerce: 'WooCommerce Orders',
      tabCf7: 'Contact Form 7 (WP)',
      tabElementor: 'Elementor Forms',
      tabOutgoing: 'Outgoing Webhooks',
      tabLogs: 'Log Aktivitas Ingestion',
      webhookUrlTitle: 'URL Endpoint Webhook Google Apps Script',
      copyUrl: 'Salin URL',
      copiedUrl: 'Tersalin!',
      urlHint: 'Ganti localhost dengan IP/Domain publik jika diakses dari luar jaringan lokal.',
      templateConfigTitle: 'Template Pesan WhatsApp Otomatis',
      templateTextLabel: 'Isi Pesan Balasan:',
      supportedVars: 'Variabel yang didukung:',
      adminPhoneLabel: 'Nomor WA Admin (Opsional Salinan):',
      saveConfig: 'Simpan Konfigurasi Template',
      appsScriptCodeTitle: 'Kode Google Apps Script (.gs)',
      copyScriptCode: 'Salin Kode Script',
      copiedScriptCode: 'Tersalin!',
      appsScriptGuideTitle: 'Cara Pasang Pemicu (Trigger) di Google Apps Script:',
      step1: 'Buka Google Sheet tanggapan form Anda > Pilih menu Ekstensi > Apps Script.',
      step2: 'Tempel (Paste) kode script di samping, lalu klik Simpan (Ctrl + S).',
      step3: 'Klik ikon Pemicu (Triggers / ikon jam di sidebar kiri) > Klik + Tambahkan Pemicu.',
      step4: 'Pilih fungsi onFormSubmit, Jenis Acara: Saat formulir dikirim (On form submit), lalu Simpan!',
      outgoingTableTitle: 'Daftar Langganan Outgoing Webhook',
      outgoingSubtitle: 'WhatsAman akan mengirim notifikasi JSON ke server Anda setiap kali ada event pesan baru atau perubahan sesi.',
      colName: 'NAMA WEBHOOK',
      colTargetUrl: 'TARGET URL',
      colEvents: 'EVENTS',
      colStatus: 'STATUS',
      colActions: 'AKSI',
      testPing: 'Test Ping',
      noOutgoing: 'Belum ada outgoing webhook yang terdaftar. Klik "Tambah Outgoing Webhook" untuk mendaftar.',
      logsTitle: 'Riwayat Ingestion Webhook',
      colTime: 'WAKTU',
      colProvider: 'PROVIDER',
      colTargetWa: 'TARGET WHATSAPP',
      colPayload: 'PAYLOAD / PESAN',
      noLogs: 'Belum ada log aktivitas webhook.',
      testModalTitle: 'Uji Coba Webhook Ingestion',
      testModalDesc: 'Kirim simulasi data formulir untuk memastikan WhatsApp merespon secara otomatis.',
      testSenderName: 'Nama Pengirim:',
      testTargetPhone: 'Nomor WhatsApp Tujuan:',
      testFormName: 'Judul Formulir:',
      testSendButton: 'Kirim Simulasi Webhook'
    },
    infrastructure: {
      title: 'Infrastruktur & Kesehatan Sistem',
      subtitle: 'Pantau performa engine lokal, alokasi memori RAM, direktori portable, dan cadangan database.',
      createBackup: 'Buat Cadangan (Backup)',
      ramHeapUsed: 'Memori RAM Heap',
      portableStorage: 'Penyimpanan Portable',
      uptime: 'Waktu Aktif Engine',
      totalBackups: 'Total Cadangan Data',
      backupsListTitle: 'Arsip Cadangan Data Portable',
      colFileName: 'NAMA FILE CADANGAN',
      colSize: 'UKURAN',
      colCreatedAt: 'DIBUAT PADA',
      colAction: 'AKSI',
      noBackups: 'Belum ada file cadangan data yang dibuat.',
      downloadBackup: 'Unduh (.zip)'
    },
    logs: {
      title: 'Audit Logs & Telemetri Real-time',
      subtitle: 'Pantau riwayat eksekusi sistem, audit keamanan, dan log koneksi engine WhatsApp.',
      liveTelemetry: 'Telemetri Sesi Langsung',
      clearLogs: 'Bersihkan Log Tampilan',
      colTime: 'WAKTU',
      colType: 'LEVEL',
      colMessage: 'PESAN LOG TELEMETRI',
      noLogs: 'Belum ada catatan log aktivitas.'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      sessions: 'WhatsApp Sessions',
      chats: 'Chats (Inbox)',
      crm: 'CRM & Pipeline',
      contacts: 'Contacts',
      groups: 'WhatsApp Groups',
      campaigns: 'Broadcast Campaigns',
      tester: 'Message Tester',
      automation: 'Templates & Rules',
      integrations: 'Webhooks & Apps Script',
      infrastructure: 'Infrastructure',
      logs: 'Audit Logs'
    },
    common: {
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      synced: 'Synchronized!',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved!',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      search: 'Search...',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      upload: 'Upload',
      actions: 'Actions',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting',
      qrReady: 'QR Ready',
      online: 'Online',
      standby: 'Standby',
      all: 'All',
      success: 'Success',
      failed: 'Failed',
      warning: 'Warning',
      info: 'Info',
      privacyOn: 'Privacy: ON (Alt+P)',
      privacyOff: 'Privacy Mode (Alt+P)',
      lightTheme: 'Light Theme',
      darkTheme: 'Dark Theme',
      session: 'Session',
      selectSession: 'Select Session',
      coreService: 'Core Service',
      noData: 'No data available',
      confirmDelete: 'Are you sure you want to delete this record?',
      gatewayReady: 'Gateway Ready',
      language: 'Language',
      langIndonesian: 'Bahasa Indonesia',
      langEnglish: 'English',
      searchPlaceholder: 'Search chats, contacts, broadcasts, messages...',
      sendBroadcast: 'Send Broadcast',
      newChat: 'New Chat'
    },
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Overview of your WhatsApp instances, traffic volume, and engine performance metrics.',
      newSession: 'New Session',
      activeSessions: 'Active Sessions',
      broadcastSent: 'Broadcast Sent',
      totalContacts: 'Total Contacts',
      systemHealth: 'System Health',
      trafficVolume: 'Traffic Volume',
      runningOf: 'running of',
      messagesDispatched: 'messages dispatched',
      acrossAllSessions: 'across all WhatsApp instances',
      memoryHeap: 'RAM Heap Allocation',
      quickActions: 'Quick Actions',
      startBroadcast: 'Start Broadcast',
      manageSessions: 'Manage Sessions',
      testMessaging: 'Test Messaging',
      viewCrm: 'View CRM Pipeline',
      recentActivity: 'Recent Activity',
      noRecentActivity: 'No recent activity recorded.'
    },
    sessions: {
      title: 'WhatsApp Sessions Management',
      subtitle: 'Manage your multi-device WhatsApp instances, QR Code authentication, or 8-digit Pairing Code.',
      newSession: 'Add New Session',
      scanQrTitle: 'Scan QR Code',
      scanQrDesc: 'Open WhatsApp on your phone > Linked Devices > Link a Device, then scan the QR code below.',
      pairingCodeTitle: 'WhatsApp Pairing Code',
      pairingCodeDesc: 'Enter the pairing code below in your mobile WhatsApp notification prompt.',
      connectSession: 'Connect',
      disconnectSession: 'Disconnect',
      logoutSession: 'Log Out',
      deleteSession: 'Delete Session',
      noSessions: 'No WhatsApp sessions registered yet. Click "Add New Session" to connect your number.',
      qrExpired: 'QR Code has expired. Click Refresh to reload a new QR.',
      phoneLabel: 'Phone Number',
      lastConnected: 'Last Connected',
      loginMethod: 'Authentication Method',
      qrMethod: 'Scan QR Code (Recommended)',
      pairingMethod: 'Use 8-Digit Pairing Code',
      phoneNumberInput: 'WhatsApp Phone Number (e.g. 6281234567890)',
      startConnecting: 'Start Connecting',
      modalNewTitle: 'Create New WhatsApp Instance',
      modalSessionId: 'Session ID (Unique, lowercase alphanumeric)',
      modalSessionName: 'Session Display Label'
    },
    chats: {
      title: 'Chats & Two-Way Inbox',
      subtitle: 'Real-time two-way WhatsApp conversation inbox and customer replies.',
      activeChats: 'active chats',
      autoReply: 'Auto Reply',
      autoReplyOn: 'ACTIVE',
      autoReplyOff: 'DISABLED',
      toggleAutoReply: 'Toggle Auto Reply for this session',
      sendBroadcast: 'Send Broadcast',
      newChat: 'New Chat',
      searchChats: 'Search chats or phone...',
      searchContacts: 'Search contacts...',
      searchGroups: 'Search groups...',
      searchChannels: 'Search channels...',
      tabChats: 'Chats',
      tabContacts: 'Contacts',
      tabGroups: 'Groups',
      tabChannels: 'Channels',
      filterAll: 'All',
      filterPersonal: 'Personal',
      filterGroups: 'Groups',
      filterChannels: 'Channels',
      filterUnread: 'Unread',
      noChats: 'No conversations yet',
      noGroups: 'WhatsApp groups for this session will appear here.',
      noChannels: 'WhatsApp channels you follow will appear here.',
      noMessages: 'No messages yet',
      startConversation: 'Start a conversation by typing a message below!',
      refreshChat: 'Refresh Chats',
      refreshThread: 'Refresh Thread',
      typeMessage: 'Type a message... (Shift+Enter for newline)',
      send: 'Send',
      attachFile: 'Attach File / Media',
      recordVoice: 'Send Voice Note',
      online: 'online',
      members: 'members',
      selfNote: 'You (Personal Notes)',
      newChatModalTitle: 'Start New WhatsApp Conversation',
      newChatPhonePlaceholder: 'e.g. +628123456789 or 628123456789',
      newChatStartButton: 'Start Chat'
    },
    crm: {
      title: 'CRM Pipeline & Sales Sequencer',
      subtitle: 'Manage customer leads, scheduled follow-up tasks, and conversion sales funnels.',
      newTask: 'New Follow-Up Task',
      pipelineStage: 'Pipeline Stage',
      lead: 'Lead (New)',
      prospect: 'Prospect',
      customer: 'Customer',
      churned: 'Lost / Churned',
      totalLeads: 'Total Leads',
      pendingTasks: 'Pending Tasks',
      conversionRate: 'Conversion Rate',
      estimatedRevenue: 'Est. Revenue',
      autoDispatch: 'Auto-Dispatch Daemon',
      autoDispatchDesc: 'Automatically send scheduled follow-ups when due time arrives',
      taskFilterAll: 'All Tasks',
      taskFilterPending: 'Pending',
      taskFilterCompleted: 'Completed',
      taskFilterCancelled: 'Cancelled',
      executeTask: 'Dispatch Now',
      cancelTask: 'Cancel Task',
      applySequence: 'Apply Drip Sequence',
      noTasks: 'No follow-up tasks found in this filter.',
      noContactsInStage: 'No customer contacts in this pipeline stage yet.',
      timeRangeToday: 'Today',
      timeRange7d: 'Last 7 Days',
      timeRange30d: 'Last 30 Days',
      timeRangeAll: 'All Time'
    },
    contacts: {
      title: 'Contact Management',
      subtitle: 'Customer address book, segmentation tags, and WhatsApp contact synchronization.',
      totalContacts: 'Total Stored Contacts',
      syncFromWa: 'Sync from WhatsApp',
      exportExcel: 'Export Excel (.xlsx)',
      importExcel: 'Import Excel',
      searchContacts: 'Search contacts by name or phone number...',
      colName: 'CONTACT NAME',
      colPhone: 'PHONE NUMBER',
      colTags: 'TAGS / SEGMENTS',
      colStage: 'CRM STAGE',
      colActions: 'ACTIONS',
      noContacts: 'No contacts found. Click "Sync from WhatsApp" or import an Excel spreadsheet.',
      tagInputPlaceholder: '+ Add Tag'
    },
    groups: {
      title: 'WhatsApp Groups',
      subtitle: 'WhatsApp groups directory, participant database extraction, and Excel export.',
      totalGroups: 'Total Groups',
      importMembers: 'Import Members to Contacts',
      exportExcel: 'Export Excel (.xlsx)',
      participants: 'Participants',
      noGroups: 'No WhatsApp groups found on this session.'
    },
    campaigns: {
      title: 'Broadcast Campaigns',
      subtitle: 'Scheduled automated message blast with humanized delays, variable spintax, and opt-out filters.',
      newBroadcast: 'New Broadcast',
      totalCampaigns: 'Total Campaigns',
      progress: 'Progress',
      sent: 'Sent',
      failed: 'Failed',
      statusDraft: 'Draft',
      statusRunning: 'Running',
      statusPaused: 'Paused',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      startCampaign: 'Start',
      pauseCampaign: 'Pause',
      noCampaigns: 'No broadcast campaigns created yet. Click "New Broadcast" to start.'
    },
    tester: {
      title: 'Message Tester & API Diagnostics',
      subtitle: 'Send test direct text messages or media file attachments to any WhatsApp phone number.',
      typeText: 'Standard Text Message',
      typeMedia: 'Media / File Attachment',
      recipientPhone: 'Recipient Phone Number:',
      recipientPlaceholder: 'e.g. 08123456789 or 628123456789',
      messageText: 'Test Message Content:',
      mediaFile: 'Choose File (Image, Video, PDF, Audio):',
      mediaCaption: 'Media Caption / Note:',
      sendTest: 'Send Test Message',
      sending: 'Dispatching test message...',
      responseLog: 'Server & Engine Response:',
      noResponse: 'Click "Send Test Message" to inspect engine response.'
    },
    automation: {
      title: 'Templates & Auto-Reply Rules',
      subtitle: '24/7 intelligent automated replies with keywords, dynamic spintax, working hours, and auto-tagging.',
      newRule: 'New Rule',
      workingHours: 'Working Hours & Away Bot Settings',
      workingHoursDesc: 'Configure automated away replies when your business is offline or outside office hours.',
      botSimulator: 'Live Spintax & Bot Simulator',
      botSimulatorDesc: 'Type incoming keywords to simulate bot matching logic and spintax variations in real-time.',
      testInputPlaceholder: 'Type incoming simulated message (e.g., "hello", "price", "catalog")...',
      matchedRule: 'Matched Rule:',
      noMatch: 'No Rule Matched',
      replyPreview: 'Automated Reply Preview:',
      configuredRules: 'Configured Automation Rules',
      ruleName: 'RULE NAME',
      triggerCondition: 'TRIGGER CONDITION',
      replyAction: 'REPLY & ACTIONS',
      hitCount: 'HIT COUNT',
      status: 'STATUS',
      actions: 'ACTIONS',
      noRules: 'No auto-responder rules defined yet. Click "New Rule" to automate replies.',
      supportsSpintax: 'Supports Spintax {Hello|Hi} and Variables {{name}}, {{phone}}'
    },
    integrations: {
      title: 'Webhooks & 3rd-Party Integrations',
      subtitle: 'Connect WhatsApp with Google Forms & Apps Script, WooCommerce, Contact Form 7, Elementor, or custom webhooks.',
      testTrigger: 'Test Webhook Trigger',
      addOutgoing: 'Add Outgoing Webhook',
      tabGoogleForm: 'Google Forms & Apps Script',
      tabWooCommerce: 'WooCommerce Orders',
      tabCf7: 'Contact Form 7 (WP)',
      tabElementor: 'Elementor Forms',
      tabOutgoing: 'Outgoing Webhooks',
      tabLogs: 'Ingestion Activity Logs',
      webhookUrlTitle: 'Google Apps Script Webhook Endpoint URL',
      copyUrl: 'Copy URL',
      copiedUrl: 'Copied!',
      urlHint: 'Replace localhost with your public IP/Domain when accessed from outside local network.',
      templateConfigTitle: 'Automated WhatsApp Message Template',
      templateTextLabel: 'Automated Reply Content:',
      supportedVars: 'Supported Variables:',
      adminPhoneLabel: 'Admin WhatsApp Number (Optional Copy):',
      saveConfig: 'Save Template Configuration',
      appsScriptCodeTitle: 'Google Apps Script Source Code (.gs)',
      copyScriptCode: 'Copy Script Code',
      copiedScriptCode: 'Copied!',
      appsScriptGuideTitle: 'How to Setup Trigger in Google Apps Script:',
      step1: 'Open your Google Sheet responses > Go to Extensions > Apps Script.',
      step2: 'Paste the script code from the left panel, then save (Ctrl + S).',
      step3: 'Click Triggers (clock icon on the left sidebar) > Click + Add Trigger.',
      step4: 'Select function onFormSubmit, Event type: On form submit, then Save!',
      outgoingTableTitle: 'Outgoing Webhook Subscriptions',
      outgoingSubtitle: 'WhatsAman will dispatch JSON payloads to your server on incoming messages or session state changes.',
      colName: 'WEBHOOK NAME',
      colTargetUrl: 'TARGET URL',
      colEvents: 'EVENTS',
      colStatus: 'STATUS',
      colActions: 'ACTIONS',
      testPing: 'Test Ping',
      noOutgoing: 'No outgoing webhooks registered. Click "Add Outgoing Webhook" to register an endpoint.',
      logsTitle: 'Webhook Ingestion History',
      colTime: 'TIMESTAMP',
      colProvider: 'PROVIDER',
      colTargetWa: 'TARGET WHATSAPP',
      colPayload: 'PAYLOAD / MESSAGE',
      noLogs: 'No webhook ingestion logs recorded yet.',
      testModalTitle: 'Webhook Ingestion Test',
      testModalDesc: 'Send simulated form response payload to verify automated WhatsApp reply dispatch.',
      testSenderName: 'Sender Name:',
      testTargetPhone: 'Target WhatsApp Phone:',
      testFormName: 'Form Title:',
      testSendButton: 'Send Simulated Webhook'
    },
    infrastructure: {
      title: 'Infrastructure & Engine Telemetry',
      subtitle: 'Inspect local engine performance, RAM memory allocation, portable storage directory, and backups.',
      createBackup: 'Create Backup',
      ramHeapUsed: 'RAM Heap Used',
      portableStorage: 'Portable Storage',
      uptime: 'Engine Uptime',
      totalBackups: 'Total Backups',
      backupsListTitle: 'Portable Backup Archives',
      colFileName: 'BACKUP FILE NAME',
      colSize: 'SIZE',
      colCreatedAt: 'CREATED AT',
      colAction: 'ACTION',
      noBackups: 'No backup archives created yet.',
      downloadBackup: 'Download (.zip)'
    },
    logs: {
      title: 'Audit Logs & Real-Time Telemetry',
      subtitle: 'Monitor real-time system executions, security audit events, and WhatsApp engine connectivity logs.',
      liveTelemetry: 'Live Session Telemetry',
      clearLogs: 'Clear View Logs',
      colTime: 'TIMESTAMP',
      colType: 'LEVEL',
      colMessage: 'TELEMETRY MESSAGE',
      noLogs: 'No activity logs recorded yet.'
    }
  }
};
