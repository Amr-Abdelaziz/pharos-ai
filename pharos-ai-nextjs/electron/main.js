const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const DEV_URL = 'http://localhost:3000';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#1C2127',   // Blueprint dark — no white flash on load
    titleBarStyle: 'hiddenInset', // macOS: traffic lights inset, no ugly bar
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Pharos Intelligence — Operation Epic Fury',
    show: false, // wait for ready-to-show to avoid white flash
  });

  // Remove default app menu (File/Edit/View etc.)
  Menu.setApplicationMenu(null);

  // Load the Next.js dev server
  win.loadURL(DEV_URL);

  // Show only when content is ready — no white flash
  win.once('ready-to-show', () => {
    win.show();
    win.maximize(); // fill the screen — especially good on ultrawide
  });

  // Open DevTools on Cmd+Option+I (comment out for cleaner demo)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when clicking dock icon
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit on all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
