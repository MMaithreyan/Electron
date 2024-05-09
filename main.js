const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let selectBluetoothCallback = null;
let bluetoothDeviceList = [];

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.openDevTools();
  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    selectBluetoothCallback = callback;
    bluetoothDeviceList = deviceList;
    // console.log("Available devices: ", deviceList)
    mainWindow.webContents.send('bluetooth-devices', deviceList);
  });

  ipcMain.on('connect-to-device', (event, deviceName) => {
    console.log('Device Name main:', deviceName);
    const result = bluetoothDeviceList.find((device) => device.deviceName === deviceName);

    console.log('RESULT', result);
    if (result) {
      if (selectBluetoothCallback != null) {
        console.log('Callback for device:', deviceName);
        selectBluetoothCallback(result.deviceId);
      } else {
        console.log('selectBluetoothCallback is null');
      }
    } else {
      // The device wasn't found so we need to either wait longer (eg until the
      // device is turned on) or until the user cancels the request
      console.log('Device not found:', deviceName);
    }
  });

  ipcMain.on('cancel-bluetooth-request', () => {
    selectBluetoothCallback('');
  });

  ipcMain.on('bluetooth-pairing-response', (event, response) => {
    selectBluetoothCallback(response.deviceId, response.deviceName);
  });
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
