// Dữ liệu kho lưu trữ — sửa file này rồi push để cập nhật trang.
// Thả file thật vào thư mục files/ và trỏ url đúng tên file.
window.ARCHIVE = {
  name: "My Archive",
  updated: "2026-10-24",
  categories: [
    {
      name: "Minecraft",
      versions: [
        {
          label: "1.8.9",
          entries: [
            {
              type: "folder",
              name: "Phần mềm",
              children: [
                { type: "file", name: "TickSync-1.8.9.jar", size: 15400000, date: "2026-10-24", url: "files/TickSync-1.8.9.jar" },
                { type: "file", name: "setup.exe", size: 48200000, date: "2026-10-22", url: "files/setup.exe" }
              ]
            },
            { type: "file", name: "notes.txt", size: 1024, date: "2026-10-23", url: "files/notes.txt" },
            { type: "file", name: "Slinky.zip", size: 6190753, date: "2026-10-19", url: "files/Slinky.zip" }
          ]
        },
        {
          label: "1.21",
          entries: [
            {
              type: "folder",
              name: "Phần mềm",
              children: [
                { type: "file", name: "TickSync-1.21.jar", size: 18900000, date: "2026-10-24", url: "files/TickSync-1.21.jar" }
              ]
            },
            { type: "file", name: "changelog.txt", size: 2300, date: "2026-10-24", url: "files/changelog.txt" }
          ]
        }
      ]
    },
    {
      name: "Tools",
      versions: [
        {
          label: "Tất cả",
          entries: [
            { type: "file", name: "AutoDiscordQuest.zip", size: 22472939, date: "2026-10-24", url: "files/AutoDiscordQuest.zip" }
          ]
        }
      ]
    },
    {
      name: "Resource Packs",
      versions: [
        { label: "Tất cả", entries: [] }
      ]
    },
    {
      name: "Screen Share",
      versions: [
        {
          label: "Tất cả",
          entries: [
            { type: "file", name: "BAMParser.exe", size: 3115928, date: "2026-10-21", url: "files/BAMParser.exe" },
            { type: "file", name: "Everything-1.4.1.1032.x86-Setup.exe", size: 1901912, date: "2026-10-13", url: "files/Everything-1.4.1.1032.x86-Setup.exe" },
            { type: "file", name: "USBDeview.exe", size: 132096, date: "2025-05-14", url: "files/USBDeview.exe" },
            { type: "file", name: "espouken.exe", size: 1567232, date: "2026-10-21", url: "files/espouken.exe" },
            { type: "file", name: "lsrshsetup.exe", size: 82272888, date: "2026-10-13", url: "files/lsrshsetup.exe" },
            { type: "file", name: "luyten-0.5.4.exe", size: 4396803, date: "2026-10-13", url: "files/luyten-0.5.4.exe" },
            { type: "file", name: "systeminformer-4.0.26241.138-release-setup.exe", size: 30354960, date: "2026-10-13", url: "files/systeminformer-4.0.26241.138-release-setup.exe" }
          ]
        }
      ]
    }
  ]
};
