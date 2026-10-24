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
            { type: "file", name: "notes.txt", size: 1024, date: "2026-10-23", url: "files/notes.txt" }
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
    }
  ]
};
