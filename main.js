// This is free and unencumbered software released into the public domain.
// See LICENSE for details

const {app, BrowserWindow, Menu} = require('electron');

const { ipcMain } = require('electron-better-ipc');

const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

autoUpdater.autoDownload = false

log.info('App starting...');

//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = []
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}

let win;

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}

function createDefaultWindow() {
  win = new BrowserWindow();
  win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  return win;
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})

// autoUpdater.on('update-available', (info) => {
//   sendStatusToWindow('Update available.');
// })

autoUpdater.on('update-available', (info) => {

  console.log("main: update available")

  (async () => {
    const isConfirmed = await ipcMain.callFocusedRenderer('confirmation');

    if (isConfirmed) {
      autoUpdater.downloadUpdate()
    } else {
      alert("Updates won't be downloaded")
    }
  })();
})

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})

// autoUpdater.on('update-downloaded', (info) => {
//   sendStatusToWindow('Update downloaded');
// })

autoUpdater.on('update-downloaded', (info) => {

  console.log("main: update downloaded")

  (async () => {
    const isConfirmed = await ipcMain.callFocusedRenderer('confirmation');

    if (isConfirmed) {
      autoUpdater.quitAndInstall();  
    } else {
      alert("Updates won't be installed")
    }
  })();
})

app.on('ready', function() {
  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createDefaultWindow();

  autoUpdater.checkForUpdates();
})

app.on('window-all-closed', () => {
  app.quit();
})
